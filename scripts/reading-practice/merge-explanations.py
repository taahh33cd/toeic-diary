# -*- coding: utf-8 -*-
"""
Gộp phần giải thích soạn tay vào lô bài, rồi kiểm tra trước khi import.

  python scripts/reading-practice/merge-explanations.py <batch.json> <expl_dir> <out.json>

Mỗi bài một file trong <expl_dir>, đặt tên tuỳ ý, nội dung:
{
  "source": "EST 2026 Test 1 · Q151-152",
  "dich_bai": "<b>...</b><br><br>...",          // dịch cả bài, dùng chung mọi câu
  "questions": [
    {"dan_chung": "...", "ham_y": "... ↳ <i>'x'</i> (a) = <i>'y'</i> (b).", "lien_he": "..."},
    ...
  ]
}

Kiểm tra: đủ bài, đủ câu, 5 trường không rỗng, ham_y có cặp paraphrase '↳ ... = ...'
(exercises.ts:107 cần cặp này để sinh bài tập), tu_vung không rỗng.
"""
import json
import re
import sys
from pathlib import Path


def main(batch_path, expl_dir, out_path):
    batch = json.loads(Path(batch_path).read_text(encoding="utf-8"))
    expl = {}
    for f in sorted(Path(expl_dir).glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        expl[d["source"]] = (f.name, d)

    errors, missing = [], []
    for g in batch:
        if g["source"] not in expl:
            missing.append(g["source"])
            continue
        fname, d = expl[g["source"]]
        qs = d["questions"]
        if len(qs) != len(g["questions"]):
            errors.append(f"{fname}: {len(qs)} câu giải thích ≠ {len(g['questions'])} câu hỏi")
            continue
        for i, (q, e) in enumerate(zip(g["questions"], qs), 1):
            ex = q["explanation"]
            ex["dan_chung"] = e["dan_chung"].strip()
            ex["ham_y"] = e["ham_y"].strip()
            ex["lien_he"] = e.get("lien_he", "").strip()
            ex["dich_bai"] = d["dich_bai"].strip()
            if e.get("tu_vung"):  # glossary của EST rỗng -> soạn tay
                ex["tu_vung"] = e["tu_vung"]
            where = f"{fname} câu {i}"
            if not ex["dan_chung"]:
                errors.append(f"{where}: thiếu dan_chung")
            if not ex["ham_y"]:
                errors.append(f"{where}: thiếu ham_y")
            elif not re.search(r"↳.*=", ex["ham_y"]):
                errors.append(f"{where}: ham_y thiếu cặp paraphrase '↳ ... = ...'")
            if not ex["dich_bai"]:
                errors.append(f"{where}: thiếu dich_bai")
            if not ex["tu_vung"]:
                errors.append(f"{where}: tu_vung rỗng")
            q.pop("_est_reasoning", None)

    if missing:
        print(f"Chưa soạn {len(missing)}/{len(batch)} bài:")
        for m in missing:
            print("  -", m)
    for e in errors:
        print("LỖI:", e)
    if missing or errors:
        sys.exit(1)

    Path(out_path).write_text(json.dumps(batch, ensure_ascii=False, indent=1), encoding="utf-8")
    nq = sum(len(g["questions"]) for g in batch)
    print(f"OK — {len(batch)} bài / {nq} câu, đủ 5 trường -> {out_path}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(*sys.argv[1:4])
