#!/usr/bin/env tsx
/**
 * prepare-part2-practice-timestamps.ts
 *
 * Đọc từng bộ câu hỏi Part 2 practice trong DB và sinh ra parsed.json
 * (format chuẩn cho whisperx_timestamps.py) cho từng question type.
 *
 * Usage:
 *   tsx scripts/prepare-part2-practice-timestamps.ts [--data-dir <path>]
 *
 * Defaults:
 *   --data-dir  D:\TOEIC_Part2_Transcripts
 *
 * Output:
 *   scripts/data/part2-practice/<slug>/parsed.json
 *
 * Sau khi chạy script này, chạy whisperx + apply cho từng type:
 *   py -3.11 scripts/whisperx_timestamps.py \
 *     "<DATA_DIR>\<folder>" \
 *     "scripts/data/part2-practice/<slug>/parsed.json"
 *
 *   tsx scripts/apply-whisperx-timestamps.ts \
 *     scripts/data/part2-practice/<slug>
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_DATA_DIR = "D:\\TOEIC_Part2_Transcripts";
const OUTPUT_BASE = path.join("scripts", "data", "part2-practice");

const QUESTION_TYPES: { folder: string; slug: string; label: string }[] = [
  { folder: "Who-What-Which",              slug: "part2-who-what-which", label: "Who – What – Which"               },
  { folder: "Where-When",                  slug: "part2-where-when",     label: "Where – When"                     },
  { folder: "Why-How",                     slug: "part2-why-how",        label: "Why – How"                        },
  { folder: "Yes-No-Lua-chon",             slug: "part2-yes-no",         label: "Yes/No – Lựa chọn"                },
  { folder: "Cau-hoi-duoi-Cau-tran-thuat", slug: "part2-tag-statement",  label: "Câu hỏi đuôi – Câu trần thuật"   },
];

// ─── Args ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let dataDir = DEFAULT_DATA_DIR;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--data-dir" && args[i + 1]) dataDir = args[++i];
  }
  return { dataDir };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { dataDir } = parseArgs();

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  console.log("\n📋  prepare-part2-practice-timestamps");
  console.log(`   Data dir : ${dataDir}`);
  console.log(`   Output   : ${OUTPUT_BASE}\n`);

  fs.mkdirSync(OUTPUT_BASE, { recursive: true });

  const nextSteps: string[] = [];

  for (const qt of QUESTION_TYPES) {
    const lessons = await prisma.lesson.findMany({
      where: { part: { testSet: { slug: qt.slug } } },
      include: { sentences: { orderBy: { orderIndex: "asc" } } },
      orderBy: { orderIndex: "asc" },
    });

    if (lessons.length === 0) {
      console.warn(`  ⚠  No lessons in DB for slug: ${qt.slug}`);
      continue;
    }

    const parsed = {
      testName: qt.label,
      testSlug: qt.slug,
      // orderIndex/examCode/testCode are not used by whisperx/apply scripts but
      // included to satisfy ParsedTest type if needed in future
      orderIndex: 0,
      examCode:  "P2",
      testCode:  qt.slug,
      lessons: lessons.map((lesson) => {
        // Audio filename: Q01.mp3, Q02.mp3 … derived from orderIndex
        const audioFile = `Q${String(lesson.orderIndex).padStart(2, "0")}.mp3`;
        return {
          title:         lesson.title,
          questionStart: lesson.questionStart ?? lesson.orderIndex,
          questionEnd:   lesson.questionEnd   ?? lesson.orderIndex,
          part:          2,
          transcriptFull: lesson.transcriptFull,
          correctOption:  lesson.correctOption,
          explanation:    lesson.explanation ?? "",
          audioFiles:    [audioFile],
          audioUrl:      lesson.audioUrl,
          audioDuration: lesson.audioDuration,
          sentences: lesson.sentences.map((s) => ({
            orderIndex:  s.orderIndex,
            content:     s.content,
            speaker:     s.speaker,
            optionLabel: s.optionLabel,
            startTime:   s.startTime,
            endTime:     s.endTime,
            blanks:      [],
          })),
        };
      }),
    };

    const outDir = path.join(OUTPUT_BASE, qt.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const parsedPath = path.join(outDir, "parsed.json");
    fs.writeFileSync(parsedPath, JSON.stringify(parsed, null, 2), "utf-8");

    const audioDir = path.join(dataDir, qt.folder);
    const audioExists = fs.existsSync(audioDir);

    console.log(`  ✓ ${qt.slug}`);
    console.log(`    Lessons    : ${lessons.length}`);
    console.log(`    parsed.json: ${parsedPath}`);
    console.log(`    Audio dir  : ${audioDir}${audioExists ? "" : "  ⚠  NOT FOUND"}`);
    console.log();

    nextSteps.push(
      `# ${qt.label}\n` +
      `py -3.11 scripts/whisperx_timestamps.py "${audioDir}" "${parsedPath}"\n` +
      `tsx scripts/apply-whisperx-timestamps.ts "${outDir}"`
    );
  }

  await prisma.$disconnect();

  console.log("═".repeat(60));
  console.log("Chạy theo thứ tự (có thể chạy từng type hoặc tất cả):\n");
  console.log(nextSteps.join("\n\n"));
  console.log();
}

main().catch((e) => { console.error(e); process.exit(1); });
