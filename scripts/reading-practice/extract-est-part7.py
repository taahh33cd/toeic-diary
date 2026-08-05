# -*- coding: utf-8 -*-
"""
Trích các nhóm Part 7 từ lib/full-tests/data/est-2026-test-*.json và chuyển
sang shape của bảng reading_passages / reading_questions.

Phần `explanation` giàu (dan_chung / ham_y / lien_he / tu_vung / dich_bai) KHÔNG
sinh ở đây — script chỉ mang sang `tu_vung` (từ glossary) và để trống 4 trường
còn lại, chờ soạn tay.

Chạy:  python scripts/reading-practice/extract-est-part7.py <out.json>
"""
import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "lib" / "full-tests" / "data"

# label trong EST -> category của /reading-practice (chỉ áp dụng cho single)
CATEGORY_BY_LABEL = {
    "E-mail": "A. E-MAIL - LETTER",
    "Letter": "A. E-MAIL - LETTER",
    "Notice": "B. NOTICE - MEMO - ARTICLE",
    "Memo": "B. NOTICE - MEMO - ARTICLE",
    "Article": "B. NOTICE - MEMO - ARTICLE",
    "News article": "B. NOTICE - MEMO - ARTICLE",
    "Announcement": "B. NOTICE - MEMO - ARTICLE",
    "Press release": "B. NOTICE - MEMO - ARTICLE",
    "Meeting minutes": "B. NOTICE - MEMO - ARTICLE",
    "Policy": "B. NOTICE - MEMO - ARTICLE",
    "Review": "B. NOTICE - MEMO - ARTICLE",
    "Advertisement": "C. ADVERTISEMENT",
    "Flyer": "C. ADVERTISEMENT",
    "Coupon": "C. ADVERTISEMENT",
    "Job posting": "C. ADVERTISEMENT",
    "Job description": "C. ADVERTISEMENT",
    "Web page": "D. WEB PAGE",
    "Company Web page": "D. WEB PAGE",
    "Blog post": "D. WEB PAGE",
    "Online post": "D. WEB PAGE",
    "Online review": "D. WEB PAGE",
    "Text-message chain": "E. MESSAGE CHAIN - CHAT DISCUSSION",
    "Text message": "E. MESSAGE CHAIN - CHAT DISCUSSION",
    "Online chat discussion": "E. MESSAGE CHAIN - CHAT DISCUSSION",
}
DEFAULT_CATEGORY = "F. OTHERS"

TD = 'style="border:1px solid #d1d5db;padding:4px 10px"'


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def block_to_html(block: str) -> str:
    lines = [l.strip() for l in block.split("\n") if l.strip()]
    if not lines:
        return ""
    # bảng: từ 2 dòng trở lên và mọi dòng đều có dấu |
    if len(lines) >= 2 and all("|" in l for l in lines):
        rows = []
        for i, line in enumerate(lines):
            cells = [esc(c.strip()) for c in line.split("|")]
            if i == 0:
                cells = [f"<b>{c}</b>" for c in cells]
            rows.append("".join(f"<td {TD}>{c}</td>" for c in cells))
        body = "".join(f"<tr>{r}</tr>" for r in rows)
        return f'<table style="border-collapse:collapse;width:100%">{body}</table>'
    return "<br>".join(esc(l) for l in lines)


def text_to_html(text: str) -> str:
    blocks = [b for b in re.split(r"\n\s*\n", text) if b.strip()]
    parts = [block_to_html(b) for b in blocks]
    parts = [p for p in parts if p]
    # dòng đầu ngắn, không kết thúc bằng dấu câu -> coi là tiêu đề
    if parts and "<table" not in parts[0]:
        first = parts[0]
        if "<br>" not in first and len(first) <= 80 and not first.endswith((".", "!", "?", ",", ":")):
            parts[0] = f"<b>{first}</b>"
    return "<br><br>".join(parts)


# Glossary của EST hay mất phần đầu cụm từ ("word of mouth" -> "mouth", "follow up" -> "up"),
# để lại những mục vô nghĩa. Bỏ các mục chỉ còn hư từ hoặc quá ngắn.
STOP_TERMS = {
    "to", "of", "in", "on", "at", "up", "by", "for", "the", "a", "an", "and", "or",
    "is", "are", "be", "with", "from", "as", "it", "its", "his", "her", "their",
}


def clean_glossary(items):
    out, seen = [], set()
    for t in items:
        term = (t.get("term") or "").strip().strip("-–—").strip()
        meaning = (t.get("meaning") or "").strip().strip("-–—").strip()
        key = term.lower()
        if not term or not meaning or key in STOP_TERMS or len(term) < 3 or key in seen:
            continue
        seen.add(key)
        out.append({"tu": term, "nghia": meaning})
    return out


def strip_markers(text: str) -> str:
    """Bỏ mốc chèn câu khi nhóm không còn câu chèn-câu nào.
    EST dùng hai kiểu: '--- [1] ---.' và '[1].'"""
    text = re.sub(r"\s*---\s*\[[1-4]\]\s*---\s*\.?", "", text)
    text = re.sub(r"\s*\[[1-4]\]\s*\.", "", text)
    return re.sub(r"[ \t]{2,}", " ", text)


def sig(text: str) -> str:
    """Chữ ký để dò trùng với dữ liệu đã có (bỏ HTML, chỉ giữ [a-z0-9], 400 ký tự đầu)."""
    plain = re.sub(r"<[^>]*>", " ", text)[:400]
    return re.sub(r"[^a-zA-Z0-9]", "", plain).lower()


def main(out_path: str) -> None:
    groups = []
    skipped = []

    for n in range(1, 11):
        doc = json.loads((DATA_DIR / f"est-2026-test-{n}.json").read_text(encoding="utf-8"))
        for g in doc["groups"]:
            if g.get("part") != 7:
                continue

            # Câu chèn-câu của EST bị mất chính câu cần chèn ("the following sentence"
            # không có ở đâu trong data) -> không dùng được, bỏ riêng câu đó.
            qs = [q for q in g["questions"] if "following sentence best belong" not in q["prompt"]]
            dropped = len(g["questions"]) - len(qs)
            if dropped:
                skipped.append({"test": n, "q": f'{g["questionStart"]}-{g["questionEnd"]}', "reason": f"bỏ {dropped} câu chèn-câu (EST thiếu câu cần chèn)"})
            if not qs:
                continue

            bad = [q["number"] for q in qs if q.get("broken") or not q.get("answer")]
            if bad:
                skipped.append({"test": n, "q": f'{g["questionStart"]}-{g["questionEnd"]}', "reason": f"broken/thiếu đáp án: {bad}"})
                continue

            passages = g["passages"]
            ptype = {1: "single", 2: "double", 3: "triple"}.get(len(passages))
            if ptype is None:
                skipped.append({"test": n, "q": f'{g["questionStart"]}-{g["questionEnd"]}', "reason": f"{len(passages)} đoạn"})
                continue

            keep_markers = any("marked [1]" in q["prompt"] for q in qs)
            raw_texts = [p["text"] if keep_markers else strip_markers(p["text"]) for p in passages]

            labels = [p.get("label", "") for p in passages]
            category = CATEGORY_BY_LABEL.get(labels[0], DEFAULT_CATEGORY) if ptype == "single" else None

            groups.append({
                "source": f"EST 2026 Test {n} · Q{g['questionStart']}-{g['questionEnd']}",
                "test": n,
                "questionStart": g["questionStart"],
                "type": ptype,
                "category": category,
                "labels": labels,
                "intro": g.get("intro", ""),
                "texts": [text_to_html(t) for t in raw_texts],
                "sig": sig(raw_texts[0]),
                "questions": [{
                    "text": q["prompt"],
                    "options": q["options"],
                    "correct": q["answer"],
                    # 4 trường dưới soạn tay; tu_vung lấy sẵn từ glossary của EST
                    "explanation": {
                        "dan_chung": "",
                        "ham_y": "",
                        "lien_he": "",
                        "tu_vung": clean_glossary((q.get("explanation") or {}).get("glossary", [])),
                        "dich_bai": "",
                    },
                    "_est_reasoning": ((q.get("explanation") or {}).get("reasoning") or "").strip(),
                } for q in qs],
            })

    Path(out_path).write_text(
        json.dumps({"groups": groups, "skipped": skipped}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    from collections import Counter
    by_type = Counter(g["type"] for g in groups)
    by_cat = Counter(g["category"] for g in groups if g["type"] == "single")
    print(f"Trích {len(groups)} nhóm, bỏ {len(skipped)} nhóm -> {out_path}")
    print("  theo dạng:", dict(by_type))
    for c, v in sorted(by_cat.items()):
        print(f"    {c}: {v}")
    for s in skipped:
        print("  BỎ:", s)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(sys.argv[1] if len(sys.argv) > 1 else "est-part7-all.json")
