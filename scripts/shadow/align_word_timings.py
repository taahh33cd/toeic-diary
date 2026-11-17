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
     khung [het cau tot gan nhat phia truoc, dau cau tot gan nhat phia sau].
     KHONG lay khung theo start/end cua cau trong DB: ~6% cau DB bat dau muon.
  3. Van hong → ASR (faster-whisper) trong cung khung, khop nguoc ve transcript.
     Can cho Part 1/2: loi dan "Number one. Look at the picture..." va chu "A."
     khong co trong transcript lam forced alignment gop sai cac cau dau.
  4. Van hong → ghi null cho cau do (giao dien chi lam noi ca cau) va dua vao
     danh sach issues de admin xem.

Moc ung voi tung tu cua content tach theo khoang trang — cung quy uoc voi
splitDisplayWords() trong lib/shadow/prosody.ts. Tu chi co dau cau ("—") khong
nghe duoc nen lay moc 0s ngay sau tu truoc.

Input : lessons.json (scripts/shadow/export-lessons.ts)
Output: word-timings.json — chay lai se BO QUA bai da co, nen dung giua chung
        roi chay tiep duoc.

Usage:
    py -3.11 scripts/shadow/align_word_timings.py <lessons.json> <out.json> [--audio-cache DIR] [--model small] [--retry-failed]

    --retry-failed  chay lai ca nhung bai da co trong out.json nhung con cau null
    Model faster-whisper tai tu HuggingFace o lan dau; may khong vao duoc HF thi dat HF_HUB_OFFLINE=1.
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


def asr_words(fw, pcm, tokens, offset):
    """ASR trong doan audio, khop nguoc ve token; tu khong khop thi noi suy giua hai tu khop."""
    segs, _ = fw.transcribe(pcm, language="en", word_timestamps=True, beam_size=5)
    got = [(norm(w.word), w.start + offset, w.end + offset) for sg in segs for w in (sg.words or []) if norm(w.word)]
    want = [norm(t) for t in tokens]
    out = [None] * len(tokens)
    sm = difflib.SequenceMatcher(None, want, [g[0] for g in got], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            out[a + k] = (got[b + k][1], got[b + k][2])
    spoken = [i for i, t in enumerate(tokens) if norm(t)]
    if not spoken or sum(out[i] is not None for i in spoken) < 0.6 * len(spoken):
        return [None] * len(tokens)
    # Noi suy tu khong khop nam giua hai tu da khop, chia theo do dai chu.
    i = 0
    while i < len(tokens):
        if out[i] is None and norm(tokens[i]):
            j = i
            while j < len(tokens) and out[j] is None:
                j += 1
            if i > 0 and j < len(tokens) and out[i - 1] and out[j]:
                lo, hi = out[i - 1][1], out[j][0]
                w = [max(1, len(norm(tokens[k]))) for k in range(i, j)]
                cur = lo
                for k, wk in zip(range(i, j), w):
                    d = (hi - lo) * wk / sum(w)
                    out[k] = (cur, cur + d)
                    cur += d
            i = j
        else:
            i += 1
    # ASR hay nuot chu "A." / "Number 15." vao tu dau cau, hoac gan chu "A." cho mao tu
    # "A" dau cau ("A man is...") lam tu sau bi keo dai. Hau kiem:
    #   - tu dai > 0.8s: dau tu ve sat cuoi tu (0.5s)
    #   - tu dau cau cach tu thu hai > 0.4s: doi ve ngay truoc tu thu hai
    for k, ts in enumerate(out):
        if ts and ts[1] - ts[0] > 0.8:
            out[k] = (ts[1] - 0.5, ts[1])
    if len(out) > 1 and out[0] and out[1] and out[1][0] - out[0][1] > 0.4:
        d = min(0.3, out[0][1] - out[0][0])
        out[0] = (out[1][0] - d, out[1][0])
    return out


def sentence_ok(tokens, times):
    for t, ts in zip(tokens, times):
        if not norm(t):
            continue
        if ts is None or not (MIN_WORD_SEC <= ts[1] - ts[0] <= MAX_WORD_SEC):
            return False
    return True


def tidy(tokens, times):
    """Hau kiem cho moi cach can. Loi hay gap o Part 1/2: chu cai dap an "A." doc truoc
    cau bi gan cho mao tu "A" dau cau ("A man is..."), keo tu thu hai dai > 1s."""
    times = list(times)
    last = max((i for i, t in enumerate(tokens) if norm(t)), default=-1)
    for k, ts in enumerate(times):
        if ts and k != last and ts[1] - ts[0] > 0.9:
            times[k] = (ts[1] - 0.55, ts[1])
    if len(times) > 1 and times[0] and times[1] and times[1][0] - times[0][1] > 0.4:
        d = min(0.3, times[0][1] - times[0][0])
        times[0] = (times[1][0] - d, times[1][0])
    return times


def finalize(tokens, times):
    """Hau kiem, lap moc cho tu chi co dau cau, ep tang dan, lam tron 2 chu so."""
    times = tidy(tokens, times)
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


def process_lesson(model, fw, lesson, cache_dir):
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

    good = [sentence_ok(toks[i], per[i]) for i in range(len(sents))]

    def window(i):
        """[het tu cuoi cau tot gan nhat phia truoc, dau tu dau cau tot gan nhat phia sau]."""
        prev = next((per[j][-1] for j in range(i - 1, -1, -1) if good[j] and per[j] and per[j][-1]), None)
        nxt = next((per[j][0] for j in range(i + 1, len(sents)) if good[j] and per[j] and per[j][0]), None)
        lo = max(0.0, (prev[1] if prev else 0.0) - 0.1)
        hi = min(dur, (nxt[0] if nxt else dur) + 0.1)
        return lo, hi

    result, issues = {}, []
    for i, s in enumerate(sents):
        times = per[i]
        reason = None
        if not good[i]:
            lo, hi = window(i)
            seg = pcm[int(lo * SR):int(hi * SR)]
            if hi - lo > 0.3:
                try:
                    times = align_words(model, seg, toks[i], offset=lo)
                    reason = "realigned"
                except Exception as e:  # noqa: BLE001
                    issues.append({"sentenceId": s["id"], "reason": f"realign error: {e}"})
                if not sentence_ok(toks[i], times) and fw is not None:
                    times = asr_words(fw, seg, toks[i], offset=lo)
                    reason = "asr"
        if sentence_ok(toks[i], times):
            result[s["id"]] = finalize(toks[i], times)
            if reason:
                issues.append({"sentenceId": s["id"], "reason": reason, "content": s["content"]})
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
    ap.add_argument("--retry-failed", action="store_true")
    a = ap.parse_args()

    lessons = json.load(open(a.lessons, encoding="utf-8"))
    out = {"model": a.model, "lessons": {}}
    if os.path.isfile(a.out):
        out = json.load(open(a.out, encoding="utf-8"))
    def failed(lid):
        return any(v is None for v in out["lessons"][lid]["sentences"].values())
    todo = [l for l in lessons if l["id"] not in out["lessons"] or (a.retry_failed and failed(l["id"]))]
    print(f"[shadow-align] {len(lessons)} bai, con {len(todo)} bai can can", flush=True)

    import stable_whisper
    from faster_whisper import WhisperModel
    model = stable_whisper.load_model(a.model, device="cpu")
    fw = WhisperModel(a.model, device="cpu", compute_type="int8")

    t_all = time.time()
    for n, lesson in enumerate(todo, 1):
        t0 = time.time()
        try:
            result, issues, dur = process_lesson(model, fw, lesson, a.audio_cache)
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
