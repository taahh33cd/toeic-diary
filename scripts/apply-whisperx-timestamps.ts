#!/usr/bin/env tsx
/**
 * apply-whisperx-timestamps.ts
 *
 * Đọc file timestamps.json (output của whisperx_timestamps.py)
 * và cập nhật DB: lessons.audio_duration + sentences.start_time/end_time
 *
 * Usage:
 *   tsx scripts/apply-whisperx-timestamps.ts <testDir>
 *   tsx scripts/apply-whisperx-timestamps.ts scripts/data/test1
 *
 * Prerequisites:
 *   - timestamps.json phải tồn tại trong testDir (chạy whisperx_timestamps.py trước)
 *   - DATABASE_URL set trong .env
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

interface SentenceTimestamp {
  orderIndex: number;
  startTime: number;
  endTime: number;
}

interface LessonTimestamps {
  audioDuration: number;
  sentences: SentenceTimestamp[];
}

type TimestampsFile = Record<string, LessonTimestamps>;

async function main() {
  const testDir = process.argv[2];
  if (!testDir) {
    console.error("Usage: tsx scripts/apply-whisperx-timestamps.ts <testDir>");
    console.error("Example: tsx scripts/apply-whisperx-timestamps.ts scripts/data/test1");
    process.exit(1);
  }

  const timestampsPath = path.join(testDir, "timestamps.json");
  if (!fs.existsSync(timestampsPath)) {
    console.error(`timestamps.json not found: ${timestampsPath}`);
    console.error("Run whisperx_timestamps.py first:");
    console.error(`  py -3.11 scripts/whisperx_timestamps.py ${testDir}/audio ${testDir}/parsed.json`);
    process.exit(1);
  }

  const timestamps: TimestampsFile = JSON.parse(fs.readFileSync(timestampsPath, "utf-8"));
  const lessonTitles = Object.keys(timestamps);

  if (lessonTitles.length === 0) {
    console.error("timestamps.json is empty");
    process.exit(1);
  }

  // Read testSlug from parsed.json to scope DB queries to the correct test
  const parsedPath = path.join(testDir, "parsed.json");
  if (!fs.existsSync(parsedPath)) {
    console.error(`parsed.json not found: ${parsedPath}`);
    process.exit(1);
  }
  const { testSlug } = JSON.parse(fs.readFileSync(parsedPath, "utf-8")) as { testSlug: string };

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  console.log(`\n⏱  apply-whisperx-timestamps`);
  console.log(`   Source: ${timestampsPath}`);
  console.log(`   Test  : ${testSlug}`);
  console.log(`   Lessons in file: ${lessonTitles.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const [lessonTitle, data] of Object.entries(timestamps)) {
    // Find lesson in DB by title scoped to the correct test
    const dbLesson = await prisma.lesson.findFirst({
      where: { title: lessonTitle, part: { testSet: { slug: testSlug } } },
      include: { sentences: { orderBy: { orderIndex: "asc" } } },
    });

    if (!dbLesson) {
      console.warn(`  ⚠  Lesson not in DB: ${lessonTitle}`);
      skipped++;
      continue;
    }

    // Update lesson audioDuration
    await prisma.lesson.update({
      where: { id: dbLesson.id },
      data: { audioDuration: data.audioDuration },
    });

    // Build a map: orderIndex → { startTime, endTime }
    const tsMap = new Map<number, { startTime: number; endTime: number }>();
    for (const ts of data.sentences) {
      tsMap.set(ts.orderIndex, { startTime: ts.startTime, endTime: ts.endTime });
    }

    // Update each sentence
    let sentenceUpdated = 0;
    let sentenceMissed = 0;

    for (const sentence of dbLesson.sentences) {
      const ts = tsMap.get(sentence.orderIndex);
      if (!ts) {
        sentenceMissed++;
        continue;
      }
      if (ts.startTime === 0 && ts.endTime === 0) {
        sentenceMissed++;
        continue;
      }
      await prisma.sentence.update({
        where: { id: sentence.id },
        data: {
          startTime: ts.startTime,
          endTime: ts.endTime,
        },
      });
      sentenceUpdated++;
    }

    const duration = data.audioDuration.toFixed(1);
    console.log(
      `  ✓ ${lessonTitle} — ${duration}s — ${sentenceUpdated}/${dbLesson.sentences.length} sentences updated` +
      (sentenceMissed > 0 ? ` (${sentenceMissed} missed)` : "")
    );
    updated++;
  }

  await prisma.$disconnect();

  console.log(`\n✅  Done!`);
  console.log(`   Updated : ${updated} lessons`);
  console.log(`   Skipped : ${skipped} lessons\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
