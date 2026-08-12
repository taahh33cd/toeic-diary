#!/usr/bin/env python3
"""
Build JSON đề full test EST 2024.

Usage:
    python scripts/full-tests/build_est2024.py --test 1
    python scripts/full-tests/build_est2024.py --all
    python scripts/full-tests/build_est2024.py --all --src "D:/ETS 2024"

Nguồn khác 2026 khá nhiều, đừng dùng lẫn parser:
    <src>/ ETS 2024 LC/<n>/            (CHÚ Ý: tên thư mục có dấu cách ở đầu)
        Test_01-07.mp3                       audio (không dùng, đã có trên Supabase)
        transcript_Test_01-07.mp3.json       ASR thô: [{timestamp, text}] — KHÔNG có
                                             options/answer/keywords như 2026
        32-100.docx                          câu hỏi Part 3/4, text thuần
        ảnh/*.png                            6 ảnh Part 1 + 5 graphic P3/P4
    <src>/ETS 2024 RC/TEST <n> RC.docx       Part 5/6/7 (chỉ đề 1,2 có marker PART)
    <src>/Đáp án ETS 2024/TEST <n>-2024.docx đáp án, 9 notation khác nhau

Audio đã có sẵn trên Supabase từ pipeline dictation E24:
    <STORAGE>/audio/tests/ets-2024-test-<n>/q{start}-{end}.mp3

Ra: lib/full-tests/data/est-2024-test-<n>.json
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (  # noqa: E402
    OUT_DIR, STORAGE_BASE, apply_overrides, clean, docx_text, fmt_ranges,
    parse_glossary, parse_mcq_block, part_of, passage_labels,
    PASSAGE_HEAD, write_catalog,
)

DEFAULT_SRC = r"D:/ETS 2024"
EXAM_SLUG = "est-2024"
EXAM_TITLE = "PRACTICE TEST EST 2024"
AUDIO_BASE = f"{STORAGE_BASE}/audio/tests/ets-2024-test-{{n}}"

# ── Chuẩn hoá ký tự ──────────────────────────────────────────────────────────
# File gốc lẫn chữ Cyrillic nhìn y hệt Latin ("91. В" là U+0412). Không đổi thì
# [A-D] trượt sạch những câu đó — riêng lỗi này từng làm mất 35 câu ở đề 10.
CYRILLIC = {"\u0410": "A", "\u0412": "B", "\u0421": "C", "\u0415": "E", "\u041e": "O"}


def normalize(text: str) -> str:
    for bad, good in CYRILLIC.items():
        text = text.replace(bad, good)
    # "106. D107. D" — thiếu dấu cách giữa đáp án và số câu kế tiếp
    return re.sub(r"([A-D])(\d)", r"\1 \2", text)


# ── Đường dẫn nguồn ──────────────────────────────────────────────────────────

class Src:
    def __init__(self, root: str):
        self.root = Path(root)

    def lc_dir(self, n: int) -> Path:
        # tên thư mục LC có dấu cách ở đầu trong bộ gốc, nên dò thay vì ghép cứng
        for name in os.listdir(self.root):
            if name.strip().lower().endswith("lc"):
                p = self.root / name / str(n)
                if p.is_dir():
                    return p
        raise FileNotFoundError(f"không thấy folder LC của đề {n}")

    def rc_docx(self, n: int) -> Path:
        return self.root / "ETS 2024 RC" / f"TEST {n} RC.docx"

    def key_docx(self, n: int) -> Path:
        return self.root / "Đáp án ETS 2024" / f"TEST {n}-2024.docx"

    def questions_docx(self, n: int) -> Path:
        return self.lc_dir(n) / "32-100.docx"

    def images(self, n: int) -> dict[str, Path]:
        d = self.lc_dir(n) / "ảnh"
        if not d.is_dir():
            return {}
        return {f.stem: f for f in sorted(d.iterdir()) if f.suffix.lower() == ".png"}


# ── Transcript (ASR thô) ─────────────────────────────────────────────────────

TRANS_RE = re.compile(r"^transcript_Test_\d{2}-(\d{1,3})(?:-(\d{1,3}))?\.mp3\.json$")
# "Number seven." / "Number 32." — lời dẫn của giám khảo, không thuộc nội dung
NARRATION = re.compile(
    r"^\s*Number\s+[\w\-]+\.?\s*(?:Look at the picture[^.]*\.)?\s*", re.I)


def read_transcripts(src: Src, n: int) -> dict[tuple[int, int], str]:
    """{(qstart, qend): transcript đã ghép}"""
    out: dict[tuple[int, int], str] = {}
    d = src.lc_dir(n)
    for f in sorted(os.listdir(d)):
        m = TRANS_RE.match(f)
        if not m:
            continue
        a = int(m.group(1))
        b = int(m.group(2)) if m.group(2) else a
        try:
            segs = json.loads((d / f).read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError:
            continue
        text = " ".join(s.get("text", "").strip() for s in segs if isinstance(s, dict))
        out[(a, b)] = clean(text)
    return out


OPTION_SPLIT = re.compile(r"(?:^|\s)\(?([A-D])[\.\)]\s+")


def transcript_options(text: str, part: int) -> dict[str, str] | None:
    """Part 1/2 không có sẵn phương án, phải cắt từ text ASR theo mốc 'A.' 'B.'…
    ASR bỏ sót khá thường xuyên nên trả None để bên gọi dùng transcript thô."""
    need = ["A", "B", "C", "D"] if part == 1 else ["A", "B", "C"]
    marks = [(m.start(), m.group(1), m.end()) for m in OPTION_SPLIT.finditer(text)]
    # chỉ giữ lần xuất hiện đầu của mỗi chữ cái, theo đúng thứ tự A→B→C(→D)
    seen: dict[str, tuple[int, int]] = {}
    for start, letter, end in marks:
        seen.setdefault(letter, (start, end))
    if not all(l in seen for l in need):
        return None
    opts: dict[str, str] = {}
    ordered = [(seen[l][1], l) for l in need]
    for i, (begin, letter) in enumerate(ordered):
        stop = ordered[i + 1][0] - len(f"({letter}) ") if i + 1 < len(ordered) else len(text)
        stop = min(max(stop, begin), len(text))
        # cắt tới ngay trước mốc chữ cái kế tiếp
        nxt = seen[need[i + 1]][0] if i + 1 < len(need) else len(text)
        opts[letter] = clean(text[begin:nxt])
    return opts if all(opts.get(l) for l in need) else None


def strip_narration(text: str) -> str:
    return clean(NARRATION.sub("", text or ""))


# ── Đáp án: 9 notation, gom từ 5 nguồn rồi đối chiếu chéo ────────────────────

Q = r"(?:Questions?|Câu)"
ANS_WORD = r"(?:Đáp án|Chọn)"
LABELLED = re.compile(
    rf"{Q}[ \t]*(\d{{1,3}})[^\n]{{0,30}}?{ANS_WORD}[ \t]*[:\-]?[ \t]*\(?([A-D])\)?(?!\w)", re.I)
DIRECT = re.compile(
    rf"{Q}[ \t]*(\d{{1,3}})[ \t]*[:.\-][ \t]*\(?([A-D])\)?(?!\w)", re.I)
QMARK = re.compile(rf"{Q}[ \t]*(\d{{1,3}})(?!\d)", re.I)
FLOAT = re.compile(
    rf"(?:{ANS_WORD}[ \t]*[:\-]?[ \t]*\(?([A-D])\)?(?!\w)"
    r"|Phương án[ \t]*\(([A-D])\)[ \t]*là[ \t]*(?:phù[ \t]*hợp|đúng|chính[ \t]*xác))", re.I)
PAIR = re.compile(r"(?<![\d.])(\d{1,3})[ \t]*[-.:)]?[ \t]*([A-D])(?!\w)")
ELIMINATE = re.compile(
    r"\(([A-D])\)[ \t]*,[ \t]*\(([A-D])\)[ \t]*(?:,|và|and)?[ \t]*\(([A-D])\)"
    r"[^\n]{0,60}?(?:không được đề cập|không phù hợp|sai)", re.I)
DROP = re.compile(r"Loại[ \t]*(?:phương án[ \t]*)?\(([A-D])\)", re.I)
MIN_RUN = 4


def table_pairs(text: str) -> dict[int, str]:
    """Bảng đáp án xuất hiện ở 3 dạng: nhiều cặp trên một dòng, mỗi dòng một cặp,
    và bị ngắt thành nhiều dòng ngắn. Dùng cả hai chiến lược rồi hợp nhất."""
    out: dict[int, str] = {}
    lines = text.split("\n")

    # theo dòng — bắt được dòng có tiền tố ("Đáp án: 1. D | 2. B | ...")
    for line in lines:
        hits = [(int(a), b) for a, b in PAIR.findall(line)]
        hits = [h for h in hits if 1 <= h[0] <= 200]
        if len(hits) < MIN_RUN:
            continue
        nums = [h[0] for h in hits]
        if len(set(nums)) != len(nums) or max(nums) - min(nums) > 60:
            continue
        for num, letter in hits:
            out.setdefault(num, letter)

    # theo khối — dòng nào bỏ hết cặp đi thì gần như không còn chữ
    block: list[tuple[int, str]] = []

    def flush():
        nums = [n for n, _ in block]
        if len(block) >= MIN_RUN and len(set(nums)) == len(nums):
            for num, letter in block:
                out.setdefault(num, letter)

    for line in lines:
        s = line.strip()
        hits = [(int(a), b) for a, b in PAIR.findall(s)]
        hits = [h for h in hits if 1 <= h[0] <= 200]
        rest = re.sub(r"(?<![\d.])\d{1,3}[ \t]*[-.:)]?[ \t]*[A-D](?!\w)", "", s)
        rest = re.sub(r"[\s|,.\-–]+", "", rest)
        if hits and len(rest) <= 2:
            block.extend(hits)
        elif s:
            flush()
            block = []
    flush()
    return out


def question_blocks(text: str) -> list[tuple[int, str]]:
    """[(số câu, đoạn văn bản của câu đó)] — cắt tại mỗi mốc "Question N"."""
    marks = []
    for m in QMARK.finditer(text):
        num = int(m.group(1))
        # "Questions 32-34" là header dải, không phải một câu
        if 1 <= num <= 200 and not re.match(r"[ \t]*[-–][ \t]*\d", text[m.end():m.end() + 4]):
            marks.append((m.start(), num))
    out = []
    for i, (pos, num) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        out.append((num, text[pos:end]))
    return out


def float_pairs(text: str) -> dict[int, str]:
    """"→ Đáp án A" đứng rời ⇒ gán cho mốc câu gần nhất phía trước."""
    out: dict[int, str] = {}
    for num, body in question_blocks(text):
        m = FLOAT.search(body)
        if m:
            out.setdefault(num, (m.group(1) or m.group(2)).upper())
    return out


def eliminate_pairs(text: str) -> dict[int, str]:
    """Suy từ lối loại trừ: nêu 3 phương án sai thì phương án còn lại là đáp án.
    Hai lối viết — liệt kê trong một câu, và "Loại (A) vì…" mỗi dòng một chữ."""
    out: dict[int, str] = {}
    for num, body in question_blocks(text):
        m = ELIMINATE.search(body)
        wrong = ({m.group(1).upper(), m.group(2).upper(), m.group(3).upper()} if m
                 else {x.upper() for x in DROP.findall(body)})
        left = {"A", "B", "C", "D"} - wrong
        if len(wrong) == 3 and len(left) == 1:
            out.setdefault(num, left.pop())
    return out


# Ưu tiên giảm dần. "eliminate" là suy luận nên xếp cuối: đo trên 10 đề nó trùng
# nguồn khác 377 câu, lệch 8 câu — xếp cuối để 8 câu đó nhường nguồn chắc hơn.
SOURCE_ORDER = ["labelled", "direct", "table", "float", "eliminate"]


def read_key(src: Src, n: int) -> tuple[dict[int, str], dict[int, dict], list[str]]:
    text = normalize(docx_text(src.key_docx(n)))
    sources = {
        "labelled": {int(a): b.upper() for a, b in LABELLED.findall(text)},
        "direct": {int(a): b.upper() for a, b in DIRECT.findall(text)},
        "table": table_pairs(text),
        "float": float_pairs(text),
        "eliminate": eliminate_pairs(text),
    }
    answers: dict[int, str] = {}
    for name in reversed(SOURCE_ORDER):
        answers.update(sources[name])
    answers = {q: a for q, a in answers.items() if 1 <= q <= 200}
    # Part 2 chỉ có A/B/C — ra 'D' là dấu hiệu bắt nhầm
    bogus = [q for q, a in answers.items() if 7 <= q <= 31 and a == "D"]
    for q in bogus:
        answers.pop(q, None)

    conflicts = sorted({q for i, a in enumerate(SOURCE_ORDER) for b in SOURCE_ORDER[i + 1:]
                        for q in sources[a] if q in sources[b] and sources[a][q] != sources[b][q]})
    warnings = []
    if bogus:
        warnings.append(f"loại {len(bogus)} câu Part 2 bị bắt nhầm ra 'D': {bogus}")
    if conflicts:
        warnings.append(f"{len(conflicts)} câu các nguồn đáp án không thống nhất "
                        f"(đã lấy nguồn tin cậy hơn): {conflicts[:10]}")
    return answers, read_explanations(text), warnings


GLOSS_HEAD = re.compile(r"(?im)^[ \t]*(?:Từ vựng[^\n:]*|Glossary[^\n:]*|Vocabulary[^\n:]*):?[ \t]*$")


def read_explanations(text: str) -> dict[int, dict]:
    """Giải thích + glossary theo từng câu. Format 2024 rất tạp nên giữ nguyên
    văn phần lý giải, chỉ tách riêng khối từ vựng khi nhận ra tiêu đề."""
    out: dict[int, dict] = {}
    for num, body in question_blocks(text):
        if num in out:
            continue
        body = body.strip()
        gloss: list[dict] = []
        m = GLOSS_HEAD.search(body)
        if m:
            gloss = parse_glossary(body[m.end():])
            body = body[:m.start()]
        # bỏ dòng mốc "Question 32" ở đầu cho đỡ lặp
        body = re.sub(rf"^{Q}[ \t]*\d{{1,3}}[ \t]*[:.\-]?[ \t]*", "", body).strip()
        if body or gloss:
            out[num] = {"reasoning": body or None, "translation": None, "glossary": gloss}
    return out


# ── Reading: 8/10 đề không có marker PART, cắt theo số câu ───────────────────

def parse_reading(rc_text: str) -> tuple[dict[int, dict], list[dict]]:
    """Trả (câu Part 5, các set Part 6/7). Không dựa vào marker PART vì chỉ đề
    1 và 2 có; ranh giới suy từ số câu và header 'Questions N-M refer to'."""
    heads = list(PASSAGE_HEAD.finditer(rc_text))
    first_set = heads[0].start() if heads else len(rc_text)
    p5 = parse_mcq_block(rc_text[:first_set], 101, 130)

    sets = []
    for i, h in enumerate(heads):
        lo, hi = int(h.group(1)), int(h.group(2))
        if not (131 <= lo <= 200):
            continue
        end = heads[i + 1].start() if i + 1 < len(heads) else len(rc_text)
        body = rc_text[h.end():end]

        cut = len(body)
        for m in re.finditer(r"^[ \t]*(\d{1,3})\.[ \t]*", body, re.M):
            if lo <= int(m.group(1)) <= hi:
                cut = m.start()
                break
        passage_raw, q_raw = body[:cut].strip("\n "), body[cut:]

        # Docx 2024 là text phẳng: không ngắt trang, không bảng, không dấu ngăn,
        # nên passage đôi/ba KHÔNG tách được — giữ nguyên một khối.
        labels = passage_labels(h.group(0), 1)
        sets.append({
            "part": part_of(lo),
            "questionStart": lo,
            "questionEnd": hi,
            "intro": clean(h.group(0)),
            "passages": [{"label": labels[0], "text": passage_raw}] if passage_raw else [],
            "_questions": parse_mcq_block(q_raw, lo, hi),
        })
    return p5, sets


# ── Dựng một đề ──────────────────────────────────────────────────────────────

def build(src: Src, n: int, image_map: dict[str, str]) -> dict:
    warnings: list[str] = []
    transcripts = read_transcripts(src, n)
    answers, explanations, key_warn = read_key(src, n)
    warnings += key_warn

    lcq = parse_mcq_block(docx_text(src.questions_docx(n)), 32, 100)
    p5, reading_sets = parse_reading(docx_text(src.rc_docx(n)))
    images = src.images(n)

    def img_url(stem: str) -> str | None:
        key = f"test{n}/{stem}"
        if key in image_map:
            return image_map[key]
        if stem in images:
            warnings.append("còn ảnh chưa có URL (chạy upload-images-2024)")
        return None

    broken: list[int] = []

    def mk_question(q: int, prompt, options, show_text: bool) -> dict:
        part = part_of(q)
        needs_prompt = part != 6
        is_broken = show_text and (not options or (needs_prompt and not prompt))
        if is_broken:
            broken.append(q)
        return {
            "number": q,
            "part": part,
            "prompt": prompt or None,
            "options": options or None,
            "showText": show_text,
            "broken": is_broken,
            "answer": answers.get(q),
            "explanation": explanations.get(q),
        }

    groups: list[dict] = []
    no_options: list[int] = []

    # Part 1/2 — phương án phải cắt từ ASR, thiếu thì để transcript thô gánh
    for q in range(1, 32):
        raw = transcripts.get((q, q), "")
        part = part_of(q)
        opts = transcript_options(raw, part)
        if opts is None and raw:
            no_options.append(q)
        groups.append({
            "part": part,
            "questionStart": q,
            "questionEnd": q,
            "audio": f"q{q}-{q}.mp3",
            "image": img_url(str(q)) if part == 1 else None,
            "transcript": strip_narration(raw) or None,
            "keywords": [],
            "questions": [mk_question(q, None, opts, False)],
        })

    # Part 3/4 — nhóm 3 câu một đoạn audio
    for (a, b), raw in sorted(transcripts.items()):
        if a == b or not (32 <= a <= 100):
            continue
        groups.append({
            "part": part_of(a),
            "questionStart": a,
            "questionEnd": b,
            "audio": f"q{a}-{b}.mp3",
            "image": img_url(f"{a}-{b}"),
            "transcript": raw or None,
            "keywords": [],
            "questions": [
                mk_question(q, lcq.get(q, {}).get("prompt"), lcq.get(q, {}).get("options"), True)
                for q in range(a, b + 1)
            ],
        })

    # Part 5 — câu đơn
    for q in range(101, 131):
        it = p5.get(q)
        if not it:
            warnings.append(f"câu {q}: không parse được từ RC docx")
            continue
        groups.append({
            "part": 5,
            "questionStart": q,
            "questionEnd": q,
            "questions": [mk_question(q, it["prompt"], it["options"], True)],
        })

    # Part 6/7 — set passage
    for s in reading_sets:
        qmap = s.pop("_questions")
        s["questions"] = [
            mk_question(q, qmap.get(q, {}).get("prompt"), qmap.get(q, {}).get("options"), True)
            for q in range(s["questionStart"], s["questionEnd"] + 1)
        ]
        groups.append(s)

    groups.sort(key=lambda g: g["questionStart"])
    all_q = [q for g in groups for q in g["questions"]]

    patched = apply_overrides(f"est-2024-test-{n}", all_q)
    if patched:
        warnings.append(f"đã vá thủ công câu: {patched}")
        broken = [q for q in broken if q not in patched]
        for q in all_q:
            if q["number"] in patched and q["answer"]:
                answers[q["number"]] = q["answer"]

    numbers = {q["number"] for q in all_q}
    missing_q = sorted(set(range(1, 201)) - numbers)
    missing_ans = sorted(q["number"] for q in all_q if not q["answer"])
    if missing_q:
        warnings.append(f"thiếu câu hỏi: {fmt_ranges(missing_q)}")
    if no_options:
        warnings.append(f"{len(no_options)} câu Part 1/2 không cắt đủ phương án từ ASR "
                        f"(dùng transcript thô): {fmt_ranges(no_options)}")

    return {
        "examSlug": EXAM_SLUG,
        "examTitle": EXAM_TITLE,
        "testNumber": n,
        "slug": f"est-2024-test-{n}",
        "title": f"{EXAM_TITLE} — Test {n}",
        "audioBase": AUDIO_BASE.format(n=n),
        "locked": bool(missing_ans),
        "lockReason": (f"Thiếu đáp án gốc cho {len(missing_ans)} câu — đang bổ sung."
                       if missing_ans else None),
        "stats": {
            "questions": len(all_q),
            "answered": len(all_q) - len(missing_ans),
            "missingAnswers": missing_ans,
            "brokenQuestions": sorted(broken),
        },
        "groups": groups,
        "warnings": warnings,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", type=int, help="số đề (1-10)")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--src", default=DEFAULT_SRC)
    ap.add_argument("--image-map", default=str(OUT_DIR / "images-est-2024.json"))
    args = ap.parse_args()

    if not args.all and not args.test:
        ap.error("cần --test N hoặc --all")

    src = Src(args.src)
    if not src.root.is_dir():
        print(f"✗ không thấy folder nguồn: {src.root}", file=sys.stderr)
        return 1

    image_map = json.load(open(args.image_map, encoding="utf-8")) if os.path.isfile(args.image_map) else {}
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    catalog: dict[int, dict] = {}
    cat_file = OUT_DIR / f"catalog-{EXAM_SLUG}.json"
    if cat_file.is_file():
        catalog = {int(e["testNumber"]): e for e in json.load(open(cat_file, encoding="utf-8"))["tests"]}

    rc = 0
    for n in (range(1, 11) if args.all else [args.test]):
        try:
            data = build(src, n, image_map)
        except Exception as e:
            print(f"✗ đề {n}: {type(e).__name__}: {e}", file=sys.stderr)
            rc = 1
            continue
        out = OUT_DIR / f"est-2024-test-{n}.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        st = data["stats"]
        flag = " [KHOÁ]" if data["locked"] else ""
        print(f"✓ đề {n:>2}{flag}: {st['questions']}/200 câu · {st['answered']} đáp án · "
              f"{len(data['groups'])} nhóm · {out.stat().st_size // 1024}KB")
        for w in dict.fromkeys(data["warnings"]):
            print(f"    ⚠ {w}")
        catalog[n] = {
            "slug": data["slug"], "testNumber": n, "title": data["title"],
            "locked": data["locked"], "lockReason": data["lockReason"], **st,
        }

    path = write_catalog(EXAM_SLUG, EXAM_TITLE, catalog)
    print(f"\n✓ catalog: {len(catalog)} đề → {path.relative_to(Path(__file__).resolve().parents[2])}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
