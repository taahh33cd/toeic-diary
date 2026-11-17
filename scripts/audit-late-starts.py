#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
audit-late-starts.py

Tim cau co sentences.start_time MUON hon luc cau that su bat dau trong audio
(hoc vien replay bi mat may tu dau, vi segment.ts chi bu LEAD_IN = 0.2s).

Cach lam: stable-ts forced alignment ca transcript cua bai (moi cau mot dong,
original_split=True) vao audio PRODUCTION, roi lay moc bat dau cua tu dau tien
moi cau. So voi DB lam o buoc sau (SQL), file nay chi xuat moc da align.

Khac realign-broken-timestamps.py: script do dung ASR + Needleman-Wunsch de
cuu bai hong nang; o day transcript da dung, chi can moc bat dau chinh xac
tung cau, nen forced alignment la du (model small: ~92% tu lech < 100ms so
voi mot luot ASR doc lap).

LUU Y: audio local trong scripts/data/test*/audio lech mot track so voi
parsed.json — phai dung audio tai tu lessons.audio_url.

Input:
  transcripts.json : {"<test>/<qStart>-<qEnd>": ["cau 0", "cau 1", ...]}
                     (noi dung cau dung y nhu sentences.content trong DB)
  audio_root       : chua t<test>/<qStart>-<qEnd>.mp3 (tai tu lessons.audio_url)
Output:
  out.json         : {key: {"duration": s, "sentences": [{"o", "start", "end",
                      "prob", "words"}]}}

Usage:
  python3 scripts/audit-late-starts.py transcripts.json audio_root out.json \
      [--model small] [--shard 0/2] [--threads 2]
"""

import argparse
import json
import os
import re
import sys
import time

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")


def norm_chars(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("’", "'"))


def probe_duration(path):
    import subprocess
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=noprint_wrappers=1:nokey=1", path],
                       capture_output=True, text=True)
    try:
        return float(p.stdout.strip())
    except ValueError:
        return 0.0


def map_words_to_sentences(sentences, words):
    """
    Gan moi tu da align ve cau chua no bang cach di song song tren chuoi ky tu
    da chuan hoa (khong phu thuoc cach stable-ts tach tu: "e-mail", "worry—there's").
    Tra list cung do dai sentences: list cac tu thuoc cau do.
    """
    owner = []
    for si, s in enumerate(sentences):
        owner.extend([si] * len(norm_chars(s)))
    per = [[] for _ in sentences]
    pos = 0
    for w in words:
        n = norm_chars(w.word)
        if not n:
            continue
        if pos >= len(owner):
            break
        per[owner[pos]].append(w)
        pos += len(n)
    return per, pos == len(owner)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripts_json")
    ap.add_argument("audio_root")
    ap.add_argument("out_json")
    ap.add_argument("--model", default="small")
    ap.add_argument("--shard", default=None, help="i/n: chi xu ly bai co index %% n == i")
    ap.add_argument("--threads", type=int, default=0)
    ap.add_argument("--only", default=None, help="danh sach key, cach nhau dau phay")
    args = ap.parse_args()

    import torch
    import stable_whisper

    if args.threads > 0:
        torch.set_num_threads(args.threads)

    lessons = json.load(open(args.transcripts_json, encoding="utf-8"))
    keys = sorted(lessons)
    if args.only:
        want = set(args.only.split(","))
        keys = [k for k in keys if k in want]
    if args.shard:
        si, sn = (int(x) for x in args.shard.split("/"))
        keys = [k for i, k in enumerate(keys) if i % sn == si]

    out = {}
    if os.path.exists(args.out_json):
        out = json.load(open(args.out_json, encoding="utf-8"))

    model = stable_whisper.load_model(args.model, device="cpu")
    t_all = time.time()
    for n, key in enumerate(keys, 1):
        if key in out:
            continue
        test, rng = key.split("/")
        path = os.path.join(args.audio_root, "t" + test, rng + ".mp3")
        sents = lessons[key]
        text = "\n".join(s.strip() for s in sents)
        t0 = time.time()
        try:
            res = model.align(path, text, language="en", original_split=True, verbose=None)
        except Exception as e:  # noqa: BLE001
            print("[LOI] %s: %s" % (key, e), flush=True)
            continue
        words = res.all_words()
        per, complete = map_words_to_sentences(sents, words)
        rows = []
        for si, ws in enumerate(per):
            if not ws:
                rows.append({"o": si, "start": None, "end": None, "prob": None, "words": 0})
                continue
            rows.append({
                "o": si,
                "start": round(float(ws[0].start), 2),
                "end": round(float(ws[-1].end), 2),
                # xac suat tu dau tien: thap = align khong chac o cho bat dau cau
                "prob": round(float(ws[0].probability or 0.0), 3),
                "words": len(ws),
            })
        dur = probe_duration(path)
        out[key] = {"duration": round(dur, 2), "complete": complete, "sentences": rows}
        print("[%d/%d] %s  %d cau  %.1fs%s" % (n, len(keys), key, len(sents), time.time() - t0,
                                               "" if complete else "  (map khong het tu!)"), flush=True)
        if n % 10 == 0:
            json.dump(out, open(args.out_json, "w", encoding="utf-8"), ensure_ascii=False)

    json.dump(out, open(args.out_json, "w", encoding="utf-8"), ensure_ascii=False)
    print("Xong %d bai trong %.0fs -> %s" % (len(out), time.time() - t_all, args.out_json))


if __name__ == "__main__":
    sys.exit(main())
