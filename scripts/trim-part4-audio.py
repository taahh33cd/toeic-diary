#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
trim-part4-audio.py — cat audio Part 4 chi con dung doan BAI NOI.

VI SAO: file goc co nhieu thu khong phai loi bai.
  - Bo co ban: dau file doc so thu tu ("1.", "2."...), con lai la bai noi.
  - Bo nang cao: 0-6s giong dan "Questions 95 through 97 refer to the
    following telephone message and chart", 6-35s moi la bai noi, 37-64s doc
    to ba cau hoi, sau do lang. Do tren file 1: chi 29/79 giay la bai noi.
Day la khu chep chinh ta nen phan khong co transcript la phan thua.

CACH TIM BIEN: ASR ca file lay moc tung tu, roi dong chuoi tu cua transcript
vao chuoi tu ASR bang Needleman-Wunsch (dung lai align_sequences cua
realign-broken-timestamps.py, da chay dung tren 1.080 bai dictation). Tu dau
tien va tu cuoi cung KHOP cho ta bien that cua bai noi. Chu doc so thu tu,
giong dan va phan doc cau hoi deu khong co trong transcript nen tu dong roi
ra ngoai.

Them le an toan hai dau (LE_DAU / LE_CUOI) de khong cat vao tieng.

Usage:
    py -3.11 scripts/trim-part4-audio.py <transcripts.json> <thu_muc_goc> <thu_muc_ra> [--model small]

<thu_muc_goc> chua hai thu muc con dat ten theo bo (xem AUDIO_DIR duoi).
"""

import argparse
import json
import os
import subprocess
import sys

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib.machinery import SourceFileLoader

_realign = SourceFileLoader(
    "realign", os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "realign-broken-timestamps.py")).load_module()
align_sequences = _realign.align_sequences
norm = _realign.norm

AUDIO_DIR = {
    "part4-basic": "Bài tập cơ bản - Audio",
    "part4-advanced": "Bài tập nâng cao - Audio",
}

LE_DAU = 0.35    # giay chua truoc tu dau tien
LE_CUOI = 0.60   # giay chua sau tu cuoi cung (duoi cau hay bi ASR cat non)


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True)
    return float(out.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripts")
    ap.add_argument("src_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--model", default="small")
    args = ap.parse_args()

    talks = json.load(open(args.transcripts, encoding="utf-8"))
    os.makedirs(args.out_dir, exist_ok=True)

    from faster_whisper import WhisperModel
    print(f"Nap model '{args.model}'...")
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    report = []
    for i, t in enumerate(talks, 1):
        src = os.path.join(args.src_dir, AUDIO_DIR[t["setSlug"]], f"{t['audioIndex']}.mp3")
        if not os.path.exists(src):
            print(f"THIEU FILE: {src}")
            sys.exit(1)

        dur = probe(src)
        segments, _ = model.transcribe(src, language="en", word_timestamps=True,
                                       vad_filter=False)
        words = []
        for seg in segments:
            for w in (seg.words or []):
                nw = norm(w.word)
                if nw:
                    words.append((nw, w.start, w.end))

        exp = [norm(x) for x in t["text"].split()]
        exp = [x for x in exp if x]
        idx = align_sequences(exp, [w[0] for w in words])
        hit = [j for j in idx if j is not None]
        if not hit:
            print(f"KHONG KHOP: {t['title']}")
            sys.exit(1)

        first, last = words[min(hit)], words[max(hit)]
        start = max(0.0, first[1] - LE_DAU)
        end = min(dur, last[2] + LE_CUOI)
        cover = len(hit) / len(exp)

        dst = os.path.join(args.out_dir, f"{t['setSlug']}-{t['audioIndex']}.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{start:.3f}",
             "-to", f"{end:.3f}", "-i", src, "-c:a", "libmp3lame", "-q:a", "4", dst],
            check=True)
        new_dur = probe(dst)

        report.append({
            "title": t["title"], "setSlug": t["setSlug"], "audioIndex": t["audioIndex"],
            "srcDuration": round(dur, 2), "start": round(start, 2), "end": round(end, 2),
            "newDuration": round(new_dur, 2), "coverage": round(cover, 4),
            "file": os.path.basename(dst),
        })
        print(f"[{i:2d}/20] {t['title']:8s} {dur:6.1f}s -> {new_dur:5.1f}s "
              f"(cat {dur - new_dur:5.1f}s, bai noi {start:5.1f}-{end:5.1f}, "
              f"khop {cover*100:5.1f}%)")

    out_json = os.path.join(args.out_dir, "trim-report.json")
    json.dump(report, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    tong_goc = sum(r["srcDuration"] for r in report)
    tong_moi = sum(r["newDuration"] for r in report)
    print(f"\n20 file: {tong_goc/60:.1f} phut -> {tong_moi/60:.1f} phut "
          f"(bo {100*(1-tong_moi/tong_goc):.0f}%)")
    print(f"Bao cao: {out_json}")


if __name__ == "__main__":
    main()
