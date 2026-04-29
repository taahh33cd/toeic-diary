#!/usr/bin/env tsx
/**
 * assign-timestamps.ts
 *
 * 1. Đo audioDuration thực tế của từng file MP3 bằng ffprobe
 * 2. Ước tính startTime/endTime từng câu theo tỉ lệ ký tự
 * 3. Cập nhật DB (lessons.audio_duration + sentences.start_time/end_time)
 *
 * Usage:
 *   tsx scripts/assign-timestamps.ts <testDir>
 *   tsx scripts/assign-timestamps.ts scripts/data/test1
 *
 * ffprobe được tìm tự động ở C:/ffmpeg/bin/ffprobe.exe hoặc trên PATH.
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { ParsedTest } from "./types";

// ─── ffprobe ──────────────────────────────────────────────────────────────────

const FFPROBE_CANDIDATES = [
  "ffprobe",
  "C:/ffmpeg/bin/ffprobe.exe",
  "C:\\ffmpeg\\bin\\ffprobe.exe",
];

function findFfprobe(): string {
  for (const bin of FFPROBE_CANDIDATES) {
    const r = spawnSync(bin, ["-version"], { stdio: "ignore" });
    if (r.status === 0) return bin;
  }
  throw new Error(
    "ffprobe not found. Install ffmpeg and add to PATH, or place at C:/ffmpeg/bin/ffprobe.exe"
  );
}

function getAudioDuration(ffprobe: string, filePath: string): number {
  const r = spawnSync(
    ffprobe,
    ["-i", filePath, "-show_entries", "format=duration", "-v", "quiet", "-of", "csv=p=0"],
    { encoding: "utf8" }
  );
  const val = parseFloat(r.stdout?.trim() ?? "");
  return isNaN(val) ? 0 : val;
}

// ─── Timestamp estimation ─────────────────────────────────────────────────────

/**
 * Phân bổ startTime/endTime cho từng câu dựa trên tỉ lệ số ký tự.
 * Giả định: phần đầu audio có ~0.8s im lặng (intro), cuối ~0.5s.
 */
function estimateTimestamps(
  sentences: { content: string }[],
  audioDuration: number
): { startTime: number; endTime: number }[] {
  if (sentences.length === 0 || audioDuration === 0) {
    return sentences.map(() => ({ startTime: 0, endTime: 0 }));
  }

  const INTRO_PAD = 0.8;  // giây im lặng đầu
  const OUTRO_PAD = 0.5;  // giây im lặng cuối
  const speakingTime = Math.max(audioDuration - INTRO_PAD - OUTRO_PAD, audioDuration * 0.8);

  const charCounts = sentences.map((s) => Math.max(s.content.trim().length, 1));
  const totalChars = charCounts.reduce((a, b) => a + b, 0);

  const result: { startTime: number; endTime: number }[] = [];
  let cumChars = 0;

  for (const chars of charCounts) {
    const startTime = INTRO_PAD + (cumChars / totalChars) * speakingTime;
    cumChars += chars;
    const endTime = INTRO_PAD + (cumChars / totalChars) * speakingTime;
    result.push({
      startTime: Math.round(startTime * 100) / 100,
      endTime: Math.round(endTime * 100) / 100,
    });
  }

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const testDir = process.argv[2];
  if (!testDir) {
    console.error("Usage: tsx scripts/assign-timestamps.ts <testDir>");
    console.error("Example: tsx scripts/assign-timestamps.ts scripts/data/test1");
    process.exit(1);
  }

  const parsedPath = path.join(testDir, "parsed.json");
  if (!fs.existsSync(parsedPath)) {
    console.error(`parsed.json not found: ${parsedPath}`);
    process.exit(1);
  }

  const audioDir = path.join(testDir, "audio");
  const parsed: ParsedTest = JSON.parse(fs.readFileSync(parsedPath, "utf-8"));

  // Find ffprobe
  let ffprobe: string;
  try {
    ffprobe = findFfprobe();
    console.log(`\n⏱  assign-timestamps — ${parsed.testName}`);
    console.log(`   ffprobe : ${ffprobe}\n`);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  // Connect to DB
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  let updated = 0;
  let skipped = 0;

  for (const lesson of parsed.lessons) {
    // Find the audio file on disk
    const audioFile = lesson.audioFiles[0];
    if (!audioFile) { skipped++; continue; }

    const audioPath = path.join(audioDir, audioFile);
    if (!fs.existsSync(audioPath)) {
      console.warn(`  ⚠  Audio not found: ${audioFile}`);
      skipped++;
      continue;
    }

    // Measure actual duration
    const audioDuration = getAudioDuration(ffprobe, audioPath);
    if (audioDuration === 0) {
      console.warn(`  ⚠  Could not read duration: ${audioFile}`);
      skipped++;
      continue;
    }

    // Find lesson in DB
    const dbLesson = await prisma.lesson.findFirst({
      where: { title: lesson.title },
      include: { sentences: { orderBy: { orderIndex: "asc" } } },
    });

    if (!dbLesson) {
      console.warn(`  ⚠  Lesson not in DB: ${lesson.title}`);
      skipped++;
      continue;
    }

    // Calculate timestamps
    const timestamps = estimateTimestamps(
      dbLesson.sentences.map((s) => ({ content: s.content })),
      audioDuration
    );

    // Update lesson audioDuration
    await prisma.lesson.update({
      where: { id: dbLesson.id },
      data: { audioDuration },
    });

    // Update each sentence
    for (let i = 0; i < dbLesson.sentences.length; i++) {
      await prisma.sentence.update({
        where: { id: dbLesson.sentences[i].id },
        data: {
          startTime: timestamps[i].startTime,
          endTime: timestamps[i].endTime,
        },
      });
    }

    console.log(
      `  ✓ ${lesson.title} — ${audioDuration.toFixed(1)}s — ${dbLesson.sentences.length} sentences`
    );
    updated++;
  }

  await prisma.$disconnect();

  console.log(`\n✅  Done!`);
  console.log(`   Updated : ${updated} lessons`);
  console.log(`   Skipped : ${skipped} lessons\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
