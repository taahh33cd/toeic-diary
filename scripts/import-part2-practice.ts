#!/usr/bin/env tsx
/**
 * Upload Part 2 practice audio to Supabase Storage and import transcripts into the database.
 *
 * Data source: D:\TOEIC_Part2_Transcripts\{TypeFolder}\Q01.txt + Q01.mp3
 *
 * DB structure created:
 *   TestSeries  "TOEIC Part 2 — Luyện tập cơ bản"  (slug: part2-practice)
 *     └── TestSet  per question type (e.g. "Who - What - Which")
 *           └── Part  partNumber=2
 *                 └── Lesson  per question (Q01–Q30)
 *                       └── Sentence × 4  (question + options A/B/C)
 *
 * Idempotent: safe to re-run; uses upsert on slugs.
 *
 * Usage:
 *   tsx scripts/import-part2-practice.ts [--skip-upload]
 *
 * Prerequisites:
 *   DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 *   ffprobe on PATH (optional — for audio duration)
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_DIR      = "D:\\TOEIC_Part2_Transcripts";
const STORAGE_BUCKET = "audio";
const SKIP_UPLOAD   = process.argv.includes("--skip-upload");

const QUESTION_TYPES: { folder: string; label: string; slug: string }[] = [
  { folder: "Who-What-Which",             label: "Who – What – Which",          slug: "part2-who-what-which"  },
  { folder: "Where-When",                 label: "Where – When",                slug: "part2-where-when"      },
  { folder: "Why-How",                    label: "Why – How",                   slug: "part2-why-how"         },
  { folder: "Yes-No-Lua-chon",            label: "Yes/No – Lựa chọn",           slug: "part2-yes-no"          },
  { folder: "Cau-hoi-duoi-Cau-tran-thuat", label: "Câu hỏi đuôi – Câu trần thuật", slug: "part2-tag-statement" },
];

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

// ─── Transcript parser ────────────────────────────────────────────────────────

interface QuestionData {
  questionText: string;
  optA: string;
  optB: string;
  optC: string;
  answer: string; // "A" | "B" | "C"
}

function parseTxt(filePath: string): QuestionData | null {
  const lines = fs.readFileSync(filePath, "utf-8").trim().split(/\r?\n/);
  // Expected: question, (A) ..., (B) ..., (C) ..., Answer: X
  const questionText = lines[0]?.trim() ?? "";
  const optA = lines[1]?.replace(/^\(A\)\s*/, "").trim() ?? "";
  const optB = lines[2]?.replace(/^\(B\)\s*/, "").trim() ?? "";
  const optC = lines[3]?.replace(/^\(C\)\s*/, "").trim() ?? "";
  const answerLine = lines[4]?.trim() ?? "";
  const answer = answerLine.replace(/^Answer:\s*/, "").trim().toUpperCase();
  if (!questionText || !optA || !optB || !optC || !["A", "B", "C"].includes(answer)) {
    console.warn(`  ⚠  Parse failed: ${filePath}`);
    return null;
  }
  return { questionText, optA, optB, optC, answer };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const prisma = createPrisma();

  // Ensure bucket exists
  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {});

  console.log("\n🎧  Import Part 2 Practice Content");
  console.log(`   Data dir   : ${DATA_DIR}`);
  console.log(`   Upload     : ${SKIP_UPLOAD ? "SKIPPED (--skip-upload)" : "enabled"}`);
  console.log(`   DB         : ${process.env.DATABASE_URL?.split("@")[1] ?? "?"}\n`);

  // ── Upsert TestSeries ──────────────────────────────────────────────────────
  const series = await prisma.testSeries.upsert({
    where:  { slug: "part2-practice" },
    update: { name: "TOEIC Part 2 — Luyện tập cơ bản" },
    create: {
      name:        "TOEIC Part 2 — Luyện tập cơ bản",
      slug:        "part2-practice",
      publisher:   "Practice",
      year:        2024,
      description: "Bộ câu hỏi luyện tập Part 2 phân loại theo dạng câu hỏi.",
      icon:        "💬",
      color:       "from-amber-500 to-orange-600",
      orderIndex:  999,
    },
  });

  let totalUploaded = 0;
  let totalImported = 0;

  for (let typeIdx = 0; typeIdx < QUESTION_TYPES.length; typeIdx++) {
    const qt = QUESTION_TYPES[typeIdx];
    const typeDir = path.join(DATA_DIR, qt.folder);

    if (!fs.existsSync(typeDir)) {
      console.warn(`  ⚠  Folder not found: ${typeDir}`);
      continue;
    }

    console.log(`\n  📂  ${qt.label}`);

    // ── Upsert TestSet ───────────────────────────────────────────────────────
    const testSet = await prisma.testSet.upsert({
      where:  { slug: qt.slug },
      update: { name: qt.label },
      create: {
        seriesId:   series.id,
        name:       qt.label,
        slug:       qt.slug,
        year:       2024,
        orderIndex: typeIdx + 1,
      },
    });

    // ── Upsert Part ──────────────────────────────────────────────────────────
    const part = await prisma.part.upsert({
      where:  { testSetId_partNumber: { testSetId: testSet.id, partNumber: 2 } },
      update: { totalLessons: 30 },
      create: {
        testSetId:    testSet.id,
        partNumber:   2,
        title:        "Part 2 — Question-Response",
        description:  "Nghe câu hỏi và chọn đáp án phù hợp nhất trong 3 lựa chọn.",
        totalLessons: 30,
      },
    });

    // ── Process each question ────────────────────────────────────────────────
    const txtFiles = fs
      .readdirSync(typeDir)
      .filter((f) => f.match(/^Q\d+\.txt$/))
      .sort();

    for (const txtFile of txtFiles) {
      const qNum = parseInt(txtFile.replace(/[^\d]/g, ""), 10);
      const txtPath = path.join(typeDir, txtFile);
      const mp3File = txtFile.replace(".txt", ".mp3");
      const mp3Path = path.join(typeDir, mp3File);

      const q = parseTxt(txtPath);
      if (!q) continue;

      process.stdout.write(`    Q${String(qNum).padStart(2, "0")}  ${q.questionText.slice(0, 50)}… `);

      // Upload audio
      let audioUrl = "";
      let audioDuration = 0;

      if (!SKIP_UPLOAD && fs.existsSync(mp3Path)) {
        const storagePath = `practice/part2/${qt.folder}/Q${String(qNum).padStart(2, "0")}.mp3`;
        try {
          audioUrl      = await uploadAudio(mp3Path, storagePath);
          audioDuration = getAudioDuration(mp3Path);
          totalUploaded++;
        } catch (err) {
          console.log(`\n    ✗ Upload error: ${(err as Error).message}`);
        }
      }

      const transcriptFull = `${q.questionText}\n(A) ${q.optA}\n(B) ${q.optB}\n(C) ${q.optC}`;

      // ── Upsert Lesson ──────────────────────────────────────────────────────
      // Use a deterministic "slug-like" unique key via title + orderIndex
      const existingLesson = await prisma.lesson.findFirst({
        where: { partId: part.id, orderIndex: qNum },
      });

      const lessonData = {
        partId:        part.id,
        title:         `Question ${qNum}`,
        questionStart: qNum,
        questionEnd:   qNum,
        transcriptFull,
        audioUrl:      audioUrl || existingLesson?.audioUrl || "",
        audioDuration: audioDuration || existingLesson?.audioDuration || 0,
        orderIndex:    qNum,
        correctOption: q.answer,
        explanation:   "",
      };

      const lesson = existingLesson
        ? await prisma.lesson.update({ where: { id: existingLesson.id }, data: lessonData })
        : await prisma.lesson.create({ data: lessonData });

      // ── Upsert Sentences ───────────────────────────────────────────────────
      // Delete existing sentences first (clean upsert)
      await prisma.sentence.deleteMany({ where: { lessonId: lesson.id } });

      const sentences: {
        lessonId: string;
        orderIndex: number;
        content: string;
        startTime: number;
        endTime: number;
        speaker: null;
        optionLabel: string | null;
      }[] = [
        { lessonId: lesson.id, orderIndex: 0, content: q.questionText, startTime: 0, endTime: 0, speaker: null, optionLabel: null },
        { lessonId: lesson.id, orderIndex: 1, content: q.optA,         startTime: 0, endTime: 0, speaker: null, optionLabel: "A" },
        { lessonId: lesson.id, orderIndex: 2, content: q.optB,         startTime: 0, endTime: 0, speaker: null, optionLabel: "B" },
        { lessonId: lesson.id, orderIndex: 3, content: q.optC,         startTime: 0, endTime: 0, speaker: null, optionLabel: "C" },
      ];

      await prisma.sentence.createMany({ data: sentences });

      totalImported++;
      console.log(`✓`);
    }
  }

  await prisma.$disconnect();

  console.log(`\n✅  Done!`);
  console.log(`   Uploaded : ${totalUploaded} audio files`);
  console.log(`   Imported : ${totalImported} questions\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
