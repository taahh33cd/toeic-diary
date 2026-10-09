#!/usr/bin/env python3
"""
whisper-words.py

Lay word-level timestamps cho cac doan nghe Part 3/4 dung cho subskill Chunking.
Tai mp3 tu Supabase (cache lai), chay faster-whisper, ghi ra words.json.

Usage:
    py -3.11 scripts/chunking/whisper-words.py [--model small] [--limit 15]

Output: scripts/chunking/words.json
    { "<groupId>": { "duration": 31.2, "words": [{"w":"Hey","start":0.41,"end":0.63}, ...] } }
"""

import argparse
import json
import os
import sys
import time
import urllib.request

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PASSAGES = os.path.join(ROOT, "lib", "subskills", "part3", "data", "passages.json")
OUT = os.path.join(ROOT, "scripts", "chunking", "words.json")
CACHE = os.path.join(
    os.environ.get("TEMP", "/tmp"), "chunking-audio-cache"
)

# 15 doan cho ban dau: 7 Part 3 + 8 Part 4, lay tu de 1.
GROUPS = [
    "est-2026-test-1-q32-34",
    "est-2026-test-1-q35-37",
    "est-2026-test-1-q38-40",
    "est-2026-test-1-q44-46",
    "est-2026-test-1-q47-49",
    "est-2026-test-1-q53-55",
    "est-2026-test-1-q62-64",
    "est-2026-test-1-q71-73",
    "est-2026-test-1-q74-76",
    "est-2026-test-1-q77-79",
    "est-2026-test-1-q80-82",
    "est-2026-test-1-q83-85",
    "est-2026-test-1-q86-88",
    "est-2026-test-1-q89-91",
    "est-2026-test-1-q92-94",
]


def fetch(url, dest):
    if os.path.isfile(dest) and os.path.getsize(dest) > 0:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "chunking-builder"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="small", choices=["tiny", "base", "small", "medium"])
    ap.add_argument("--limit", type=int, default=len(GROUPS))
    args = ap.parse_args()

    with open(PASSAGES, "r", encoding="utf-8") as f:
        passages = {p["groupId"]: p for p in json.load(f)["passages"]}

    targets = GROUPS[: args.limit]
    missing = [g for g in targets if g not in passages]
    if missing:
        print("ERROR: groupId not in passages.json: " + ", ".join(missing), file=sys.stderr)
        sys.exit(1)

    os.makedirs(CACHE, exist_ok=True)

    print("Downloading " + str(len(targets)) + " audio files...")
    for g in targets:
        dest = os.path.join(CACHE, g + ".mp3")
        try:
            fetch(passages[g]["audioUrl"], dest)
        except Exception as e:
            print("  FAIL " + g + ": " + str(e), file=sys.stderr)
            sys.exit(1)
    print("  ok")

    from faster_whisper import WhisperModel

    print("Loading model " + args.model + " (cpu/int8)...")
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    out = {}
    for i, g in enumerate(targets, 1):
        path = os.path.join(CACHE, g + ".mp3")
        t0 = time.time()
        segments, info = model.transcribe(
            path, language="en", word_timestamps=True, vad_filter=False
        )
        words = []
        for seg in segments:
            for w in seg.words or []:
                words.append(
                    {
                        "w": w.word.strip(),
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                    }
                )
        out[g] = {"duration": round(info.duration, 3), "words": words}
        print(
            "[" + str(i) + "/" + str(len(targets)) + "] " + g
            + " -> " + str(len(words)) + " words in " + str(round(time.time() - t0, 1)) + "s"
        )

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("Wrote " + OUT)


if __name__ == "__main__":
    main()
