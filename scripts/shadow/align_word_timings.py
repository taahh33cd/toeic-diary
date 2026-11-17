#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
align_word_timings.py — moc thoi gian TUNG TU cho phan Shadow (docs/shadow-spec.md).

Cach lam (da do tren 31 bai x 10 de EST 2024 + nghe kiem 50 cau, xem spec):
  1. Forced alignment CA BAI: stable-ts model.align(audio, toan bo transcript).
     91.8% tu lech < 100ms so voi ASR; nghe kiem 48/50 cau "Khop", 0 cau "Sai".
     (Ghi chu trong realign-broken-timestamps.py noi align chi khop 33-64% o Part
     1/2 — so do do tren audio local bi lech 1 track; audio production thi on.)
  2. Kiem tung cau: tu thieu moc, dai 0s hoac > 2.5s → can lai RIENG cau do trong
     khung [het cau truoc, dau cau sau] lay tu ket qua buoc 1.
  3. Van hong → ghi null cho cau do (giao dien chi lam noi ca cau) va dua vao
     danh sach issues de admin xem.

Moc ung voi tung tu cua content tach theo khoang trang — cung quy uoc voi
splitDisplayWords() trong lib/shadow/prosody.ts. Tu chi co dau cau ("—") khong
nghe duoc nen lay moc 0s ngay sau tu truoc.

Input : lessons.json (scripts/shadow/export-lessons.ts)
Output: word-timings.json — chay lai se BO QUA bai da co, nen dung giua chung
        roi chay tiep duoc.

Usage:
    py -3.11 scripts/shadow/align_word_timings.py <lessons.json> <out.json> [--audio-cache DIR] [--model small]
"""

import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

import numpy as np

SR = 16000
MIN_WORD_SEC = 0.02
MAX_WORD_SEC = 2.5
STRIP = re.compile(r"^[^\w$%']+|[^\w%']+$")


def norm(w):
    return STRIP.sub("", w.lower().replace("’", "'"))


def load_audio(url, cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, hashlib.sha1(url.encode()).hexdigest()[:16] + os.path.splitext(url)[1][:5])
    if not os.path.isfile(path):
        tmp = path + ".part"
        urllib.request.urlretrieve(url, tmp)
        os.replace(tmp, path)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def align_words(model, pcm, tokens, offset=0.0):
    """Can danh sach token vao doan audio; tra list (start, end) | None theo tung token."""
    spoken = [t for t in tokens if norm(t)]
    if not spoken or len(pcm) < SR * 0.2:
        return [None] * len(tokens)
    res = model.align(pcm, " ".join(spoken), language="en", verbose=None)
    got = [(norm(w.word), w.start + offset, w.end + offset) for w in res.all_words() if norm(w.word)]
    want = [norm(t) for t in tokens]
    out = [None] * len(tokens)
    sm = difflib.SequenceMatcher(None, want, [g[0] for g in got], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            out[a + k] = (got[b + k][1], got[b + k][2])
    return out


def sentence_ok(tokens, times):
    for t, ts in zip(tokens, times):
        if not norm(t):
            continue
        if ts is None or not (MIN_WORD_SEC <= ts[1] - ts[0] <= MAX_WORD_SEC):
            return False
    return True


def finalize(tokens, times):
    """Lap moc cho tu chi co dau cau, ep tang dan, lam tron 2 chu so."""
    out, prev_end = [], None
    for t, ts in zip(tokens, times):
        if ts is None:
            if prev_end is None:
                return None
            ts = (prev_end, prev_end)
        s = max(ts[0], out[-1][0] if out else ts[0])
        e = max(ts[1], s)
        out.append([round(s, 2), round(e, 2)])
        prev_end = e
    return out


def process_lesson(model, lesson, cache_dir):
    pcm = load_audio(lesson["audioUrl"], cache_dir)
    dur = len(pcm) / SR
    sents = lesson["sentences"]
    toks = [s["content"].split() for s in sents]
    flat = [t for ts in toks for t in ts]
    first = align_words(model, pcm, flat)

    per, k = [], 0
    for ts in toks:
        per.append(first[k:k + len(ts)])
        k += len(ts)

    result, issues = {}, []
    for i, s in enumerate(sents):
        times = per[i]
        if not sentence_ok(toks[i], times):
            # Khung can lai: tu het tu cuoi cau truoc toi dau tu dau cau sau (lay tu buoc 1, neu hop le).
            prev = next((x for j in range(i - 1, -1, -1) for x in reversed(per[j]) if x), None)
            nxt = next((x for j in range(i + 1, len(sents)) for x in per[j] if x), None)
            lo = max(0.0, (prev[1] if prev else s["startTime"]) - 0.15)
            hi = min(dur, (nxt[0] if nxt else max(s["endTime"], lo + 1.0)) + 0.15)
            if hi - lo > 0.3:
                try:
                    times = align_words(model, pcm[int(lo * SR):int(hi * SR)], toks[i], offset=lo)
                except Exception as e:  # noqa: BLE001
                    issues.append({"sentenceId": s["id"], "reason": f"realign error: {e}"})
            if sentence_ok(toks[i], times):
                issues.append({"sentenceId": s["id"], "reason": "realigned", "content": s["content"]})
        if sentence_ok(toks[i], times):
            result[s["id"]] = finalize(toks[i], times)
        else:
            result[s["id"]] = None
            issues.append({"sentenceId": s["id"], "reason": "unaligned", "content": s["content"]})
    return result, issues, dur


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lessons")
    ap.add_argument("out")
    ap.add_argument("--audio-cache", default=os.path.join("scripts", "data", "shadow-audio-cache"))
    ap.add_argument("--model", default="small")
    a = ap.parse_args()

    lessons = json.load(open(a.lessons, encoding="utf-8"))
    out = {"model": a.model, "lessons": {}}
    if os.path.isfile(a.out):
        out = json.load(open(a.out, encoding="utf-8"))
    todo = [l for l in lessons if l["id"] not in out["lessons"]]
    print(f"[shadow-align] {len(lessons)} bai, con {len(todo)} bai can can", flush=True)

    import stable_whisper
    model = stable_whisper.load_model(a.model, device="cpu")

    t_all = time.time()
    for n, lesson in enumerate(todo, 1):
        t0 = time.time()
        try:
            result, issues, dur = process_lesson(model, lesson, a.audio_cache)
        except Exception as e:  # noqa: BLE001
            print(f"  [loi] {lesson.get('label', lesson['id'])}: {e}", flush=True)
            continue
        out["lessons"][lesson["id"]] = {"label": lesson.get("label"), "sentences": result, "issues": issues}
        ok = sum(v is not None for v in result.values())
        bad = sum(1 for x in issues if x["reason"] == "unaligned")
        print(f"  {n}/{len(todo)} {lesson.get('label', lesson['id'])}: {ok}/{len(result)} cau"
              f"{f', {bad} cau khong can duoc' if bad else ''} | {dur:.0f}s audio, {time.time() - t0:.0f}s", flush=True)
        tmp = a.out + ".tmp"
        json.dump(out, open(tmp, "w", encoding="utf-8"), ensure_ascii=False)
        os.replace(tmp, a.out)

    total = sum(len(v["sentences"]) for v in out["lessons"].values())
    good = sum(1 for v in out["lessons"].values() for x in v["sentences"].values() if x is not None)
    print(f"done: {good}/{total} cau co moc ({100 * good / max(1, total):.1f}%) — {time.time() - t_all:.0f}s", flush=True)


if __name__ == "__main__":
    sys.exit(main())
