#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract-part4-docx.py — trich transcript Part 4 tu file docx cua bac.

Cau truc file: 2 bang, moi bang la mot bo (bang 0 = BAI TAP CO BAN, bang 1 =
BAI TAP NANG CAO). Moi bang 5 hang x 2 cot, doc TRAI -> PHAI nen o [0,0] la
bai 1, [0,1] la bai 2, [1,0] la bai 3... [4,1] la bai 10.

Moi o co dang:
    <so>. <dap an>
    <nguoi noi>: <loi bai noi>

Dap an BO QUA — docx chi co chu cai (B, A - D - C) chu khong co noi dung cau
hoi, nen luu rieng chu cai thi vo dung. Khu nay la bai chep chinh ta.

SUA LOI OCR: ban docx co vai cho chu "l" thuong dung thay "I" hoa ("l was in
your store", "l've decided"). De nguyen thi hoc vien go dung chu "I" lai bi
cham sai. Doi chieu voi ASR da xac nhan audio doc la "I".

Usage:
    py -3.11 scripts/extract-part4-docx.py <duong_dan_docx> <out.json>
"""

import json
import re
import sys

import docx

SETS = [
    ("part4-basic", "Luyện tập cơ bản", 0, 0),      # (slug, ten, chi so bang, offset so bai)
    ("part4-advanced", "Luyện tập nâng cao", 1, 10),
]

# "W-Am:", "M-Cn:", "M-Au:", "W-Br:" ...
SPEAKER = re.compile(r"^\s*((?:W|M)(?:-(?:Am|Au|Br|Cn))?\s*\d?)\s*:\s*", re.I)
# dong dau: "1. B" hoac "9. B – D – A"
HEADER = re.compile(r"^\s*(\d{1,2})\s*[.)]\s*(.*)$")


def fix_ocr(text: str) -> list:
    """Sua cac loi OCR da biet. Tra ve (van ban moi, danh sach cho da sua)."""
    fixes = []

    def note(pat, repl, label):
        nonlocal text
        new, n = re.subn(pat, repl, text)
        if n:
            fixes.append(f"{label} x{n}")
            text = new

    # "l" thuong dung mot minh = "I" hoa
    note(r"(?<![A-Za-z])l(?=[ ,.])", "I", "l -> I")
    # "l've", "l'd", "l'm", "l'll", "l're"
    note(r"(?<![A-Za-z])l(['’])(ve|d|m|ll|re)\b", r"I\1\2", "l'x -> I'x")
    # chu hoa lac giua cau sau mot tu thuong: "a list Of team-building"
    note(r"(?<=[a-z] )Of(?= [a-z])", "of", "Of -> of")
    return text, fixes


def main():
    if len(sys.argv) < 3:
        print("Usage: py -3.11 scripts/extract-part4-docx.py <docx> <out.json>")
        sys.exit(1)
    src, out = sys.argv[1], sys.argv[2]
    d = docx.Document(src)

    talks = []
    all_fixes = []
    for slug, set_name, ti, offset in SETS:
        table = d.tables[ti]
        cells = []
        for row in table.rows:
            for cell in row.cells:          # trai -> phai
                if cell.text.strip():
                    cells.append(cell.text.strip())

        if len(cells) != 10:
            print(f"CANH BAO: {slug} co {len(cells)} o, khong phai 10")

        for pos, raw in enumerate(cells, start=1):
            lines = [x.strip() for x in raw.split("\n") if x.strip()]
            m = HEADER.match(lines[0])
            if not m:
                print(f"BO QUA {slug} o {pos}: dong dau khong phai 'so. dap an' -> {lines[0][:50]}")
                continue
            num = int(m.group(1))
            if num != pos:
                print(f"CANH BAO {slug}: o thu {pos} nhung danh so {num}")

            body = " ".join(lines[1:]).strip()
            sm = SPEAKER.match(body)
            speaker = sm.group(1).replace(" ", "") if sm else None
            if sm:
                body = body[sm.end():].strip()

            body, fixes = fix_ocr(body)
            if fixes:
                all_fixes.append(f"{slug} bai {num}: {', '.join(fixes)}")

            talks.append({
                "setSlug": slug,
                "setName": set_name,
                "audioIndex": num,            # ten file mp3 trong thu muc cua bo do
                "lessonIndex": offset + num,  # Talk 1-10 / Talk 11-20
                "title": f"Talk {offset + num}",
                "speaker": speaker,
                "text": body,
            })

    with open(out, "w", encoding="utf-8") as f:
        json.dump(talks, f, ensure_ascii=False, indent=2)

    print(f"{len(talks)} bai -> {out}")
    if all_fixes:
        print(f"\nDa sua {len(all_fixes)} bai co loi OCR:")
        for x in all_fixes:
            print(f"  {x}")
    words = [len(t["text"].split()) for t in talks]
    print(f"\nSo tu moi bai: it nhat {min(words)}, nhieu nhat {max(words)}, "
          f"trung binh {sum(words)//len(words)}")


if __name__ == "__main__":
    main()
