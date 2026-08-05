# -*- coding: utf-8 -*-
"""
Chọn một lô bài từ output của extract-est-part7.py, rải đều qua 10 đề.

Chạy:  python scripts/reading-practice/select-batch.py <all.json> <batch.json> [--per-cat 2] [--double 6] [--triple 6]
Bài đã dùng ở lô trước: liệt kê `source` trong scripts/reading-practice/used-sources.json để không chọn lại.
"""
import argparse
import json
from pathlib import Path

USED_FILE = Path(__file__).resolve().parent / "used-sources.json"


def spread(items, k):
    """Chọn k phần tử rải đều theo thứ tự đề, tránh dồn vào một đề."""
    if len(items) <= k:
        return items
    step = len(items) / k
    return [items[int(i * step)] for i in range(k)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("all_json")
    ap.add_argument("out_json")
    ap.add_argument("--per-cat", type=int, default=2)
    ap.add_argument("--double", type=int, default=6)
    ap.add_argument("--triple", type=int, default=6)
    args = ap.parse_args()

    data = json.loads(Path(args.all_json).read_text(encoding="utf-8"))
    used = set(json.loads(USED_FILE.read_text(encoding="utf-8"))) if USED_FILE.exists() else set()
    groups = [g for g in data["groups"] if g["source"] not in used]

    chosen = []
    cats = sorted({g["category"] for g in groups if g["type"] == "single"})
    for cat in cats:
        pool = sorted(
            [g for g in groups if g["type"] == "single" and g["category"] == cat],
            key=lambda g: (g["test"], g["questionStart"]),
        )
        chosen += spread(pool, args.per_cat)
    for ptype, k in (("double", args.double), ("triple", args.triple)):
        pool = sorted(
            [g for g in groups if g["type"] == ptype],
            key=lambda g: (g["test"], g["questionStart"]),
        )
        chosen += spread(pool, k)

    for g in chosen:
        g.pop("sig", None)

    Path(args.out_json).write_text(
        json.dumps(chosen, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    nq = sum(len(g["questions"]) for g in chosen)
    print(f"Chọn {len(chosen)} bài / {nq} câu -> {args.out_json}")
    for g in chosen:
        print(f"  [{g['type']:6}] {g['source']:34} {g['category'] or '/'.join(g['labels'])} · {len(g['questions'])} câu")


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    main()
