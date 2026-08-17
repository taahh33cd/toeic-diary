#!/usr/bin/env python3
"""
transcribe_speaking_q810.py

Transcribe bo audio Speaking Q8-10 (moi thu muc: 1.mp3 = loi dan, 8/9/10.mp3 = cau hoi).
Output: JSON { "<folder>": { "intro": "...", "q8": "...", "q9": "...", "q10": "..." } }

Usage:
    py -3.11 scripts/transcribe_speaking_q810.py "<sourceDir>" <outJson> [--model small.en]
"""

import argparse
import json
import os
import sys
import time

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

KEYS = {"1": "intro", "8": "q8", "9": "q9", "10": "q10"}


def find_sets(source_dir):
    """Tra ve list (relKey, absDir) cho moi thu muc co du 4 file mp3."""
    out = []
    for root, _dirs, files in os.walk(source_dir):
        names = {f for f in files if f.lower().endswith(".mp3")}
        if not names:
            continue
        rel = os.path.relpath(root, source_dir).replace("\\", "/")
        out.append((rel, root))
    out.sort()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source_dir")
    ap.add_argument("out_json")
    ap.add_argument("--model", default="small.en")
    args = ap.parse_args()

    if not os.path.isdir(args.source_dir):
        print("ERROR: source_dir not found: " + args.source_dir, file=sys.stderr)
        sys.exit(1)

    sets = find_sets(args.source_dir)
    print("[q8-10] sets found: " + str(len(sets)))

    from faster_whisper import WhisperModel

    print("Loading model '" + args.model + "'...")
    model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=6)
    print("Model loaded\n")

    # Resume: giu lai ket qua da co
    results = {}
    if os.path.isfile(args.out_json):
        with open(args.out_json, "r", encoding="utf-8") as f:
            results = json.load(f)

    t0 = time.time()
    done = 0
    for rel, absdir in sets:
        cur = results.get(rel, {})
        if len(cur) == 4:
            done += 1
            continue
        for stem, key in KEYS.items():
            if cur.get(key):
                continue
            path = os.path.join(absdir, stem + ".mp3")
            if not os.path.isfile(path):
                print("  ! missing " + rel + "/" + stem + ".mp3")
                continue
            segments, _info = model.transcribe(path, language="en", beam_size=5, vad_filter=False)
            text = " ".join(s.text.strip() for s in segments).strip()
            cur[key] = text
        results[rel] = cur
        done += 1
        with open(args.out_json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print("[" + str(done) + "/" + str(len(sets)) + "] " + rel + " -- " + cur.get("q8", "")[:60])

    print("\nDone in " + str(round(time.time() - t0)) + "s -> " + args.out_json)


if __name__ == "__main__":
    main()
