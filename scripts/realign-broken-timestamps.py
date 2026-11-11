#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
realign-broken-timestamps.py

Can lai timestamp cho nhung bai co cau bi WhisperX gan sai (nghe khong het cau,
replay khong vao dung cau).

Tai sao KHONG dung forced alignment (stable-ts model.align): file audio Part
1/2 con co giong doc de ("Number 15. Mark your answer on your answer sheet.")
va cac khoang lang dai, nhung thu nay KHONG nam trong transcript.
model.align() gia dinh transcript bao het audio nen bi lech — do thu voi model
small chi khop 33-64% so tu.

Cach dung o day: ASR (faster-whisper, word_timestamps) lay moc thoi gian cua
MOI TU NGHE DUOC, roi dong chuoi tu ASR vao chuoi tu MONG DOI tu transcript
bang Needleman-Wunsch (chinh xac, O(n*m), n ~ 200 tu/bai nen rat nhanh). Tu
thua cua giong doc de tu dong thanh gap, loi ASR thanh mismatch — dung viec NW
lam tot. Khac han scripts/forced_align_timestamps.py: script do map cau bang
heuristic "do cua so khop" roi lay dung len(sent_words) tu, chinh kieu drift
da sinh ra du lieu loi.

Input : lessons.json do scripts/export-broken-timestamps.ts xuat ra
Output : realigned.json — chi de DOI CHIEU, viec ghi DB do script TS lam

Usage:
    py -3.11 scripts/realign-broken-timestamps.py <lessons.json> <audio_dir> <out.json> [--model small]
"""

import argparse
import json
import os
import re
import sys
import time
from difflib import SequenceMatcher

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

GAP = -1.0        # diem phat khi bo qua mot tu
MATCH = 2.0       # diem khop hoan toan
PARTIAL = 0.5     # diem khop mot phan (tu nay chua tu kia)
MISMATCH = -1.5   # diem lech han


def norm(w):
    """Chuan hoa mot tu de so khop — cung tinh than voi lib/practice/match.ts."""
    w = w.replace("’", "'").replace("‘", "'")
    w = w.lower()
    w = re.sub(r"[^a-z0-9']", "", w)
    return w.strip("'")


def score(a, b):
    if a == b:
        return MATCH
    if a and b and (a in b or b in a):
        return PARTIAL
    # ASR hay nghe lech ten rieng ("Gerhard" -> "Gerhart", "Asako" -> "Asaco").
    # Khong tinh la khop thi cau ngan mat nhieu tu -> truot cong kiem tra.
    if a and b and max(len(a), len(b)) >= 4:
        r = SequenceMatcher(None, a, b).ratio()
        if r >= 0.75:
            return PARTIAL
    return MISMATCH


def align_sequences(exp, act):
    """
    Needleman-Wunsch tren hai chuoi tu. Tra list cung do dai exp:
    index cua tu trong act da khop, hoac None.
    """
    n, m = len(exp), len(act)
    # bang diem
    F = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        F[i][0] = F[i - 1][0] + GAP
    for j in range(1, m + 1):
        F[0][j] = F[0][j - 1] + GAP
    for i in range(1, n + 1):
        ei = exp[i - 1]
        Fi, Fp = F[i], F[i - 1]
        for j in range(1, m + 1):
            Fi[j] = max(
                Fp[j - 1] + score(ei, act[j - 1]),
                Fp[j] + GAP,
                Fi[j - 1] + GAP,
            )
    # truy vet
    out = [None] * n
    i, j = n, m
    while i > 0 and j > 0:
        if F[i][j] == F[i - 1][j - 1] + score(exp[i - 1], act[j - 1]):
            if score(exp[i - 1], act[j - 1]) > 0:
                out[i - 1] = j - 1
            i -= 1
            j -= 1
        elif F[i][j] == F[i - 1][j] + GAP:
            i -= 1
        else:
            j -= 1
    return out


def probe_duration(path):
    try:
        import subprocess
        p = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True)
        return float(p.stdout.strip()) if p.stdout.strip() else 0.0
    except Exception:
        return 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lessons_json")
    ap.add_argument("audio_dir")
    ap.add_argument("out_json")
    ap.add_argument("--model", default="small",
                    choices=["tiny", "base", "small", "medium", "large-v2"])
    # Chia viec de chay nhieu tien trinh song song: --shard 0/3, 1/3, 2/3
    ap.add_argument("--shard", default=None,
                    help="dang i/n: chi xu ly cac bai co index %% n == i")
    ap.add_argument("--threads", type=int, default=0,
                    help="so CPU thread cho moi tien trinh (0 = mac dinh)")
    # Che do audit: chi can biet transcript co khop audio hay khong, nen bo
    # word_timestamps (moi segment bot mot luot alignment -> nhanh han nhieu).
    # Doi lai moc thoi gian chi con theo segment, KHONG duoc ghi vao DB, nen
    # o che do nay newStart/newEnd de null de apply-* tu dong tu choi.
    ap.add_argument("--audit", action="store_true",
                    help="chi do coverage, khong xuat timestamp")
    args = ap.parse_args()

    with open(args.lessons_json, "r", encoding="utf-8") as f:
        lessons = json.load(f)

    shard_tag = ""
    if args.shard:
        si, sn = (int(x) for x in args.shard.split("/"))
        lessons = [l for k, l in enumerate(lessons) if k % sn == si]
        shard_tag = " [shard %d/%d]" % (si, sn)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("ERROR: chua co faster-whisper. Chay: py -3.11 -m pip install faster-whisper",
              file=sys.stderr)
        sys.exit(1)

    print("Nap model '%s'..." % args.model)
    mkw = {"cpu_threads": args.threads} if args.threads > 0 else {}
    model = WhisperModel(args.model, device="cpu", compute_type="int8", **mkw)
    print("%d bai%s" % (len(lessons), shard_tag))
    print("Xong\n")

    results = {}
    for li, lesson in enumerate(lessons, 1):
        label = lesson["label"]
        path = os.path.join(args.audio_dir, lesson["audioFile"])
        if not os.path.isfile(path):
            print("  [bo qua] khong thay audio: %s" % label)
            continue

        sents = lesson["sentences"]
        # chuoi tu mong doi + tu do suy ra tu nao thuoc cau nao
        exp_words, owner = [], []
        for si, s in enumerate(sents):
            for w in s["words"]:
                nw = norm(w)
                if nw:
                    exp_words.append(nw)
                    owner.append(si)

        transcript = " ".join(" ".join(s["words"]) for s in sents)
        dur = probe_duration(path) or lesson.get("audioDuration", 0.0)

        print("[%d/%d] %s  (%d cau, %d tu, %.1fs)" %
              (li, len(lessons), label, len(sents), len(exp_words), dur))
        t0 = time.time()
        try:
            # KHONG dung initial_prompt: da do thu, dua ca transcript vao lam
            # model bi lech han (bai EST 2026 Test 5 P3: 67 tu va hallucinate
            # "Thank you, Tariq. I'll see you at the office." o 0-20.9s, trong
            # khi khong prompt thi ra 132 tu dung gan nhu hoan toan).
            # condition_on_previous_text=False de khong bi drift qua cac khoang lang dai.
            segs, _info = model.transcribe(
                path, language="en", word_timestamps=not args.audit,
                beam_size=1 if args.audit else 5, vad_filter=False,
                condition_on_previous_text=False,
            )
            act = []
            for seg in segs:
                words = seg.words or []
                if words:
                    for w in words:
                        if w.start is None or w.end is None or w.end <= w.start:
                            continue
                        nw = norm(w.word)
                        if nw:
                            act.append({"w": nw, "s": float(w.start), "e": float(w.end)})
                else:
                    # khong co moc tung tu: noi suy deu trong segment, chi du
                    # dung cho viec do coverage
                    toks = [t for t in (norm(x) for x in seg.text.split()) if t]
                    if not toks:
                        continue
                    span = max(0.01, float(seg.end) - float(seg.start)) / len(toks)
                    for k, t in enumerate(toks):
                        act.append({"w": t,
                                    "s": float(seg.start) + k * span,
                                    "e": float(seg.start) + (k + 1) * span})
        except Exception as e:
            print("  [LOI] %s" % e)
            continue

        if not act:
            print("  [LOI] ASR khong tra ve tu nao")
            continue

        mapping = align_sequences(exp_words, [a["w"] for a in act])
        matched = sum(1 for m in mapping if m is not None)

        # gom theo cau
        per = [{"s": None, "e": None, "n": 0} for _ in sents]
        for ei, ai in enumerate(mapping):
            if ai is None:
                continue
            si = owner[ei]
            a = act[ai]
            p = per[si]
            p["s"] = a["s"] if p["s"] is None else min(p["s"], a["s"])
            p["e"] = a["e"] if p["e"] is None else max(p["e"], a["e"])
            p["n"] += 1

        out_sents = []
        for si, s in enumerate(sents):
            p = per[si]
            nwords = len([w for w in s["words"] if norm(w)])
            out_sents.append({
                "id": s["id"],
                "orderIndex": s["orderIndex"],
                "words": nwords,
                "matchedWords": p["n"],
                "newStart": None if (args.audit or p["s"] is None) else round(p["s"], 2),
                "newEnd": None if (args.audit or p["e"] is None) else round(p["e"], 2),
                "dbStart": s["dbStart"],
                "dbEnd": s["dbEnd"],
                "content": s["content"][:70],
            })

        results[lesson["lessonId"]] = {
            "label": label,
            "audioDuration": round(dur, 2),
            "badIdx": lesson["badIdx"],
            "coverage": round(matched / max(1, len(exp_words)), 4),
            "asrText": " ".join(a["w"] for a in act),
            "sentences": out_sents,
        }
        print("  ASR %d tu -> khop %d/%d tu (%.1f%%) — %.1fs\n" %
              (len(act), matched, len(exp_words), 100.0 * matched / max(1, len(exp_words)),
               time.time() - t0))

    with open(args.out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("Ghi: %s  (%d bai)" % (args.out_json, len(results)))


if __name__ == "__main__":
    main()
