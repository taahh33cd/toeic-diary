#!/usr/bin/env python3
"""
whisperx_timestamps.py

Dung faster-whisper de transcribe audio va lay word-level timestamps.
Output: JSON file voi sentence-level timestamps.

Usage:
    py -3.11 scripts/whisperx_timestamps.py <audio_dir> <parsed_json> [--model small]

Arguments:
    audio_dir    : thu muc chua cac file MP3 (e.g. scripts/data/test1/audio)
    parsed_json  : duong dan toi parsed.json (e.g. scripts/data/test1/parsed.json)
    --model      : whisper model size: tiny, base, small (default), medium
"""

import argparse
import json
import os
import sys
import time

# Fix OMP duplicate library error on Windows with Intel MKL
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")


def main():
    parser = argparse.ArgumentParser(description="faster-whisper sentence timestamps")
    parser.add_argument("audio_dir", help="Directory containing MP3 files")
    parser.add_argument("parsed_json", help="Path to parsed.json")
    parser.add_argument("--model", default="small", choices=["tiny", "base", "small", "medium", "large-v2"])
    parser.add_argument("--language", default="en")
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
    print("\n[faster-whisper] timestamps -- " + test_name)
    print("   Model  : " + args.model)
    print("   Device : cpu")
    print("   Lessons: " + str(len(lessons)) + "\n")

    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        print("ERROR: faster_whisper not installed: " + str(e), file=sys.stderr)
        print("Run: py -3.11 -m pip install faster-whisper", file=sys.stderr)
        sys.exit(1)

    print("Loading model '" + args.model + "'...")
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
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

        audio_file = audio_files[0]
        audio_path = os.path.join(args.audio_dir, audio_file)

        if not os.path.isfile(audio_path):
            print("  [skip] Audio not found: " + audio_file)
            skipped += 1
            continue

        if not sentences:
            print("  [skip] No sentences for: " + title)
            skipped += 1
            continue

        print("  [audio] " + title + " (" + audio_file + ")")
        t0 = time.time()

        try:
            all_words, audio_duration = transcribe_words(model, audio_path, args.language)

            # If too few words found (e.g. Part 1 narrator intro blocks options),
            # retry from just after where transcription ended
            expected_min_words = sum(len(s.get("content","").split()) for s in sentences)
            if len(all_words) < expected_min_words * 0.5 and all_words:
                last_end = all_words[-1]["end"]
                retry_offset = last_end + 0.5
                print("     [retry] Only " + str(len(all_words)) + " words found, retrying from " + str(round(retry_offset, 1)) + "s")
                extra_words, _ = transcribe_words(model, audio_path, args.language, start_time=retry_offset)
                all_words = all_words + extra_words

            # Match sentences to word spans
            sentence_timestamps = match_sentences_to_words(sentences, all_words, audio_duration)

            elapsed = time.time() - t0
            print("     ok " + str(len(sentences)) + " sentences - " +
                  str(round(audio_duration, 1)) + "s audio - " +
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


def transcribe_words(model, audio_path, language, start_time=None):
    """
    Transcribe audio and return flat list of word dicts + audio_duration.
    If start_time is given, use clip_timestamps to start from that point.
    """
    kwargs = dict(language=language, word_timestamps=True, beam_size=1)
    if start_time is not None:
        kwargs["clip_timestamps"] = str(start_time)

    segments_gen, info = model.transcribe(audio_path, **kwargs)
    audio_duration = info.duration

    all_words = []
    for seg in segments_gen:
        if seg.words:
            for w in seg.words:
                word_clean = w.word.strip().lower().strip(".,!?;:\"'()-")
                if word_clean:
                    all_words.append({"word": word_clean, "start": w.start, "end": w.end})

    return all_words, audio_duration


def normalize_word(w):
    return w.lower().strip(".,!?;:\"'()-").strip()


def match_sentences_to_words(sentences, all_words, audio_duration):
    """
    Match each sentence to a span of words in the aligned word list.
    Returns list of { orderIndex, startTime, endTime }.
    """
    results = []
    word_cursor = 0
    n_words = len(all_words)

    for sent in sentences:
        order_index = sent.get("orderIndex", 0)
        content = sent.get("content", "")

        sent_words = [normalize_word(w) for w in content.split() if normalize_word(w)]

        if not sent_words or word_cursor >= n_words:
            results.append({"orderIndex": order_index, "startTime": 0.0, "endTime": 0.0})
            continue

        # Find best matching start position
        best_start_idx = word_cursor
        best_score = -1
        search_window = min(n_words, word_cursor + len(sent_words) + 30)

        for start_idx in range(word_cursor, search_window):
            score = 0
            check_words = sent_words[:min(6, len(sent_words))]
            for j, sw in enumerate(check_words):
                idx = start_idx + j
                if idx < n_words:
                    if all_words[idx]["word"] == sw:
                        score += 1
                    elif sw in all_words[idx]["word"] or all_words[idx]["word"] in sw:
                        score += 0.5
            if score > best_score:
                best_score = score
                best_start_idx = start_idx

        end_idx = min(best_start_idx + len(sent_words) - 1, n_words - 1)

        start_time = all_words[best_start_idx]["start"]
        end_time = all_words[end_idx]["end"]

        results.append({
            "orderIndex": order_index,
            "startTime": round(start_time, 2),
            "endTime": round(end_time, 2),
        })

        word_cursor = end_idx + 1

    return results


if __name__ == "__main__":
    main()
