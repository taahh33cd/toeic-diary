#!/usr/bin/env tsx
/**
 * build-listen-data.ts
 *
 * Ghép hai nguồn thành dữ liệu nhánh Nghe của subskill Chunking:
 *   • transcript chính thức  — lib/subskills/part3/data/passages.json
 *   • mốc thời gian từng từ  — scripts/chunking/words.json (whisper-words.py)
 *
 * Whisper nghe lại audio nên chữ nó ra không khớp tuyệt đối với transcript đề
 * (còn đọc cả câu dẫn "Questions 32 through 34…"). Vì vậy phải khớp hai chuỗi
 * bằng Needleman–Wunsch rồi mới gán mốc cho từng từ của transcript.
 *
 * Sau khi có mốc, ranh giới chunk ngữ pháp được đối chiếu với khoảng lặng thật:
 * chỗ người đọc không hề ngừng thì bỏ ranh giới, chỗ ngừng rõ mà chưa có ranh
 * giới thì thêm vào. Đáp án cuối cùng là nhịp thật của người bản ngữ.
 *
 * Usage: npx tsx scripts/chunking/build-listen-data.ts
 * Output: lib/subskills/chunking/data/listen.json
 */

import * as fs from "fs";
import * as path from "path";
import { chunkSentence } from "../../lib/subskills/chunking/chunker";

const ROOT = path.resolve(__dirname, "..", "..");
const PASSAGES = path.join(ROOT, "lib", "subskills", "part3", "data", "passages.json");
const WORDS = path.join(ROOT, "scripts", "chunking", "words.json");
const OUT = path.join(ROOT, "lib", "subskills", "chunking", "data", "listen.json");

/**
 * Từ mức này là ngừng rõ → thêm ranh giới dù quy ước ngữ pháp không đòi.
 *
 * Mốc của whisper chỉ là bằng chứng DƯƠNG: trong một segment nó gán end của từ
 * này bằng start của từ kế (87% khoảng cách đúng bằng 0), nên "không có khoảng
 * lặng" không chứng minh được người đọc không ngừng. Vì vậy chỉ dùng mốc để
 * THÊM ranh giới, không bao giờ dùng để xoá ranh giới ngữ pháp.
 */
const REAL_PAUSE = 0.3;

type WhisperWord = { w: string; start: number; end: number };
type WordsFile = Record<string, { duration: number; words: WhisperWord[] }>;

type Passage = {
  groupId: string;
  testNumber: number;
  part: 3 | 4;
  questionStart: number;
  questionEnd: number;
  audioUrl: string;
  lines: { speaker: string | null; text: string }[];
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9']/g, "");
}

/** Cắt một dòng transcript thành câu, không bị dấu chấm viết tắt làm lạc. */
function splitSentences(line: string): string[] {
  const out: string[] = [];
  let buf = "";
  const tokens = line.trim().split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    buf += (buf ? " " : "") + t;
    const low = t.toLowerCase();
    const isAbbrev =
      /^(mr|mrs|ms|dr|prof|st|jr|sr|inc|ltd|co|corp|dept|ave|no|vs|etc)\.$/.test(low) ||
      /^[a-z]\.$/.test(low);
    if (/[.!?]["')\]]?$/.test(t) && !isAbbrev) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * Khớp chuỗi token transcript với chuỗi token whisper.
 * Trả về mảng cùng độ dài transcript: chỉ số token whisper tương ứng, hoặc -1.
 */
function align(a: string[], b: string[]): number[] {
  const MATCH = 2, MISMATCH = -2, GAP = -1;
  const n = a.length, m = b.length;
  // Ma trận điểm + hướng truy vết, dùng Int8Array cho hướng để nhẹ bộ nhớ
  const score = new Int32Array((n + 1) * (m + 1));
  const trace = new Int8Array((n + 1) * (m + 1)); // 1=diag 2=up(a gap) 3=left(b gap)
  const at = (i: number, j: number) => i * (m + 1) + j;

  for (let i = 1; i <= n; i++) {
    score[at(i, 0)] = i * GAP;
    trace[at(i, 0)] = 2;
  }
  for (let j = 1; j <= m; j++) {
    // Phần đầu của whisper (câu dẫn) được bỏ qua miễn phí
    score[at(0, j)] = 0;
    trace[at(0, j)] = 3;
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = score[at(i - 1, j - 1)] + (a[i - 1] === b[j - 1] ? MATCH : MISMATCH);
      const up = score[at(i - 1, j)] + GAP;
      const left = score[at(i, j - 1)] + GAP;
      let best = diag, dir: number = 1;
      if (up > best) { best = up; dir = 2; }
      if (left > best) { best = left; dir = 3; }
      score[at(i, j)] = best;
      trace[at(i, j)] = dir;
    }
  }

  const map = new Array<number>(n).fill(-1);
  let i = n;
  // Phần đuôi whisper cũng được bỏ qua miễn phí: bắt đầu truy vết từ j tốt nhất
  let j = m;
  let bestTail = score[at(n, m)];
  for (let jj = 0; jj <= m; jj++) {
    if (score[at(n, jj)] > bestTail) { bestTail = score[at(n, jj)]; j = jj; }
  }
  while (i > 0 && j > 0) {
    const dir = trace[at(i, j)];
    if (dir === 1) {
      if (a[i - 1] === b[j - 1]) map[i - 1] = j - 1;
      i--; j--;
    } else if (dir === 2) {
      i--;
    } else {
      j--;
    }
  }
  return map;
}

type TimedWord = { text: string; start: number | null; end: number | null };

export type ChunkOut = {
  text: string;
  start: number;
  end: number;
  /** Khoảng lặng trước chunk này, giây — 0 ở chunk đầu dòng */
  pause: number;
};

type LineOut = { speaker: string | null; text: string; chunks: ChunkOut[] };

function main() {
  const passages: Passage[] = JSON.parse(fs.readFileSync(PASSAGES, "utf-8")).passages;
  const wordsFile: WordsFile = JSON.parse(fs.readFileSync(WORDS, "utf-8"));
  const byId = new Map(passages.map((p) => [p.groupId, p]));

  const out: { passages: unknown[] } = { passages: [] };
  const stats = { chunks: 0, added: 0, unaligned: 0, total: 0 };

  for (const [groupId, wd] of Object.entries(wordsFile)) {
    const p = byId.get(groupId);
    if (!p) throw new Error("passages.json thiếu " + groupId);

    // ── Dàn phẳng transcript thành token để khớp ──────────────────────────
    const flatWords: { word: string; line: number; sent: number; idx: number }[] = [];
    const lineSentences: string[][] = p.lines.map((l) => splitSentences(l.text));
    lineSentences.forEach((sents, li) =>
      sents.forEach((s, si) =>
        s.split(/\s+/).forEach((w, wi) => flatWords.push({ word: w, line: li, sent: si, idx: wi }))
      )
    );

    // Một từ transcript có thể tương ứng nhiều token whisper ("small-town")
    const subTokens: string[] = [];
    const subOwner: number[] = [];
    flatWords.forEach((fw, i) => {
      for (const piece of fw.word.split(/[-–—/]/)) {
        const n = norm(piece);
        if (!n) continue;
        subTokens.push(n);
        subOwner.push(i);
      }
    });

    const whisperTokens = wd.words.map((w) => norm(w.w));
    const map = align(subTokens, whisperTokens);

    const timed: TimedWord[] = flatWords.map((fw) => ({ text: fw.word, start: null, end: null }));
    subTokens.forEach((_, si) => {
      const wi = map[si];
      if (wi < 0) return;
      const owner = subOwner[si];
      const ww = wd.words[wi];
      const t = timed[owner];
      t.start = t.start === null ? ww.start : Math.min(t.start, ww.start);
      t.end = t.end === null ? ww.end : Math.max(t.end, ww.end);
    });

    // Từ không khớp được thì nội suy từ hai bên để vẫn có mốc dùng được
    for (let i = 0; i < timed.length; i++) {
      if (timed[i].start !== null) continue;
      stats.unaligned++;
      let prev = i - 1;
      while (prev >= 0 && timed[prev].end === null) prev--;
      let next = i + 1;
      while (next < timed.length && timed[next].start === null) next++;
      const from = prev >= 0 ? timed[prev].end! : 0;
      const to = next < timed.length ? timed[next].start! : from + 0.3;
      const span = Math.max(to - from, 0.1);
      const gapCount = next - prev;
      const k = i - prev;
      timed[i].start = from + (span * (k - 1)) / gapCount;
      timed[i].end = from + (span * k) / gapCount;
    }
    stats.total += timed.length;

    // ── Cắt chunk từng câu, rồi hiệu chỉnh theo khoảng lặng thật ──────────
    const lines: LineOut[] = [];
    let cursor = 0;
    lineSentences.forEach((sents, li) => {
      const chunks: ChunkOut[] = [];
      for (const sentence of sents) {
        const nWords = sentence.split(/\s+/).length;
        const base = chunkSentence(sentence);
        const offset = cursor;
        cursor += nWords;

        const pauseAt = (local: number) => {
          const prev = timed[offset + local - 1];
          const cur = timed[offset + local];
          if (!prev || !cur) return 0;
          return Math.max(0, +(cur.start! - prev.end!).toFixed(3));
        };

        const cuts = base.boundaries.map((b) => b.at);

        // Thêm ranh giới ở chỗ ngừng rõ mà quy ước ngữ pháp bỏ sót
        for (let local = 1; local < nWords; local++) {
          if (cuts.includes(local)) continue;
          if (pauseAt(local) >= REAL_PAUSE) {
            cuts.push(local);
            stats.added++;
          }
        }
        cuts.sort((x, y) => x - y);

        const edges = [0, ...cuts, nWords];
        for (let k = 0; k < edges.length - 1; k++) {
          const a = offset + edges[k];
          const b = offset + edges[k + 1];
          const slice = timed.slice(a, b);
          const start = +slice[0].start!.toFixed(3);
          const prev = chunks[chunks.length - 1];
          chunks.push({
            text: slice.map((w) => w.text).join(" "),
            start,
            end: +slice[slice.length - 1].end!.toFixed(3),
            // Khoảng lặng thật trước chunk, tính qua cả ranh giới câu
            pause: prev ? Math.max(0, +(start - prev.end).toFixed(3)) : 0,
          });
          stats.chunks++;
        }
      }
      lines.push({ speaker: p.lines[li].speaker, text: p.lines[li].text, chunks });
    });

    out.passages.push({
      groupId,
      part: p.part,
      label: `Đề ${p.testNumber} · Part ${p.part} · câu ${p.questionStart}-${p.questionEnd}`,
      audioUrl: p.audioUrl,
      duration: wd.duration,
      lines,
    });
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1), "utf-8");
  console.log(
    `Wrote ${OUT}\n  ${out.passages.length} đoạn · ${stats.chunks} chunk` +
      `\n  thêm ${stats.added} ranh giới ở chỗ ngừng rõ trong audio` +
      `\n  ${stats.unaligned}/${stats.total} từ phải nội suy mốc`
  );
}

main();
