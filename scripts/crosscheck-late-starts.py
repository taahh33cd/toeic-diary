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
  "asr":   moc bat dau cua TU DAU TIEN cua cau theo ASR, hoac null neu ASR
           khong nghe ra dung tu dau tien (khi do khong the kiem cheo).
  "onset": moc bat dau NOI THAT theo nang luong am thanh — xem find_onset.

Vi sao can "onset": ca align lan ASR deu hay bao SOM sau mot khoang lang.
Whisper gan khoang lang vao tu ke tiep (Part 2: "number seven" 0.70-1.26,
"when" 1.26-2.50 trong khi "when" that bat dau ~2.1s), con align thi keo tu
dau cau de len "Number seven". Ca hai lam cau Part 2 nao cung trong nhu bi
DB bao muon. Nang luong am thanh khong bi lech kieu do.

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


HOP = 0.01          # giay / khung nang luong
MIN_SILENCE = 0.15  # lang toi thieu truoc mot moc bat dau noi
QUIET_DB = 35       # duoi (phan vi 95% cua bai - 35 dB) = lang


def energy_db(audio, sr=16000, win=0.025):
    import numpy as np
    h, w = int(HOP * sr), int(win * sr)
    n = (len(audio) - w) // h
    fr = np.lib.stride_tricks.sliding_window_view(audio, w)[::h][:n]
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)


def find_onset(e, quiet, start, limit):
    """
    Moc dau tien >= start ma TRUOC DO co >= MIN_SILENCE giay lang, tuc la cho
    bat dau noi sau mot quang nghi. Neu start roi vao duoi cau truoc (hay
    "Number seven") thi di qua phan do toi quang lang ke tiep. None neu den
    limit van chua thay.
    """
    need = int(MIN_SILENCE / HOP)
    i, end = max(0, int(start / HOP)), min(len(e), int(limit / HOP))
    sil, j = 0, i - 1
    while j >= 0 and e[j] < quiet and sil < need:
        sil += 1
        j -= 1
    while i < end:
        if e[i] < quiet:
            sil += 1
        else:
            if sil >= need:
                return round(i * HOP, 2)
            sil = 0
        i += 1
    return None


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

        audio = load_audio(path)
        segs, _ = model.transcribe(audio, language="en", word_timestamps=True, beam_size=5,
                                   vad_filter=False, condition_on_previous_text=False)
        act = []
        for seg in segs:
            for w in seg.words or []:
                if w.start is None or w.end is None or w.end <= w.start:
                    continue
                nw = realign.norm(w.word)
                if nw:
                    act.append({"w": nw, "s": float(w.start)})

        import numpy as np
        e = energy_db(audio)
        quiet = float(np.percentile(e, 95)) - QUIET_DB

        mapping = realign.align_sequences(exp, [a["w"] for a in act])
        matched = sum(1 for m in mapping if m is not None)
        rows = aligned[key]["sentences"]
        for si, row in enumerate(rows):
            fi = first_idx[si]
            ok = fi < len(exp) and owner[fi] == si and mapping[fi] is not None
            row["asr"] = round(act[mapping[fi]]["s"], 2) if ok else None
            row["onset"] = None
            cands = [x for x in (row["start"], row["asr"]) if x is not None]
            if not cands:
                continue
            c = min(cands)
            # khong tim truoc tu cuoi cua cau truoc (theo align)
            prev_end = rows[si - 1]["end"] if si > 0 else None
            if prev_end is not None and row["start"] is not None:
                c = max(c, min(prev_end, row["start"]))
            row["onset"] = find_onset(e, quiet, c - 0.05, max(cands) + 3.0)
        aligned[key]["asrCoverage"] = round(matched / max(1, len(exp)), 3)
        print("[%d/%d] %s  ASR khop %d/%d tu" % (n, len(keys), key, matched, len(exp)), flush=True)

    json.dump(aligned, open(args.aligned_json, "w", encoding="utf-8"), ensure_ascii=False)


if __name__ == "__main__":
    sys.exit(main())
