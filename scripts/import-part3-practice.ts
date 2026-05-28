#!/usr/bin/env tsx
/**
 * Upload Part 3 practice audio to Supabase Storage and import transcripts into the database.
 *
 * Source: D:\Compressed\part 3-20260528T141919Z-3-001\part 3\
 *   Files: 1.mp3 … 15.mp3,  audio1.json … audio15.json
 *
 * DB structure created:
 *   TestSeries  "TOEIC Part 3 — Luyện tập hội thoại"  (slug: part3-practice)
 *     ├── TestSet  "Luyện tập cơ bản"   (audio1–10,  slug: part3-basic)
 *     │     └── Part  partNumber=3
 *     │           └── Lesson × 10  → Sentence × N (with timestamps)
 *     └── TestSet  "Luyện tập nâng cao" (audio11–15, slug: part3-advanced)
 *           └── Part  partNumber=3
 *                 └── Lesson × 5   → Sentence × N (with timestamps)
 *
 * Idempotent: safe to re-run; uses upsert on slugs / unique keys.
 *
 * Usage:
 *   tsx scripts/import-part3-practice.ts [--skip-upload]
 *
 * Prerequisites:
 *   DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_DIR       = "D:\\Compressed\\part 3-20260528T141919Z-3-001\\part 3";
const STORAGE_BUCKET = "audio";
const SKIP_UPLOAD    = process.argv.includes("--skip-upload");

interface SetConfig {
  name:       string;
  slug:       string;
  range:      [number, number]; // inclusive audio indices
  orderIndex: number;
}

const TEST_SETS: SetConfig[] = [
  { name: "Luyện tập cơ bản",   slug: "part3-basic",    range: [1, 10],  orderIndex: 1 },
  { name: "Luyện tập nâng cao", slug: "part3-advanced", range: [11, 15], orderIndex: 2 },
];

// ─── JSON types ───────────────────────────────────────────────────────────────

interface TranscriptLine {
  line_id:    number;
  speaker:    string;
  start_time: number;
  end_time:   number;
  text:       string;
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Prisma ───────────────────────────────────────────────────────────────────

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

function getAudioDuration(filePath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return parseFloat(out) || 0;
  } catch {
    return 0;
  }
}

async function uploadAudio(localPath: string, storagePath: string): Promise<string> {
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: "audio/mpeg", upsert: true });
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = createPrisma();

  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  console.log("\n🎧  Import Part 3 Practice Content");
  console.log(`   Data dir : ${DATA_DIR}`);
  console.log(`   Upload   : ${SKIP_UPLOAD ? "SKIPPED (--skip-upload)" : "enabled"}`);
  console.log(`   DB       : ${process.env.DATABASE_URL?.split("@")[1] ?? "?"}\n`);

  // ── Upsert TestSeries ──────────────────────────────────────────────────────
  const series = await prisma.testSeries.upsert({
    where:  { slug: "part3-practice" },
    update: { name: "TOEIC Part 3 — Luyện tập hội thoại" },
    create: {
      name:        "TOEIC Part 3 — Luyện tập hội thoại",
      slug:        "part3-practice",
      publisher:   "Practice",
      year:        2024,
      description: "Bộ hội thoại luyện nghe Part 3 theo 4 cấp độ dictation.",
      icon:        "🗣️",
      color:       "from-indigo-500 to-violet-600",
      orderIndex:  3,
    },
  });

  let totalUploaded = 0;
  let totalImported = 0;

  for (const setConf of TEST_SETS) {
    console.log(`\n  📂  ${setConf.name}  (audio${setConf.range[0]}–${setConf.range[1]})`);

    // ── Upsert TestSet ───────────────────────────────────────────────────────
    const testSet = await prisma.testSet.upsert({
      where:  { slug: setConf.slug },
      update: { name: setConf.name },
      create: {
        seriesId:   series.id,
        name:       setConf.name,
        slug:       setConf.slug,
        year:       2024,
        orderIndex: setConf.orderIndex,
      },
    });

    // ── Upsert Part ──────────────────────────────────────────────────────────
    const rangeLen = setConf.range[1] - setConf.range[0] + 1;
    const part = await prisma.part.upsert({
      where:  { testSetId_partNumber: { testSetId: testSet.id, partNumber: 3 } },
      update: { totalLessons: rangeLen },
      create: {
        testSetId:    testSet.id,
        partNumber:   3,
        title:        "Part 3 — Conversations",
        description:  "Nghe hội thoại và luyện dictation theo 4 cấp độ.",
        totalLessons: rangeLen,
      },
    });

    // ── Process each conversation ────────────────────────────────────────────
    for (let idx = setConf.range[0]; idx <= setConf.range[1]; idx++) {
      const jsonPath = path.join(DATA_DIR, `audio${idx}.json`);
      const mp3Path  = path.join(DATA_DIR, `${idx}.mp3`);

      if (!fs.existsSync(jsonPath)) {
        console.warn(`  ⚠  Missing: ${jsonPath}`);
        continue;
      }

      const lines: TranscriptLine[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const transcriptFull = lines.map((l) => `[${l.speaker}] ${l.text}`).join("\n");

      process.stdout.write(`    audio${idx}  ${lines[0]?.text.slice(0, 50)}… `);

      // Upload audio
      let audioUrl      = "";
      let audioDuration = 0;

      if (!SKIP_UPLOAD && fs.existsSync(mp3Path)) {
        const storagePath = `practice/part3/${setConf.slug}/${idx}.mp3`;
        try {
          audioUrl      = await uploadAudio(mp3Path, storagePath);
          audioDuration = getAudioDuration(mp3Path);
          totalUploaded++;
        } catch (err) {
          console.log(`\n    ✗ Upload error: ${(err as Error).message}`);
        }
      }

      // Lesson orderIndex = idx so it stays globally sortable across sets
      const existingLesson = await prisma.lesson.findFirst({
        where: { partId: part.id, orderIndex: idx },
      });

      const lessonData = {
        partId:        part.id,
        title:         `Conversation ${idx}`,
        questionStart: idx,
        questionEnd:   idx,
        transcriptFull,
        audioUrl:      audioUrl || existingLesson?.audioUrl || "",
        audioDuration: audioDuration || existingLesson?.audioDuration || 0,
        orderIndex:    idx,
        correctOption: null,
        explanation:   "",
      };

      const lesson = existingLesson
        ? await prisma.lesson.update({ where: { id: existingLesson.id }, data: lessonData })
        : await prisma.lesson.create({ data: lessonData });

      // ── Upsert Sentences ───────────────────────────────────────────────────
      await prisma.sentence.deleteMany({ where: { lessonId: lesson.id } });

      await prisma.sentence.createMany({
        data: lines.map((line) => ({
          lessonId:   lesson.id,
          orderIndex: line.line_id - 1,
          content:    line.text,
          startTime:  line.start_time,
          endTime:    line.end_time,
          speaker:    line.speaker,
          optionLabel: null,
        })),
      });

      totalImported++;
      console.log(`✓  (${lines.length} lines)`);
    }
  }

  await prisma.$disconnect();

  console.log(`\n✅  Done!`);
  console.log(`   Uploaded : ${totalUploaded} audio files`);
  console.log(`   Imported : ${totalImported} conversations\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
