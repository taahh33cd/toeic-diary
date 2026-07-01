#!/usr/bin/env tsx
/**
 * import-e24-keywords.ts
 *
 * Đọc keywords từ JSON files của ETS 2024 và lưu vào lesson.keyVocabulary trong DB.
 *
 * Usage:
 *   tsx scripts/import-e24-keywords.ts "<sourceDir>"
 *   tsx scripts/import-e24-keywords.ts "D:\Compressed\json ets 2024-...\json ets 2024"
 *
 * Source JSON keywords format:
 *   { word, pronunciation, pos, meaning }
 * DB VocabItem format:
 *   { word, ipa, partOfSpeech, meaning, example }
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

interface SourceKeyword {
  word: string;
  pronunciation: string;
  pos: string;
  meaning: string;
}

interface VocabItem {
  word: string;
  ipa: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
}

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

function mapKeyword(k: SourceKeyword): VocabItem {
  return {
    word: k.word,
    ipa: k.pronunciation ?? "",
    partOfSpeech: k.pos ?? "",
    meaning: k.meaning ?? "",
    example: "",
  };
}

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    console.error("Usage: tsx scripts/import-e24-keywords.ts <sourceDir>");
    console.error('Example: tsx scripts/import-e24-keywords.ts "D:\\Compressed\\json ets 2024\\json ets 2024"');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set in .env");
    process.exit(1);
  }

  const prisma = createPrisma();
  let totalUpdated = 0;
  let totalSkipped = 0;

  try {
    for (let testNum = 1; testNum <= 10; testNum++) {
      const testFolder = path.join(sourceDir, `test${testNum}`);
      const nn = String(testNum).padStart(2, "0");
      const testSlug = `ets-2024-test-${testNum}`;

      if (!fs.existsSync(testFolder)) {
        console.warn(`\n⚠  Folder not found: ${testFolder}`);
        continue;
      }

      console.log(`\nTest ${testNum} (${testSlug})`);

      const jsonFiles = fs.readdirSync(testFolder)
        .filter((f) => f.toLowerCase().endsWith(".json"))
        .sort();

      let updated = 0;
      let skipped = 0;

      for (const f of jsonFiles) {
        const base = path.basename(f, ".json");
        const match = base.match(/^E\d+-T\d+-(\d+)(?:-(\d+))?$/i);
        if (!match) continue;

        const qStart = parseInt(match[1], 10);

        const raw = fs.readFileSync(path.join(testFolder, f), "utf-8");
        const json = JSON.parse(raw);

        const keywords: SourceKeyword[] = json.keywords ?? [];
        if (keywords.length === 0) {
          skipped++;
          continue;
        }

        const vocabItems: VocabItem[] = keywords.map(mapKeyword);

        // Find lesson via testSlug → testSet → part → lesson
        const lesson = await prisma.lesson.findFirst({
          where: {
            questionStart: qStart,
            part: {
              testSet: { slug: testSlug },
            },
          },
          select: { id: true, title: true },
        });

        if (!lesson) {
          console.warn(`  ⚠  Q${qStart}: lesson not found in DB`);
          skipped++;
          continue;
        }

        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { keyVocabulary: vocabItems as any },
        });

        updated++;
        totalUpdated++;
      }

      console.log(`  → Updated: ${updated}  Skipped: ${skipped}`);
    }

    console.log(`\n✅  Done! Total lessons updated: ${totalUpdated}  Skipped: ${totalSkipped}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
