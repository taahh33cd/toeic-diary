"""Phần dùng chung giữa các bộ đề full test (EST 2024, EST 2026, ...).

Chỉ chứa những gì thực sự không phụ thuộc bộ đề. Mỗi bộ có cách đặt tên file,
định dạng transcript và notation đáp án riêng nên phần đó nằm ở build_est<năm>.py.
"""
from __future__ import annotations

import html
import json
import re
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT_DIR = REPO / "lib" / "full-tests" / "data"
STORAGE_BASE = "https://tcpolxjxtgptbzpbtwvq.supabase.co/storage/v1/object/public"

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


# ─────────────────────────── câu hỏi trắc nghiệm ────────────────────────────

INLINE_OPTS = re.compile(r"\(([A-D])\)\s*([^(]*)")


def split_inline_options(rest: str) -> tuple[str, dict[str, str]]:
    """"(A) amazed (B) amazement (C) amazing (D) amazingly" — một số đề viết cả
    bốn phương án ngay trên dòng có số câu. Trả (phần đề bài, các phương án)."""
    found = INLINE_OPTS.findall(rest)
    if len(found) < 3:
        return rest, {}
    opts = {letter: clean(text) for letter, text in found}
    if not all(opts.values()):
        return rest, {}
    prompt = rest[:rest.index("(" + found[0][0] + ")")]
    return prompt, opts


def parse_mcq_block(block: str, lo: int, hi: int) -> dict[int, dict]:
    """Bóc '101. <đề bài>' + '(A)..(D)' trong khoảng câu [lo, hi]. Phương án có
    thể nằm ở dòng riêng, hoặc nội tuyến ngay sau số câu."""
    out: dict[int, dict] = {}
    cur = None
    for line in block.split("\n"):
        s = line.strip()
        mq = re.match(r"^(\d{1,3})\.\s*(.*)$", s)
        mo = re.match(r"^\(([A-D])\)\s*(.*)$", s)
        if mq and lo <= int(mq.group(1)) <= hi:
            cur = int(mq.group(1))
            prompt, inline = split_inline_options(mq.group(2))
            out[cur] = {"prompt": clean(prompt), "options": inline}
        elif mo and cur is not None:
            out[cur]["options"][mo.group(1)] = clean(mo.group(2))
    return out


PASSAGE_HEAD = re.compile(
    r"^[ \t]*Questions?[ \t]+(\d{1,3})[ \t]*[-–][ \t]*(\d{1,3})[ \t]+refer[^\n]*$", re.M)


def passage_labels(intro: str, count: int) -> list[str]:
    """'refer to the following article and e-mail.' → ['Article', 'E-mail']"""
    m = re.search(r"following\s+(.+?)\.?\s*$", intro.strip())
    if m:
        raw = re.split(r",\s*and\s+|\s+and\s+|,\s*", m.group(1))
        labels = [clean(x) for x in raw if clean(x)]
        if len(labels) == count:
            return [l[:1].upper() + l[1:] for l in labels]
    return [f"Passage {i + 1}" for i in range(count)]


# ─────────────────────────── glossary ───────────────────────────────────────

GLOSS_LINE = re.compile(
    r"^[\-\*•]?\s*(?P<term>[^:()]{1,60}?)\s*"
    r"(?:\((?P<pos>[^)]{1,30})\))?\s*(?:/(?P<ipa>[^/]{1,60})/)?\s*:\s*(?P<meaning>.+)$")

POS_TAGS = r"n|v|adj|adv|prep|conj|pron|num|abbr|idiom|phrase|phr\w*|phrasal verb|n\.phr"
# Nhiều docx viết glossary liền một dòng: "listen to (v): lắng nghe idea (n): ý tưởng"
GLOSS_RUNON = re.compile(
    rf"(?<=\S)[ \t]+(?=[A-Za-z][A-Za-z'\- ]{{0,28}}[ \t]*\((?:{POS_TAGS})\)[ \t]*(?:/[^/\n]{{1,60}}/[ \t]*)?:)")


def split_glossary_runon(text: str) -> str:
    return GLOSS_RUNON.sub("\n", text)


def parse_glossary(raw: str) -> list[dict]:
    """Bóc danh sách thuật ngữ từ một khối văn bản glossary."""
    out = []
    for line in split_glossary_runon(raw or "").split("\n"):
        line = line.strip()
        if not line:
            continue
        m = GLOSS_LINE.match(line)
        if not m:
            continue
        term = clean(m.group("term"))
        meaning = clean(m.group("meaning"))
        if not term or not meaning or len(term) > 60:
            continue
        out.append({
            "term": term,
            "pos": clean(m.group("pos") or ""),
            "ipa": clean(m.group("ipa") or ""),
            "meaning": meaning,
        })
    return out


# ─────────────────────────── override thủ công ──────────────────────────────

OVERRIDES_FILE = Path(__file__).with_name("overrides.json")


def load_overrides() -> dict:
    if not OVERRIDES_FILE.is_file():
        return {}
    data = json.load(open(OVERRIDES_FILE, encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def apply_overrides(test_slug: str, questions: list[dict]) -> list[int]:
    """Ghi đè các trường được khai trong overrides.json. Trả về số câu đã vá."""
    patch = load_overrides().get(test_slug) or {}
    if not patch:
        return []
    by_num = {q["number"]: q for q in questions}
    done = []
    for raw_num, fields in patch.items():
        target = by_num.get(int(raw_num))
        if target is None:
            continue
        for key, value in fields.items():
            if key.startswith("_"):   # _why là ghi chú, không phải dữ liệu
                continue
            target[key] = value
        if target.get("prompt") and target.get("options"):
            target["broken"] = False
        done.append(int(raw_num))
    return sorted(done)


# ─────────────────────────── catalog ────────────────────────────────────────

def write_catalog(exam_slug: str, exam_title: str, entries: dict[int, dict]) -> Path:
    """catalog.json nhẹ cho trang danh sách — khỏi phải nạp toàn bộ file đề."""
    path = OUT_DIR / f"catalog-{exam_slug}.json"
    payload = {
        "examSlug": exam_slug,
        "examTitle": exam_title,
        "tests": [entries[k] for k in sorted(entries)],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return path


def fmt_ranges(numbers) -> str:
    """[1,2,3,7] → '1-3, 7'"""
    out = []
    for v in sorted(numbers):
        if out and v == out[-1][1] + 1:
            out[-1][1] = v
        else:
            out.append([v, v])
    return ", ".join(f"{a}" if a == b else f"{a}-{b}" for a, b in out)
