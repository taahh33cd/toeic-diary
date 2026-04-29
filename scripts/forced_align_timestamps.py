#!/usr/bin/env python3
"""
forced_align_timestamps.py

Dung stable-whisper forced alignment de lay timestamps chinh xac hon.
Thay vi ASR (tu nhan dang), script nay BIET truoc transcript va chi can "can" text vao audio.

Usage:
    py -3.11 scripts/forced_align_timestamps.py <audio_dir> <parsed_json> [--model small]

Arguments:
    audio_dir    : thu muc chua cac file MP3 (e.g. scripts/data/test1/audio)
    parsed_json  : duong dan toi parsed.json (e.g. scripts/data/test1/parsed.json)
    --model      : whisper model size: tiny, base, small (default), medium
"""

import argparse
import json
import os
import re
import sys
import time

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")


def normalize(text):
    """Strip option labels like (A), (B), NARRATOR:, Man:, etc. and clean up."""
    text = re.sub(r"^\([A-D]\)\s*", "", text.strip())
    text = re.sub(r"^[A-Z][a-z]*\s*:\s*", "", text)
    return text.strip()


def map_sentences_to_words(sentences, sentence_texts, all_words, audio_duration):
    """Map each sentence to its word span using sequential matching."""
    results = []
    word_cursor = 0
    n_words = len(all_words)

    for i, sent in enumerate(sentences):
        order_index = sent.get("orderIndex", i)
        sent_words = [re.sub(r"[.,!?;:\"'()\-]", "", w.lower()) for w in sentence_texts[i].split() if w.strip()]
        sent_words = [w for w in sent_words if w]

        if not sent_words or word_cursor >= n_words:
            results.append({"orderIndex": order_index, "startTime": 0.0, "endTime": 0.0})
            continue

        # Find best matching start in a window ahead
        best_start = word_cursor
        best_score = -1
        window = min(n_words, word_cursor + len(sent_words) + 20)

        for idx in range(word_cursor, window):
            score = 0
            check = sent_words[:min(5, len(sent_words))]
            for j, sw in enumerate(check):
                wi = idx + j
                if wi < n_words:
                    aw = all_words[wi]["word"]
                    if aw == sw:
                        score += 1
                    elif sw in aw or aw in sw:
                        score += 0.5
            if score > best_score:
                best_score = score
                best_start = idx

        end_idx = min(best_start + len(sent_words) - 1, n_words - 1)
        start_time = round(all_words[best_start]["start"], 2)
        end_time = round(all_words[end_idx]["end"], 2)

        results.append({"orderIndex": order_index, "startTime": start_time, "endTime": end_time})
        word_cursor = end_idx + 1

    return results


def main():
    parser = argparse.ArgumentParser(description="stable-whisper forced alignment timestamps")
    parser.add_argument("audio_dir", help="Directory containing MP3 files")
    parser.add_argument("parsed_json", help="Path to parsed.json")
    parser.add_argument("--model", default="small", choices=["tiny", "base", "small", "medium", "large-v2"])
    args = parser.parse_args()

    if not os.path.isdir(args.audio_dir):
        print("ERROR: audio_dir not found: " + args.audio_dir, file=sys.stderr)
        sys.exit(1)

    if not os.path.isfile(args.parsed_json):
        print("ERROR: parsed.json not found: " + args.parsed_json, file=sys.stderr)
        sys.exit(1)

    with open(args.parsed_json, "r", encoding="utf-8") as f:
        parsed = json.load(f)

    test_name = parsed.get("testName", "unknown")
    lessons = parsed.get("lessons", [])
    print("\n[forced-align] timestamps -- " + test_name)
    print("   Model  : " + args.model)
    print("   Lessons: " + str(len(lessons)) + "\n")

    try:
        import stable_whisper
    except ImportError:
        print("ERROR: stable-ts not installed. Run: py -3.11 -m pip install stable-ts", file=sys.stderr)
        sys.exit(1)

    print("Loading model '" + args.model + "'...")
    model = stable_whisper.load_model(args.model)
    print("Model loaded\n")

    results = {}
    processed = 0
    skipped = 0

    for lesson in lessons:
        title = lesson.get("title", "")
        audio_files = lesson.get("audioFiles", [])
        sentences = lesson.get("sentences", [])

        if not audio_files:
            print("  [skip] No audio file for: " + title)
            skipped += 1
            continue

        audio_path = os.path.join(args.audio_dir, audio_files[0])
        if not os.path.isfile(audio_path):
            print("  [skip] Audio not found: " + audio_files[0])
            skipped += 1
            continue

        print("  [audio] " + title + " (" + audio_files[0] + ")")
        t0 = time.time()

        # Get audio duration via ffprobe
        try:
            import subprocess
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", audio_path],
                capture_output=True, text=True
            )
            audio_duration = float(probe.stdout.strip()) if probe.stdout.strip() else 0.0
        except Exception:
            audio_duration = 0.0

        # Build full transcript as single block (forced alignment works better this way)
        sentence_texts = [normalize(s.get("content", "")) for s in sentences]
        full_transcript = " ".join(sentence_texts)

        try:
            # Forced alignment: align known transcript to audio
            result = model.align(audio_path, full_transcript, language="en")

            # Collect all word timestamps (flat list, highly accurate from forced alignment)
            all_words = []
            for seg in result.segments:
                for w in (seg.words or []):
                    if w.start is not None and w.end is not None and w.end > w.start:
                        word_clean = re.sub(r"[.,!?;:\"'()\-]", "", w.word.strip().lower())
                        if word_clean:
                            all_words.append({"word": word_clean, "start": w.start, "end": w.end})

            # Map sentences back to word spans
            sentence_timestamps = map_sentences_to_words(sentences, sentence_texts, all_words, audio_duration)

            elapsed = time.time() - t0
            matched = sum(1 for t in sentence_timestamps if t["startTime"] > 0)
            print("     ok " + str(matched) + "/" + str(len(sentences)) +
                  " sentences matched - " + str(round(audio_duration, 1)) + "s audio - " +
                  str(round(elapsed, 1)) + "s processing")

            results[title] = {
                "audioDuration": round(audio_duration, 2),
                "sentences": sentence_timestamps,
            }
            processed += 1

        except Exception as e:
            print("  [ERROR] " + title + ": " + str(e), file=sys.stderr)
            import traceback
            traceback.print_exc()
            skipped += 1
            continue

    # Write output
    output_dir = os.path.dirname(os.path.abspath(args.parsed_json))
    output_path = os.path.join(output_dir, "timestamps.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\nDone!")
    print("   Processed : " + str(processed) + " lessons")
    print("   Skipped   : " + str(skipped) + " lessons")
    print("   Output    : " + output_path + "\n")


if __name__ == "__main__":
    main()
