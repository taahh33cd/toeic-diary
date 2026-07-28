#!/usr/bin/env python3
"""
Build JSON đề full test EST 2026 từ folder data gốc (docx + transcript + ảnh).

Usage:
    python scripts/full-tests/build_est2026.py --test 1
    python scripts/full-tests/build_est2026.py --all
    python scripts/full-tests/build_est2026.py --all --src "D:/.../ETS 2026"

Nguồn (mỗi đề N):
    <src>/ETS 2026 LC/test N/            54 file transcript (.txt hoặc .json)
                            /*.docx      JSON câu hỏi 32-100
                            /ảnh/*.png   6 ảnh Part 1 + graphic Part 3/4
    <src>/ETS 2026 RC/Test N.docx        text Part 5/6/7 + passage
    <src>/đáp án ets 2026/testN-2026.docx  đáp án + dịch + giải thích + glossary

Audio KHÔNG cần upload — đã có trên Supabase Storage từ pipeline dictation E26:
    <SUPABASE>/storage/v1/object/public/audio/tests/ets-2026-test-N/q{start}-{end}.mp3

Ra: lib/full-tests/data/est-2026-test-N.json
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT_DIR = REPO / "lib" / "full-tests" / "data"
DEFAULT_SRC = r"D:/Compressed/ETS 2026-20260727T130940Z-1-001/ETS 2026"
AUDIO_BASE = ("https://tcpolxjxtgptbzpbtwvq.supabase.co/storage/v1/object/public"
              "/audio/tests/ets-2026-test-{n}")

                                        # Khoá đề nào là suy từ độ phủ đáp án thật
                                        # (xem `locked` bên dưới), không khai báo cứng.

PART_RANGES = [(1, 1, 6), (2, 7, 31), (3, 32, 70), (4, 71, 100),
               (5, 101, 130), (6, 131, 146), (7, 147, 200)]


def part_of(q: int) -> int:
    for p, a, b in PART_RANGES:
        if a <= q <= b:
            return p
    raise ValueError(f"câu {q} ngoài phạm vi 1-200")


# ─────────────────────────── docx → text ────────────────────────────────────

def docx_text(path: str | Path) -> str:
    xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf8")
    xml = re.sub(r"<w:br\s*/>", "\n", xml)
    xml = re.sub(r"<w:tab\s*/>", "\t", xml)
    xml = re.sub(r"</w:p>", "\n", xml)
    txt = html.unescape(re.sub(r"<[^>]+>", "", xml))
    return txt.replace("\xa0", " ").replace("\r", "\n")


def clean(s: str) -> str:
    return re.sub(r"[ \t]+", " ", (s or "")).strip()


# ─────────────────────────── đường dẫn nguồn ────────────────────────────────

class Src:
    def __init__(self, root: str):
        self.root = Path(root)

    def lc_dir(self, n: int) -> Path:
        # đề 1 dùng "test 1" (có dấu cách), các đề khác "testN"
        for name in (f"test {n}", f"test{n}"):
            p = self.root / "ETS 2026 LC" / name
            if p.is_dir():
                return p
        raise FileNotFoundError(f"không thấy folder LC của đề {n}")

    def rc_docx(self, n: int) -> Path:
        return self.root / "ETS 2026 RC" / f"Test {n}.docx"

    def key_docx(self, n: int) -> Path:
        return self.root / "đáp án ets 2026" / f"test{n}-2026.docx"

    def lcq_docx(self, n: int) -> Path:
        d = self.lc_dir(n)
        cand = [f for f in os.listdir(d) if f.endswith(".docx")]
        if not cand:
            raise FileNotFoundError(f"không thấy docx câu hỏi 32-100 của đề {n}")
        return d / cand[0]

    def images(self, n: int) -> dict[str, Path]:
        d = self.lc_dir(n) / "ảnh"
        if not d.is_dir():
            return {}
        return {f.stem: f for f in sorted(d.iterdir()) if f.suffix.lower() == ".png"}


# ─────────────────────────── transcript LC ──────────────────────────────────

TRANS_RE = re.compile(r"^E26-T(\d{2})-(\d{1,3})-(\d{1,3})\.(txt|json)$")


def read_transcripts(src: Src, n: int) -> dict[tuple[int, int], dict]:
    """{(qstart, qend): payload}"""
    out: dict[tuple[int, int], dict] = {}
    d = src.lc_dir(n)
    for f in sorted(os.listdir(d)):
        m = TRANS_RE.match(f)
        if not m:
            continue
        a, b = int(m.group(2)), int(m.group(3))
        raw = (d / f).read_text(encoding="utf-8-sig").strip()
        try:
            out[(a, b)] = json.loads(raw)
        except json.JSONDecodeError:
            out[(a, b)] = {"transcript": raw}
    return out


def read_lc_questions(src: Src, n: int) -> dict[int, dict]:
    """Câu 32-100: {number: {prompt, options}} — docx chứa JSON, khoá là
    'number' (phần lớn đề) hoặc 'question_number' (đề 6)."""
    raw = docx_text(src.lcq_docx(n))
    i, j = raw.find("["), raw.rfind("]")
    if i < 0 or j < 0:
        raise ValueError(f"đề {n}: không tìm thấy mảng JSON trong docx câu hỏi")
    out = {}
    for it in json.loads(raw[i:j + 1]):
        q = it.get("number", it.get("question_number"))
        out[int(q)] = {"prompt": clean(it.get("question", "")), "options": it["options"]}
    return out


def transcript_options(text: str) -> dict[str, str] | None:
    """Part 1: '(A) ... (B) ... (C) ... (D) ...' → dict phương án."""
    found = re.findall(r"\(([A-D])\)\s*([^\n(]+)", text or "")
    d = {k: clean(v) for k, v in found}
    return d if sorted(d) == ["A", "B", "C", "D"] else None


def norm_keywords(kws) -> list[dict]:
    out = []
    for k in kws or []:
        if not isinstance(k, dict):
            continue
        out.append({
            "term": clean(k.get("word", "")),
            "ipa": clean(k.get("pronunciation", k.get("ipa", ""))),
            "pos": clean(k.get("pos", k.get("partOfSpeech", ""))),
            "meaning": clean(k.get("meaning", "")),
        })
    return [k for k in out if k["term"]]


# ─────────────────────────── RC docx (Part 5/6/7) ───────────────────────────

def split_parts(text: str) -> dict[int, str]:
    marks = {}
    for m in re.finditer(r"^[ \t]*PART[ \t]+([567])[ \t]*$", text, re.M):
        marks[int(m.group(1))] = m.start()
    if len(marks) != 3:
        raise ValueError(f"RC docx: cần 3 marker PART, thấy {sorted(marks)}")
    items = sorted(marks.items(), key=lambda kv: kv[1])
    out = {}
    for i, (p, s) in enumerate(items):
        e = items[i + 1][1] if i + 1 < len(items) else len(text)
        out[p] = text[s:e]
    return out


def parse_mcq_block(block: str, lo: int, hi: int) -> dict[int, dict]:
    """Bóc '101. <đề>' + '(A)..(D)' trong khoảng câu [lo, hi]."""
    out: dict[int, dict] = {}
    cur = None
    for line in block.split("\n"):
        s = line.strip()
        mq = re.match(r"^(\d{1,3})\.\s*(.*)$", s)
        mo = re.match(r"^\(([A-D])\)\s*(.*)$", s)
        if mq and lo <= int(mq.group(1)) <= hi:
            cur = int(mq.group(1))
            out[cur] = {"prompt": clean(mq.group(2)), "options": {}}
        elif mo and cur is not None:
            out[cur]["options"][mo.group(1)] = clean(mo.group(2))
    return out


PASSAGE_HEAD = re.compile(r"^[ \t]*Questions?[ \t]+(\d{1,3})[ \t]*[-–][ \t]*(\d{1,3})[ \t]+refer[^\n]*$", re.M)


def passage_labels(intro: str, count: int) -> list[str]:
    """'refer to the following article and e-mail.' → ['article', 'e-mail']"""
    m = re.search(r"following\s+(.+?)\.?\s*$", intro.strip())
    if m:
        raw = re.split(r",\s*and\s+|\s+and\s+|,\s*", m.group(1))
        labels = [clean(x) for x in raw if clean(x)]
        if len(labels) == count:
            return [l[:1].upper() + l[1:] for l in labels]
    return [f"Passage {i + 1}" for i in range(count)]


def parse_passage_sets(block: str, part: int) -> list[dict]:
    """Part 6/7: tách từng set = intro + passage(s) + câu hỏi."""
    heads = list(PASSAGE_HEAD.finditer(block))
    sets = []
    for i, h in enumerate(heads):
        lo, hi = int(h.group(1)), int(h.group(2))
        end = heads[i + 1].start() if i + 1 < len(heads) else len(block)
        body = block[h.end():end]

        # passage = phần trước marker câu hỏi đầu tiên trong khoảng [lo, hi]
        cut = len(body)
        for m in re.finditer(r"^[ \t]*(\d{1,3})\.[ \t]*", body, re.M):
            if lo <= int(m.group(1)) <= hi:
                cut = m.start()
                break
        passage_raw, q_raw = body[:cut], body[cut:]

        # Dấu ngăn passage là dòng chỉ có đúng '***'. Không nới lỏng: xếp hạng sao
        # trong bài review ('*****') sẽ bị hiểu sai thành dấu ngăn.
        chunks = [c.strip("\n ") for c in re.split(r"(?m)^[ \t]*\*{3}[ \t]*$", passage_raw) if c.strip()]
        labels = passage_labels(h.group(0), len(chunks))
        passages = [{"label": labels[k], "text": chunks[k].strip()} for k in range(len(chunks))]

        qmap = parse_mcq_block(q_raw, lo, hi)
        sets.append({
            "part": part,
            "questionStart": lo,
            "questionEnd": hi,
            "intro": clean(h.group(0)),
            "passages": passages,
            "_questions": qmap,
        })
    return sets


# ─────────────────────────── docx đáp án ────────────────────────────────────

MARKER = re.compile(
    r"(?:(?:Đoạn|ĐOẠN|Questions?|Câu|CÂU)[ \t]*(?P<a>\d{1,3})[ \t]*[-–][ \t]*(?P<b>\d{1,3})"
    r"|(?:Câu|CÂU)[ \t]*(?P<c>\d{1,3}))(?P<tail>[^\n]{0,22})"
)
SECTION_KW = r"(?:Transcript|Bản dịch|Nội dung|Đáp án|Giải thích|Glossary|Từ vựng|Paraphrase|Vocabulary)"
# ". Transcript..." ngay sau số ⇒ chữ số cuối là số thứ tự mục, không thuộc số câu
# ("Câu 11. Transcript" = Câu 1 + mục "1.")
RUNON = re.compile(rf"^\s*\.\s*{SECTION_KW}")
# Cho phép khoảng trắng lọt vào trong ngoặc: có file viết "(C )" thay vì "(C)".
ANS = re.compile(r"Đáp án(?:[ \t]+đúng)?[^\(\n]{0,30}\([ \t]*(?P<l>[A-D])[ \t]*\)")
SUB = re.compile(r"(?:^|\n)[ \t]*(?P<n>\d{1,3})[\.:)][ \t]")


def key_blocks(text: str) -> list[tuple[str, int, int, str]]:
    ms = list(MARKER.finditer(text))
    out = []
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(text)
        bstart = m.start("tail")
        if m.group("c"):
            digits = m.group("c")
            if RUNON.match(m.group("tail") or "") and len(digits) > 1:
                digits = digits[:-1]
                bstart -= 1
            q = int(digits)
            if 1 <= q <= 200:
                out.append(("q", q, q, text[bstart:end]))
        else:
            a, b = int(m.group("a")), int(m.group("b"))
            if 1 <= a <= b <= 200:
                out.append(("g", a, b, text[bstart:end]))
    return out


GLOSS_LINE = re.compile(
    r"^[\-\*\u2022]?\s*(?P<term>[^:()]{1,60}?)\s*"
    r"(?:\((?P<pos>[^)]{1,30})\))?\s*(?:/(?P<ipa>[^/]{1,60})/)?\s*:\s*(?P<meaning>.+)$"
)
LBL_TRANS = re.compile(rf"^\s*\d*\.?\s*(?:Bản dịch|Nội dung đề|Transcript\s*&\s*Bản dịch|Dịch nghĩa)\b.*?:", re.I)
LBL_REASON = re.compile(r"^\s*\d*\.?\s*Giải thích\b.*?:", re.I)
LBL_GLOSS = re.compile(r"^\s*\d*\.?\s*(?:Glossary|Vocabulary|Từ vựng)\b.*?:", re.I)


# Nhiều docx viết glossary liền một dòng: "listen to (v): lắng nghe idea (n): ý tưởng ..."
POS_TAGS = r"n|v|adj|adv|prep|conj|pron|num|abbr|idiom|phrase|phr\w*|phrasal verb"
GLOSS_RUNON = re.compile(
    rf"(?<=\S)[ \t]+(?=[A-Za-z][A-Za-z'\- ]{{0,28}}[ \t]*\((?:{POS_TAGS})\)[ \t]*(?:/[^/\n]{{1,60}}/[ \t]*)?:)"
)


def split_glossary_runon(text: str) -> str:
    return GLOSS_RUNON.sub("\n", text)


def parse_explanation(raw: str) -> dict:
    """Tách block đáp án thành translation / reasoning / glossary; giữ raw để fallback."""
    # chuẩn hoá format run-on: chèn newline trước các nhãn mục
    t = re.sub(rf"(?<!\n)(\d\.\s*{SECTION_KW})", r"\n\1", raw)
    t = re.sub(r"(?<!\n)(Giải thích|Glossary|Dịch nghĩa|Đáp án đúng)(\s*[:/])", r"\n\1\2", t)

    buckets = {"translation": [], "reasoning": [], "glossary": []}
    cur = None
    for line in t.split("\n"):
        s = line.strip()
        if not s:
            continue
        if LBL_GLOSS.match(s):
            cur = "glossary"
            s = LBL_GLOSS.sub("", s).strip()
        elif LBL_TRANS.match(s):
            cur = "translation"
            s = LBL_TRANS.sub("", s).strip()
        elif LBL_REASON.match(s):
            cur = "reasoning"
            s = LBL_REASON.sub("", s).strip()
        elif ANS.match(s) or re.match(r"^\d*\.?\s*Đáp án", s):
            cur = "reasoning"
            s = ""
        if cur and s:
            buckets[cur].append(s)

    glossary = []
    for line in split_glossary_runon("\n".join(buckets["glossary"])).split("\n"):
        line = line.strip()
        if not line:
            continue
        m = GLOSS_LINE.match(line)
        if m:
            glossary.append({
                "term": clean(m.group("term")),
                "pos": clean(m.group("pos") or ""),
                "ipa": clean(m.group("ipa") or ""),
                "meaning": clean(m.group("meaning")),
            })

    out = {
        "translation": "\n".join(buckets["translation"]).strip() or None,
        "reasoning": "\n".join(buckets["reasoning"]).strip() or None,
        "glossary": glossary,
    }
    # không tách được gì → giữ nguyên khối cho UI render raw
    if not out["translation"] and not out["reasoning"] and not glossary:
        out["raw"] = raw.strip()
    return out


def read_key(src: Src, n: int) -> dict[int, dict]:
    """{qnum: {answer, explanation}} — chỉ lấy những gì có thật trong file."""
    text = docx_text(src.key_docx(n))
    res: dict[int, dict] = {}
    for kind, lo, hi, body in key_blocks(text):
        if kind == "q":
            m = ANS.search(body)
            if m and lo not in res:
                res[lo] = {"answer": m.group("l"), "explanation": parse_explanation(body)}
        else:
            subs = [m for m in SUB.finditer(body) if lo <= int(m.group("n")) <= hi]
            if subs:
                for i, m in enumerate(subs):
                    e = subs[i + 1].start() if i + 1 < len(subs) else len(body)
                    seg = body[m.end():e]
                    q = int(m.group("n"))
                    am = ANS.search(seg)
                    if am and q not in res:
                        res[q] = {"answer": am.group("l"), "explanation": parse_explanation(seg)}
            else:
                letters = ANS.findall(body)
                if len(letters) == hi - lo + 1:
                    exp = parse_explanation(body)
                    for k, l in enumerate(letters):
                        if lo + k not in res:
                            res[lo + k] = {"answer": l, "explanation": exp}
    return res


def part2_answers(transcripts: dict[tuple[int, int], dict]) -> dict[int, str]:
    """Part 2 có đáp án ngay trong file transcript — nguồn độc lập để đối chiếu."""
    out = {}
    for (a, b), payload in transcripts.items():
        if a == b and 7 <= a <= 31 and isinstance(payload.get("answer"), str):
            out[a] = payload["answer"].strip().upper()[:1]
    return out


# ─────────────────────────── build 1 đề ─────────────────────────────────────

def build(src: Src, n: int, image_map: dict[str, str]) -> dict:
    transcripts = read_transcripts(src, n)
    lcq = read_lc_questions(src, n)
    key = read_key(src, n)
    images = src.images(n)
    rc = split_parts(docx_text(src.rc_docx(n)))

    warnings: list[str] = []

    # đối chiếu Part 2 giữa 2 nguồn độc lập
    truth = part2_answers(transcripts)
    for q, a in truth.items():
        if q in key and key[q]["answer"] != a:
            warnings.append(f"câu {q}: đáp án lệch (docx={key[q]['answer']}, transcript={a}) — dùng transcript")
        key.setdefault(q, {"answer": a, "explanation": {}})
        key[q]["answer"] = a  # transcript là nguồn tin cậy hơn cho Part 2

    def img_url(stem: str) -> str | None:
        k = f"test{n}/{stem}"
        if k in image_map:
            return image_map[k]
        if stem in images:
            warnings.append(f"ảnh {stem}.png chưa có URL (chạy upload ảnh) ")
        return None

    # Một số câu trong sách gốc là ảnh nên docx chỉ ghi placeholder.
    PLACEHOLDER = re.compile(r"\[\s*Refer to image|\[\s*image", re.I)

    broken: list[int] = []

    def mk_question(q: int, prompt, options, show_text: bool) -> dict:
        k = key.get(q)
        if prompt and PLACEHOLDER.search(prompt):
            warnings.append(f"câu {q}: đề bài là placeholder ảnh trong docx gốc")
            prompt, options = None, None
        # Part 6 không có đề bài (chỗ trống nằm trong passage), chỉ cần phương án.
        needs_prompt = part_of(q) != 6
        is_broken = show_text and (not options or (needs_prompt and not prompt))
        if is_broken:
            broken.append(q)
        return {
            "number": q,
            "part": part_of(q),
            "prompt": prompt or None,
            "options": options or None,
            "showText": show_text,
            "broken": is_broken,
            "answer": k["answer"] if k else None,
            "explanation": (k.get("explanation") or None) if k else None,
        }

    groups: list[dict] = []

    # ── Part 1 (1-6): 1 ảnh + 1 audio, không hiện text
    for q in range(1, 7):
        payload = transcripts.get((q, q), {})
        tr = payload.get("transcript", "")
        groups.append({
            "part": 1,
            "questionStart": q,
            "questionEnd": q,
            "audio": f"q{q}-{q}.mp3",
            "image": img_url(str(q)),
            "transcript": tr or None,
            "keywords": norm_keywords(payload.get("keywords")),
            "questions": [mk_question(q, None, transcript_options(tr), False)],
        })

    # ── Part 2 (7-31): chỉ audio, không hiện text
    for q in range(7, 32):
        payload = transcripts.get((q, q), {})
        groups.append({
            "part": 2,
            "questionStart": q,
            "questionEnd": q,
            "audio": f"q{q}-{q}.mp3",
            "transcript": payload.get("transcript") or None,
            "keywords": norm_keywords(payload.get("keywords")),
            "questions": [mk_question(q, clean(payload.get("question", "")),
                                      payload.get("options"), False)],
        })

    # ── Part 3/4 (32-100): nhóm 3 câu / 1 đoạn audio
    for (a, b), payload in sorted(transcripts.items()):
        if a == b or not (32 <= a <= 100):
            continue
        groups.append({
            "part": part_of(a),
            "questionStart": a,
            "questionEnd": b,
            "audio": f"q{a}-{b}.mp3",
            "image": img_url(f"{a}-{b}"),
            "transcript": payload.get("transcript") or None,
            "keywords": norm_keywords(payload.get("keywords")),
            "questions": [
                mk_question(q, lcq.get(q, {}).get("prompt"), lcq.get(q, {}).get("options"), True)
                for q in range(a, b + 1)
            ],
        })

    # ── Part 5 (101-130): câu đơn
    p5 = parse_mcq_block(rc[5], 101, 130)
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

    # ── Part 6/7: set passage
    for part in (6, 7):
        for s in parse_passage_sets(rc[part], part):
            qmap = s.pop("_questions")
            s["questions"] = [
                mk_question(q, qmap.get(q, {}).get("prompt"), qmap.get(q, {}).get("options"), True)
                for q in range(s["questionStart"], s["questionEnd"] + 1)
            ]
            groups.append(s)

    all_q = [q for g in groups for q in g["questions"]]
    numbers = sorted(x["number"] for x in all_q)
    missing_q = sorted(set(range(1, 201)) - set(numbers))
    missing_ans = sorted(x["number"] for x in all_q if not x["answer"])
    if missing_q:
        warnings.append(f"thiếu câu hỏi: {missing_q}")

    return {
        "examSlug": "est-2026",
        "examTitle": "PRACTICE TEST EST 2026",
        "testNumber": n,
        "slug": f"est-2026-test-{n}",
        "title": f"PRACTICE TEST EST 2026 — Test {n}",
        "audioBase": AUDIO_BASE.format(n=n),
        # Thiếu đáp án thì không chấm nổi ⇒ khoá đề. Câu lỗi (thiếu nội dung trong
        # docx gốc) thì chỉ loại khỏi mẫu số, không cần khoá cả đề.
        "locked": bool(missing_ans),
        "lockReason": (f"Thiếu đáp án gốc cho {len(missing_ans)} câu — đang bổ sung."
                       if missing_ans else None),
        "stats": {
            "questions": len(all_q),
            "answered": len(all_q) - len(missing_ans),
            "missingAnswers": missing_ans,
            "brokenQuestions": sorted(broken),
        },
        "groups": sorted(groups, key=lambda g: g["questionStart"]),
        "warnings": warnings,
    }


# ─────────────────────────── CLI ────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", type=int, help="số đề (1-10)")
    ap.add_argument("--all", action="store_true", help="build cả 10 đề")
    ap.add_argument("--src", default=DEFAULT_SRC)
    ap.add_argument("--image-map", default=str(OUT_DIR / "images.json"),
                    help="JSON map 'testN/<stem>' → URL ảnh")
    args = ap.parse_args()

    if not args.all and not args.test:
        ap.error("cần --test N hoặc --all")

    src = Src(args.src)
    if not src.root.is_dir():
        print(f"✗ không thấy folder nguồn: {src.root}", file=sys.stderr)
        return 1

    image_map: dict[str, str] = {}
    if os.path.isfile(args.image_map):
        image_map = json.load(open(args.image_map, encoding="utf-8"))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = range(1, 11) if args.all else [args.test]
    rc = 0
    catalog: dict[int, dict] = {}
    cat_file = OUT_DIR / "catalog.json"
    if cat_file.is_file():
        catalog = {int(e["testNumber"]): e for e in json.load(open(cat_file, encoding="utf-8"))["tests"]}
    for n in targets:
        try:
            data = build(src, n, image_map)
        except Exception as e:
            print(f"✗ đề {n}: {type(e).__name__}: {e}", file=sys.stderr)
            rc = 1
            continue
        out = OUT_DIR / f"est-2026-test-{n}.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        st = data["stats"]
        flag = " [KHOÁ]" if data["locked"] else ""
        print(f"✓ đề {n:>2}{flag}: {st['questions']}/200 câu · {st['answered']} đáp án · "
              f"{len(data['groups'])} nhóm · {out.stat().st_size // 1024}KB"
              + (f" · LỖI {st['brokenQuestions']}" if st["brokenQuestions"] else ""))
        for w in dict.fromkeys(data["warnings"]):
            if "ảnh" in w and "chưa có URL" in w:
                continue  # gộp lại, tránh in 11 dòng mỗi đề
            print(f"    ⚠ {w}")

        catalog[n] = {
            "slug": data["slug"],
            "testNumber": n,
            "title": data["title"],
            "locked": data["locked"],
            "lockReason": data["lockReason"],
            **st,
        }

    # catalog nhẹ cho trang danh sách — khỏi phải load 10 file JSON ~350KB
    cat = {
        "examSlug": "est-2026",
        "examTitle": "PRACTICE TEST EST 2026",
        "tests": [catalog[k] for k in sorted(catalog)],
    }
    cat_file.write_text(json.dumps(cat, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n✓ catalog: {len(cat['tests'])} đề → {cat_file.relative_to(REPO)}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
