#!/usr/bin/env tsx
/**
 * Import parsed content into the database.
 * Reads scripts/data/testN/parsed.json → creates TestSet, Part, Lesson, Sentence, Blank records.
 *
 * Usage:
 *   tsx scripts/import-content.ts <testDir>
 *   tsx scripts/import-content.ts scripts/data/test1
 *
 * Idempotent: re-running will UPDATE existing records (upsert by slug / unique keys).
 *
 * Prerequisites:
 *   - DATABASE_URL set in .env
 *   - parsed.json present (run parse-transcripts.ts first)
 *   - audioUrl filled (run upload-audio.ts first, or leave empty to fill later)
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { LessonDef, ParsedTest, SentenceDef } from "./types";
import { getPart2Explanation } from "../lib/ai/gemini";

// ─── Prisma ───────────────────────────────────────────────────────────────────

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// ─── Part metadata ────────────────────────────────────────────────────────────

const PART_META: Record<number, { title: string; description: string }> = {
  1: {
    title: "Part 1 — Photographs",
    description: "Select the statement that best describes a photograph.",
  },
  2: {
    title: "Part 2 — Question-Response",
    description: "Select the best response to a question or statement.",
  },
  3: {
    title: "Part 3 — Conversations",
    description: "Short conversations between two or three people.",
  },
  4: {
    title: "Part 4 — Talks",
    description: "Short talks by a single speaker.",
  },
};

// ─── Import helpers ───────────────────────────────────────────────────────────

async function upsertTestSet(
  prisma: PrismaClient,
  parsed: ParsedTest,
): Promise<string> {
  const existing = await prisma.testSet.findUnique({ where: { slug: parsed.testSlug } });

  if (existing) {
    await prisma.testSet.update({
      where: { slug: parsed.testSlug },
      data: { name: parsed.testName, orderIndex: parsed.orderIndex },
    });
    console.log(`  ✓ TestSet updated: ${parsed.testName}`);
    return existing.id;
  }

  // Find or create the EST 2026 series (default series for existing import pipeline)
  let series = await prisma.testSeries.findUnique({ where: { slug: "ets-2026" } });
  if (!series) {
    series = await prisma.testSeries.create({
      data: {
        name: "EST 2026",
        slug: "ets-2026",
        publisher: "EST",
        year: 2026,
        description: "Bộ đề TOEIC EST 2026 — 10 đề thi thử chuẩn format",
        color: "from-indigo-500 to-purple-600",
        icon: "📘",
        orderIndex: 1,
      },
    });
  }

  const created = await prisma.testSet.create({
    data: {
      name: parsed.testName,
      slug: parsed.testSlug,
      year: 2026,
      orderIndex: parsed.orderIndex,
      seriesId: series.id,
    },
  });
  console.log(`  ✓ TestSet created: ${parsed.testName}`);
  return created.id;
}

async function upsertPart(
  prisma: PrismaClient,
  testSetId: string,
  partNumber: 1 | 2 | 3 | 4,
  totalLessons: number,
): Promise<string> {
  const meta = PART_META[partNumber];

  const existing = await prisma.part.findUnique({
    where: { testSetId_partNumber: { testSetId, partNumber } },
  });

  if (existing) {
    await prisma.part.update({
      where: { id: existing.id },
      data: { totalLessons },
    });
    return existing.id;
  }

  const created = await prisma.part.create({
    data: {
      testSetId,
      partNumber,
      title: meta.title,
      description: meta.description,
      totalLessons,
    },
  });
  return created.id;
}

async function upsertLesson(
  prisma: PrismaClient,
  partId: string,
  lesson: LessonDef,
  orderIndex: number,
): Promise<string> {
  const existing = await prisma.lesson.findFirst({
    where: { partId, questionStart: lesson.questionStart },
  });

  // Preserve existing audioUrl/audioDuration if re-importing without audio
  const audioUrl = lesson.audioUrl && lesson.audioUrl !== "pending"
    ? lesson.audioUrl
    : (existing?.audioUrl && existing.audioUrl !== "pending" ? existing.audioUrl : "pending");
  const audioDuration = lesson.audioDuration > 0
    ? lesson.audioDuration
    : (existing?.audioDuration ?? 0);

  // For Part 2: generate AI explanation if not already present
  let explanation = lesson.explanation ?? "";
  if (lesson.part === 2 && lesson.correctOption && !explanation) {
    if (existing?.explanation) {
      explanation = existing.explanation; // preserve existing
    } else {
      try {
        const optionSentences = lesson.sentences.filter((s) => s.optionLabel);
        const options = optionSentences.map((s) => ({
          label: s.optionLabel!,
          text: s.content,
        }));
        const questionSentence = lesson.sentences.find((s) => !s.optionLabel);
        if (questionSentence && options.length > 0) {
          explanation = await getPart2Explanation(
            questionSentence.content,
            options,
            lesson.correctOption
          );
          console.log(`      [AI] explanation generated for Q${lesson.questionStart}`);
        }
      } catch (e) {
        console.warn(`      [AI] explanation failed for Q${lesson.questionStart}: ${(e as Error).message}`);
      }
    }
  }

  const data = {
    partId,
    title: lesson.title,
    questionStart: lesson.questionStart,
    questionEnd: lesson.questionEnd,
    transcriptFull: lesson.transcriptFull,
    audioUrl,
    audioDuration,
    orderIndex,
    correctOption: lesson.correctOption ?? null,
    explanation: explanation || null,
  };

  if (existing) {
    await prisma.lesson.update({ where: { id: existing.id }, data });
    return existing.id;
  }

  const created = await prisma.lesson.create({ data });
  return created.id;
}

async function importSentencesAndBlanks(
  prisma: PrismaClient,
  lessonId: string,
  sentences: SentenceDef[],
): Promise<{ sentenceCount: number; blankCount: number }> {
  // Preserve existing timestamps before deleting
  const existingTs = await prisma.sentence.findMany({
    where: { lessonId },
    select: { orderIndex: true, startTime: true, endTime: true },
  });
  const tsMap = new Map(existingTs.map((s) => [s.orderIndex, { startTime: s.startTime, endTime: s.endTime }]));

  await prisma.sentence.deleteMany({ where: { lessonId } });

  let blankCount = 0;

  for (const s of sentences) {
    const existing = tsMap.get(s.orderIndex);
    const startTime = s.startTime > 0 ? s.startTime : (existing?.startTime ?? 0);
    const endTime = s.endTime > 0 ? s.endTime : (existing?.endTime ?? 0);
    const sentence = await prisma.sentence.create({
      data: {
        lessonId,
        orderIndex: s.orderIndex,
        content: s.content,
        startTime,
        endTime,
        speaker: s.speaker,
        optionLabel: s.optionLabel ?? null,
      },
    });

    if (s.blanks.length > 0) {
      await prisma.blank.createMany({
        data: s.blanks.map((b) => ({
          sentenceId: sentence.id,
          lessonId,
          answer: b.answer,
          position: b.position,
          hint: b.hint,
        })),
      });
      blankCount += s.blanks.length;
    }
  }

  return { sentenceCount: sentences.length, blankCount };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const testDir = process.argv[2];

  if (!testDir) {
    console.error("Usage: tsx scripts/import-content.ts <testDir>");
    console.error("Example: tsx scripts/import-content.ts scripts/data/test1");
    process.exit(1);
  }

  const parsedPath = path.join(testDir, "parsed.json");
  if (!fs.existsSync(parsedPath)) {
    console.error(`parsed.json not found: ${parsedPath}`);
    console.error("Run parse-transcripts.ts first.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set in .env");
    process.exit(1);
  }

  const parsed: ParsedTest = JSON.parse(fs.readFileSync(parsedPath, "utf-8"));
  const prisma = createPrisma();

  console.log(`\n📦  Importing ${parsed.testName} into database\n`);

  try {
    // 1. TestSet
    const testSetId = await upsertTestSet(prisma, parsed);

    // 2. Group lessons by part
    const partGroups: Array<{ partNumber: 1 | 2 | 3 | 4; lessons: LessonDef[] }> = [];
    for (const p of [1, 2, 3, 4] as const) {
      const lessons = parsed.lessons.filter((l) => l.part === p);
      if (lessons.length > 0) partGroups.push({ partNumber: p, lessons });
    }

    let totalLessons = 0;
    let totalSentences = 0;
    let totalBlanks = 0;

    for (const { partNumber, lessons } of partGroups) {
      const partId = await upsertPart(prisma, testSetId, partNumber, lessons.length);
      console.log(`\n  Part ${partNumber} (${lessons.length} lessons) -> partId: ${partId}`);

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const lessonId = await upsertLesson(prisma, partId, lesson, i);

        const { sentenceCount, blankCount } = await importSentencesAndBlanks(
          prisma,
          lessonId,
          lesson.sentences,
        );

        totalLessons++;
        totalSentences += sentenceCount;
        totalBlanks += blankCount;

        const audioStatus = lesson.audioUrl && lesson.audioUrl !== "pending"
          ? `${lesson.audioDuration.toFixed(1)}s`
          : "audio pending";

        const answerStr = lesson.correctOption ? ` ans:${lesson.correctOption}` : "";
        console.log(
          `    ok ${lesson.title} -- ${sentenceCount} sentences, ${blankCount} blanks  ${audioStatus}${answerStr}`,
        );
      }
    }

    console.log(`\n✅  Import complete!`);
    console.log(`    Lessons   : ${totalLessons}`);
    console.log(`    Sentences : ${totalSentences}`);
    console.log(`    Blanks    : ${totalBlanks}`);

    if (parsed.lessons.some((l) => !l.audioUrl || l.audioUrl === "pending")) {
      console.log(
        `\n⚠  Some lessons have no audio URL.\n` +
        `   Run "npm run upload-audio scripts/data/testN" then re-import to fill them in.\n`,
      );
    } else {
      console.log();
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
