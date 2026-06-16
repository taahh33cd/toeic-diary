#!/usr/bin/env tsx
/**
 * Import pre-written keywords into lesson.keyVocabulary for ETS 2026.
 * Handles both .txt and .json file extensions.
 *
 * Usage:
 *   # Single test
 *   tsx scripts/import-ets2026-vocab.ts "D:\transcript 2026" ets-2026-test-1
 *
 *   # All tests
 *   tsx scripts/import-ets2026-vocab.ts "D:\transcript 2026"
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

function testCodeToSlug(testCode: string): string {
  const num = parseInt(testCode.slice(1), 10);
  return `ets-2026-test-${num}`;
}

interface VocabItem {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

function toVocabItem(kw: Record<string, string>): VocabItem {
  return {
    word: kw.word ?? "",
    ipa: kw.pronunciation ?? "",
    partOfSpeech: kw.pos ?? "",
    meaning: kw.meaning ?? "",
    example: "",
  };
}

async function importTestFolder(
  prisma: PrismaClient,
  folderPath: string,
  testSlug: string,
): Promise<{ updated: number; skipped: number; notFound: number }> {
  const files = fs
    .readdirSync(folderPath)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".json"))
    .sort();

  console.log(`\n📂 ${testSlug}: ${files.length} files`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const filename of files) {
    // E26-T01-32-34.txt → T01, qStart=32, qEnd=34
    const match = filename.match(/E\d+-(T\d+)-(\d+)-(\d+)\.(txt|json)$/);
    if (!match) {
      console.warn(`  ⚠ Skipping unrecognized filename: ${filename}`);
      continue;
    }

    const qStart = parseInt(match[2], 10);
    const qEnd = parseInt(match[3], 10);

    const raw = fs.readFileSync(path.join(folderPath, filename), "utf-8");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw);
    } catch {
      console.warn(`  ⚠ JSON parse error: ${filename}`);
      continue;
    }

    // Part 2 files have no keywords — skip
    if (!data.keywords || !Array.isArray(data.keywords) || data.keywords.length === 0) {
      skipped++;
      continue;
    }

    const vocabItems: VocabItem[] = (data.keywords as Record<string, string>[]).map(toVocabItem);

    const lesson = await prisma.lesson.findFirst({
      where: {
        questionStart: qStart,
        questionEnd: qEnd,
        part: { testSet: { slug: testSlug } },
      },
      select: { id: true },
    });

    if (!lesson) {
      console.warn(`  ✗ Lesson not found: Q${qStart}–${qEnd} (${filename})`);
      notFound++;
      continue;
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { keyVocabulary: vocabItems },
    });
    updated++;
  }

  console.log(`  ✓ Updated: ${updated} | Skipped Part 2: ${skipped} | Not found: ${notFound}`);
  return { updated, skipped, notFound };
}

async function main() {
  const baseFolder = process.argv[2];
  const targetSlug = process.argv[3]; // optional

  if (!baseFolder) {
    console.error(
      "Usage: tsx scripts/import-ets2026-vocab.ts <transcriptFolder> [testSlug]",
    );
    process.exit(1);
  }

  const prisma = createPrisma();
  const totals = { updated: 0, skipped: 0, notFound: 0 };

  try {
    const testFolders = fs
      .readdirSync(baseFolder)
      .filter((f) => fs.statSync(path.join(baseFolder, f)).isDirectory())
      .sort();

    for (const folderName of testFolders) {
      const folderPath = path.join(baseFolder, folderName);
      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".txt") || f.endsWith(".json"))
        .sort();
      if (!files.length) continue;

      const firstMatch = files[0].match(/E\d+-(T\d+)-/);
      if (!firstMatch) continue;

      const slug = testCodeToSlug(firstMatch[1]);

      if (targetSlug && slug !== targetSlug) continue;

      const result = await importTestFolder(prisma, folderPath, slug);
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      totals.notFound += result.notFound;
    }

    console.log(`\n✅ Total — Updated: ${totals.updated} | Skipped: ${totals.skipped} | Not found: ${totals.notFound}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
