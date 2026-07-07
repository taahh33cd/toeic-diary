#!/usr/bin/env tsx
/**
 * apply-e24-segment-timestamps.ts
 *
 * Nguồn: folder chứa các file JSON timestamp WhisperX (segment-level) theo từng question.
 *   <sourceDir>/{testNum}/transcript_Test_{NN}-{rest}.mp3.json
 *   Mỗi file là mảng segment: [{ "timestamp": [start, end], "text": "..." }]
 *
 * Vì DB tách câu (sentence) mịn hơn segment, ta:
 *   1. Flatten segment → danh sách word, nội suy thời gian tuyến tính trong mỗi segment.
 *   2. Match từng sentence (theo content) vào chuỗi word — logic giống whisperx_timestamps.py.
 *   3. Ghi timestamps.json/test và apply vào DB (sentences.start_time/end_time),
 *      dùng padding -0.25 / +0.4 giống apply-whisperx-timestamps.ts.
 *
 * Usage:
 *   tsx scripts/apply-e24-segment-timestamps.ts "<sourceDir>" [testNums]
 *   tsx scripts/apply-e24-segment-timestamps.ts "D:\Compressed\timestamp 2024-...\timestamp 2024" 1-10
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

interface Segment {
  // WhisperX để end = null cho segment chạy tới hết audio.
  timestamp: [number | null, number | null];
  text: string;
}
interface WordTs {
  word: string;
  start: number;
  end: number;
}
interface SentenceTs {
  orderIndex: number;
  startTime: number;
  endTime: number;
}

const PUNCT = new Set([".", ",", "!", "?", ";", ":", '"', "'", "(", ")", "-"]);

/** Lowercase + strip leading/trailing punctuation (giống normalize_word trong Python). */
function normalizeWord(w: string): string {
  let s = w.toLowerCase().trim();
  let start = 0;
  let end = s.length;
  while (start < end && PUNCT.has(s[start])) start++;
  while (end > start && PUNCT.has(s[end - 1])) end--;
  return s.slice(start, end);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Flatten segments thành word list, nội suy thời gian trong mỗi segment. */
function segmentsToWords(segments: Segment[]): WordTs[] {
  const words: WordTs[] = [];
  for (const seg of segments) {
    if (!seg.timestamp || seg.timestamp.length < 2) continue;
    const [s, e] = seg.timestamp;
    const toks = seg.text.split(/\s+/).map(normalizeWord).filter(Boolean);
    const k = toks.length;
    if (k === 0) continue;
    const span = Math.max(0, e - s);
    for (let i = 0; i < k; i++) {
      words.push({
        word: toks[i],
        start: s + (span * i) / k,
        end: s + (span * (i + 1)) / k,
      });
    }
  }
  return words;
}

/**
 * Match mỗi sentence vào 1 span word (port từ match_sentences_to_words).
 * Pass 2: câu không match được (vd option D bị WhisperX cắt) được lấp bằng cách
 * chia đều khoảng trống giữa câu match trước và câu match sau (câu cuối → audioDuration).
 * Audio thực tế vẫn chứa lời đọc nên window này phát đúng nội dung.
 */
function matchSentences(
  sentences: { orderIndex: number; content: string }[],
  allWords: WordTs[],
  audioDuration: number,
): SentenceTs[] {
  const n = allWords.length;
  interface Raw {
    orderIndex: number;
    start: number;
    end: number;
    matched: boolean;
  }
  const raw: Raw[] = [];
  let wordCursor = 0;

  for (const sent of sentences) {
    const sentWords = sent.content.split(/\s+/).map(normalizeWord).filter(Boolean);

    if (sentWords.length === 0 || wordCursor >= n) {
      raw.push({ orderIndex: sent.orderIndex, start: 0, end: 0, matched: false });
      continue;
    }

    let bestStart = wordCursor;
    let bestScore = -1;
    const searchWindow = Math.min(n, wordCursor + sentWords.length + 30);
    const check = sentWords.slice(0, Math.min(6, sentWords.length));

    for (let start = wordCursor; start < searchWindow; start++) {
      let score = 0;
      for (let j = 0; j < check.length; j++) {
        const idx = start + j;
        if (idx < n) {
          const aw = allWords[idx].word;
          const sw = check[j];
          if (aw === sw) score += 1;
          else if (sw.includes(aw) || aw.includes(sw)) score += 0.5;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestStart = start;
      }
    }

    if (bestScore <= 0) {
      // Không tìm thấy trong transcript → để pass 2 lấp, không advance cursor.
      raw.push({ orderIndex: sent.orderIndex, start: 0, end: 0, matched: false });
      continue;
    }

    const endIdx = Math.min(bestStart + sentWords.length - 1, n - 1);
    raw.push({
      orderIndex: sent.orderIndex,
      start: allWords[bestStart].start,
      end: allWords[endIdx].end,
      matched: true,
    });
    wordCursor = endIdx + 1;
  }

  // Pass 2: lấp các run câu unmatched.
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].matched) continue;
    let j = i;
    while (j < raw.length && !raw[j].matched) j++;
    const runLen = j - i;
    const prevEnd = i > 0 ? raw[i - 1].end : 0;
    const nextStart = j < raw.length ? raw[j].start : audioDuration;
    const span = Math.max(0, nextStart - prevEnd);
    for (let k = 0; k < runLen; k++) {
      raw[i + k].start = prevEnd + (span * k) / runLen;
      raw[i + k].end = prevEnd + (span * (k + 1)) / runLen;
    }
    i = j - 1;
  }

  return raw.map((r) => ({
    orderIndex: r.orderIndex,
    startTime: round2(r.start),
    endTime: round2(r.end),
  }));
}

function parseTestNums(arg: string | undefined): number[] {
  if (!arg) return Array.from({ length: 10 }, (_, i) => i + 1);
  if (arg.includes("-")) {
    const [a, b] = arg.split("-").map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return arg.split(",").map(Number);
}

async function main() {
  const sourceBase = process.argv[2];
  if (!sourceBase) {
    console.error('Usage: tsx scripts/apply-e24-segment-timestamps.ts "<sourceDir>" [testNums]');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set in .env");
    process.exit(1);
  }

  const testNums = parseTestNums(process.argv[3]);
  const dataDir = path.join(__dirname, "data");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  let grandLessons = 0;
  let grandSentences = 0;

  try {
    for (const testNum of testNums) {
      const nn = String(testNum).padStart(2, "0");
      const srcDir = path.join(sourceBase, String(testNum));
      const testDir = path.join(dataDir, `test${testNum}`);
      const parsedPath = path.join(testDir, "parsed.json");

      if (!fs.existsSync(srcDir)) {
        console.warn(`\n⚠  Source folder not found: ${srcDir}`);
        continue;
      }
      if (!fs.existsSync(parsedPath)) {
        console.warn(`\n⚠  parsed.json not found: ${parsedPath}`);
        continue;
      }

      const parsed = JSON.parse(fs.readFileSync(parsedPath, "utf-8").replace(/^﻿/, ""));
      const testSlug: string = parsed.testSlug;
      console.log(`\n⏱  Test ${testNum} — ${parsed.testName} (${testSlug})`);

      const timestampsOut: Record<string, { audioDuration: number; sentences: SentenceTs[] }> = {};

      // ── Build timestamps từ segment files ─────────────────────────────
      for (const lesson of parsed.lessons) {
        const af: string | undefined = lesson.audioFiles?.[0];
        if (!af) continue;
        const rest = af.replace(/^E24-T/, ""); // vd "02-01.mp3" hoặc "02-32-34.mp3"

        // Nguồn có 2 kiểu đặt tên cho câu đơn: "-01" (zero-pad) và "-1" (không pad)
        const candidates = [`transcript_Test_${rest}.json`];
        const noPad = rest.replace(/-0(\d)\.mp3$/, "-$1.mp3");
        if (noPad !== rest) candidates.push(`transcript_Test_${noPad}.json`);

        const srcFile = candidates
          .map((c) => path.join(srcDir, c))
          .find((p) => fs.existsSync(p));
        if (!srcFile) {
          console.warn(`  ⚠  ${lesson.title}: timestamp file not found (${candidates.join(" | ")})`);
          continue;
        }

        const segments: Segment[] = JSON.parse(
          fs.readFileSync(srcFile, "utf-8").replace(/^﻿/, ""),
        );

        // audioDuration: ưu tiên giá trị ffprobe trong parsed.json; fallback về end
        // hợp lệ cuối cùng của segment (bỏ qua null của segment chạy tới hết audio).
        const lastValidEnd = [...segments]
          .reverse()
          .map((s) => s.timestamp?.[1])
          .find((e) => typeof e === "number");
        const audioDuration: number = lesson.audioDuration ?? lastValidEnd ?? 0;

        // WhisperX để end = null cho segment cuối → thay bằng audioDuration.
        for (const seg of segments) {
          if (seg.timestamp) {
            if (typeof seg.timestamp[0] !== "number") seg.timestamp[0] = 0;
            if (typeof seg.timestamp[1] !== "number") seg.timestamp[1] = audioDuration;
          }
        }

        const words = segmentsToWords(segments);
        const sentences = (lesson.sentences ?? []).map((s: any) => ({
          orderIndex: s.orderIndex,
          content: s.content ?? "",
        }));
        const sentenceTs = matchSentences(sentences, words, audioDuration);

        timestampsOut[lesson.title] = { audioDuration, sentences: sentenceTs };
      }

      // Ghi timestamps.json để lưu vết
      fs.writeFileSync(
        path.join(testDir, "timestamps.json"),
        JSON.stringify(timestampsOut, null, 2),
        "utf-8",
      );

      // ── Apply vào DB ──────────────────────────────────────────────────
      let lessonsUpdated = 0;
      let sentencesUpdated = 0;

      for (const [lessonTitle, data] of Object.entries(timestampsOut)) {
        const dbLesson = await prisma.lesson.findFirst({
          where: { title: lessonTitle, part: { testSet: { slug: testSlug } } },
          include: { sentences: { orderBy: { orderIndex: "asc" } } },
        });
        if (!dbLesson) {
          console.warn(`  ⚠  Lesson not in DB: ${lessonTitle}`);
          continue;
        }

        await prisma.lesson.update({
          where: { id: dbLesson.id },
          data: { audioDuration: data.audioDuration },
        });

        const tsMap = new Map<number, SentenceTs>();
        for (const ts of data.sentences) tsMap.set(ts.orderIndex, ts);

        for (const sentence of dbLesson.sentences) {
          const ts = tsMap.get(sentence.orderIndex);
          if (!ts) continue;
          if (ts.startTime === 0 && ts.endTime === 0) continue; // giữ giá trị cũ
          await prisma.sentence.update({
            where: { id: sentence.id },
            data: {
              startTime: Math.max(0, ts.startTime - 0.25),
              endTime: ts.endTime + 0.4,
            },
          });
          sentencesUpdated++;
        }
        lessonsUpdated++;
      }

      console.log(`  → Lessons: ${lessonsUpdated}  Sentences: ${sentencesUpdated}`);
      grandLessons += lessonsUpdated;
      grandSentences += sentencesUpdated;
    }

    console.log(`\n✅  Done! Lessons: ${grandLessons}  Sentences: ${grandSentences}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
