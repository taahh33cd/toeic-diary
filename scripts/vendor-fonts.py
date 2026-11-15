#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vendor-fonts.py — tai font ve repo de build khong con phu thuoc mang.

VI SAO: `next/font/google` tai font tu Google LUC BUILD. May build cua Vercel
mat duong ra fonts.googleapis.com khoang 29% so lan (do 2026-11-15: 4 loi /
14 lan deploy production trong 3 ngay), moi lan lam hong ca ban deploy. Tu host
thi build het phu thuoc mang.

CACH LAM: lay file TTF goc tu kho chinh thuc google/fonts (giay phep OFL), cat
bot ky tu khong dung, roi nen sang woff2.

Ba lua chon da can nhac bang so do thuc te:

1. CAT THEO DUNG DAI UNICODE CUA GOOGLE cho latin + latin-ext + vietnamese
   (doc tu fonts.googleapis.com/css2, xem UNICODES). Gop ca ba vao MOT file vi
   `next/font/local` khong co unicode-range rieng cho tung file nhu CSS cua
   Google. Giu latin-ext du tieng Viet khong can, de ten rieng chau Au trong
   de thi khong bi nhay sang font du phong.

2. STATIC TUNG WEIGHT, khong dung font bien thien. Font bien thien goi mot file
   cho ca dai weight, nhung trinh duyet phai tai TRON file do du trang chi dung
   mot weight. Do duoc: Noto Serif bien thien 400 KB, static moi weight 67 KB;
   Playpen Sans bien thien 347 KB, static 135 KB. Static thang ro rang.

3. GIU BO LAYOUT FEATURES MAC DINH cua fonttools (co ccmp/mark/mkmk/locl cho
   dau tieng Viet, va calt). Cat con `ccmp,mark,mkmk,locl,liga,kern` thi Playpen
   Sans tu 135 KB xuong 57 KB, NHUNG mat `calt` — dung thu lam font viet tay
   doi net theo ngu canh de chu khong lap y het nhau. Khong danh doi hinh thuc
   lay dung luong o day.

Doi chieu: hom nay Google phuc vu 4.185 KB cho latin+latin-ext+vietnamese cua
ca 5 ho font o moi weight da khai bao.

Chay lai khi can doi/them weight:
    py -3.11 scripts/vendor-fonts.py
"""

import os
import subprocess
import sys
import urllib.parse
import urllib.request

RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app", "fonts")
UA = {"User-Agent": "font-vendor-script"}

# Dai unicode doc tu fonts.googleapis.com/css2 ngay 2026-11-15 — gop latin,
# latin-ext va vietnamese. Dung nguyen van cua Google, dung tu go lai: thieu
# mot khoang la mat dau tieng Viet o mot so chu.
UNICODES = ",".join([
    # latin
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC",
    "U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193",
    "U+2212,U+2215,U+FEFF,U+FFFD",
    # latin-ext
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF",
    "U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4",
    "U+2113,U+2C60-2C7F,U+A720-A7FF",
    # vietnamese
    "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1",
    "U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329",
    "U+1EA0-1EF9,U+20AB",
])

# Weight/style phai khop DUNG phan khai bao trong app/layout.tsx. Doi o day thi
# phai doi ca ben kia, khong thi trinh duyet gia lap net dam/nghieng.
#
# (thu muc google/fonts, file TTF nguon, truc can ghim, weight, style, ten xuat)
JOBS = []


def var_job(folder, ttf, weights, style, out_prefix, pin=None):
    for w in weights:
        JOBS.append((folder, ttf, pin, w, style,
                     f"{out_prefix}-{w}{'-italic' if style == 'italic' else ''}.woff2"))


def static_job(folder, ttf, w, style, out_prefix):
    JOBS.append((folder, ttf, None, w, style,
                 f"{out_prefix}-{w}{'-italic' if style == 'italic' else ''}.woff2"))


# --- font bien thien: ghim ve tung weight tinh ---
var_job("jetbrainsmono", "JetBrainsMono[wght].ttf", [400, 500], "normal", "JetBrainsMono")
var_job("lora", "Lora[wght].ttf", [400, 600, 700], "normal", "Lora")
var_job("lora", "Lora-Italic[wght].ttf", [400, 600, 700], "italic", "Lora")
var_job("playpensans", "PlaypenSans[wght].ttf", [400, 500, 600, 700], "normal", "PlaypenSans")
# Noto Serif co 2 truc; ghim wdth=100 (ban thuong) roi moi ghim wght
var_job("notoserif", "NotoSerif[wdth,wght].ttf", [400, 500, 600, 700], "normal",
        "NotoSerif", pin="wdth=100")

# --- Be Vietnam Pro khong co ban bien thien ---
for w, name in [(300, "Light"), (400, "Regular"), (500, "Medium"),
                (600, "SemiBold"), (700, "Bold")]:
    static_job("bevietnampro", f"BeVietnamPro-{name}.ttf", w, "normal", "BeVietnamPro")
    ital = "Italic" if name == "Regular" else f"{name}Italic"
    static_job("bevietnampro", f"BeVietnamPro-{ital}.ttf", w, "italic", "BeVietnamPro")


def fetch(url, dest):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)
    return len(data)


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = os.path.join(OUT, "_src")
    os.makedirs(tmp, exist_ok=True)

    total = 0
    for folder, ttf, pin, weight, style, out_name in JOBS:
        src = os.path.join(tmp, ttf)
        if not os.path.exists(src):
            try:
                fetch(f"{RAW}/{folder}/{urllib.parse.quote(ttf)}", src)
            except Exception as e:
                print(f"TAI HONG {ttf}: {e}")
                sys.exit(1)

        # font bien thien -> ghim ve mot weight tinh
        is_var = "[" in ttf
        to_subset = src
        if is_var:
            to_subset = os.path.join(tmp, f"inst-{out_name}.ttf")
            cmd = [sys.executable, "-m", "fontTools.varLib.instancer", src]
            if pin:
                cmd.append(pin)
            cmd += [f"wght={weight}", "-o", to_subset]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode != 0:
                print(f"GHIM TRUC HONG {ttf} wght={weight}:\n{r.stderr[-600:]}")
                sys.exit(1)

        dst = os.path.join(OUT, out_name)
        r = subprocess.run(
            [sys.executable, "-m", "fontTools.subset", to_subset,
             f"--unicodes={UNICODES}", "--flavor=woff2", f"--output-file={dst}"],
            capture_output=True, text=True)
        if r.returncode != 0:
            print(f"SUBSET HONG {ttf}:\n{r.stderr[-600:]}")
            sys.exit(1)

        n = os.path.getsize(dst)
        total += n
        print(f"{out_name:32s} {n/1024:6.1f} KB")

    # Giay phep OFL phai di kem font
    for folder in sorted({j[0] for j in JOBS}):
        try:
            fetch(f"{RAW}/{folder}/OFL.txt", os.path.join(OUT, f"OFL-{folder}.txt"))
        except Exception as e:
            print(f"Khong tai duoc OFL.txt cua {folder}: {e}")

    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)

    print(f"\n{len(JOBS)} file woff2, tong {total/1024:.0f} KB")


if __name__ == "__main__":
    main()
