#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
crosscheck-late-starts.py

Kiem cheo ket qua cua audit-late-starts.py bang mot luot ASR DOC LAP
(faster-whisper, word_timestamps) cho cac bai co cau bi gan co.

Vi sao can: forced alignment gia dinh transcript bao het audio. Dau bai Part
3/4 con giong doc "Questions 89 through 91 refer to..." khong co trong
transcript, nen tu dau cau 0 co the bi keo vao phan do -> bao "DB muon" sai.
ASR khong bi rang buoc nhu vay; Needleman-Wunsch (dung lai tu
realign-broken-timestamps.py) dong chuoi tu ASR vao transcript.

Ghi them vao moi cau trong aligned.json:
  "asr": moc bat dau cua TU DAU TIEN cua cau theo ASR, hoac null neu ASR
         khong nghe ra dung tu dau tien (khi do khong the kiem cheo).

Usage:
  python3 scripts/crosscheck-late-starts.py transcripts.json audio_root aligned.json \
      --only 1/1-1,3/77-79 [--model small] [--threads 4]
"""

import argparse
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "realign", os.path.join(HERE, "realign-broken-timestamps.py"))
realign = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(realign)


def load_audio(path):
    """Giai ma bang ffmpeg ra 16 kHz mono float32 (khong phu thuoc phien ban PyAV)."""
    import subprocess
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-f", "s16le",
                          "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripts_json")
    ap.add_argument("audio_root")
    ap.add_argument("aligned_json")
    ap.add_argument("--only", required=True)
    ap.add_argument("--model", default="small")
    ap.add_argument("--threads", type=int, default=0)
    args = ap.parse_args()

    from faster_whisper import WhisperModel

    lessons = json.load(open(args.transcripts_json, encoding="utf-8"))
    aligned = json.load(open(args.aligned_json, encoding="utf-8"))
    mkw = {"cpu_threads": args.threads} if args.threads > 0 else {}
    model = WhisperModel(args.model, device="cpu", compute_type="int8", **mkw)

    keys = [k for k in args.only.split(",") if k]
    for n, key in enumerate(keys, 1):
        test, rng = key.split("/")
        path = os.path.join(args.audio_root, "t" + test, rng + ".mp3")
        sents = lessons[key]

        exp, owner, first_idx = [], [], []
        for si, s in enumerate(sents):
            first_idx.append(len(exp))
            for w in s.split():
                nw = realign.norm(w)
                if nw:
                    exp.append(nw)
                    owner.append(si)

        segs, _ = model.transcribe(load_audio(path), language="en", word_timestamps=True, beam_size=5,
                                   vad_filter=False, condition_on_previous_text=False)
        act = []
        for seg in segs:
            for w in seg.words or []:
                if w.start is None or w.end is None or w.end <= w.start:
                    continue
                nw = realign.norm(w.word)
                if nw:
                    act.append({"w": nw, "s": float(w.start)})

        mapping = realign.align_sequences(exp, [a["w"] for a in act])
        matched = sum(1 for m in mapping if m is not None)
        for si, row in enumerate(aligned[key]["sentences"]):
            fi = first_idx[si]
            ok = fi < len(exp) and owner[fi] == si and mapping[fi] is not None
            row["asr"] = round(act[mapping[fi]]["s"], 2) if ok else None
        aligned[key]["asrCoverage"] = round(matched / max(1, len(exp)), 3)
        print("[%d/%d] %s  ASR khop %d/%d tu" % (n, len(keys), key, matched, len(exp)), flush=True)

    json.dump(aligned, open(args.aligned_json, "w", encoding="utf-8"), ensure_ascii=False)


if __name__ == "__main__":
    sys.exit(main())
