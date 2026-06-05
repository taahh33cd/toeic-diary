/**
 * Updates reading_questions.explanation with rich JSON from D:\Part 7 files.
 * Matches by type + orderIndex (same insertion order as original import).
 * Run: npx ts-node --project tsconfig.scripts.json scripts/update-reading-explanations.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

type RichExplanation = {
  dan_chung: string;
  ham_y:     string;
  lien_he:   string;
  tu_vung:   { tu: string; nghia: string }[];
  dich_bai:  string;
};

type RawQ = {
  text: string;
  explanation: RichExplanation | string;
};

type RawPassage = {
  type?: string;
  texts: string[];
  questions: RawQ[];
};

function evalFile(filePath: string): RawPassage[] {
  const code = fs.readFileSync(filePath, "utf8");
  const fn = new Function(
    `${code}\n; return typeof rawExamDataSingle !== 'undefined' ? rawExamDataSingle : rawExamData;`
  );
  return fn() as RawPassage[];
}

async function updateType(rawPassages: RawPassage[], type: string) {
  const dbPassages = await prisma.readingPassage.findMany({
    where: { type },
    orderBy: { orderIndex: "asc" },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  console.log(`\n[${type}] DB: ${dbPassages.length} passages, file: ${rawPassages.length} passages`);

  let updatedQ = 0, skipped = 0;

  for (let pi = 0; pi < Math.min(rawPassages.length, dbPassages.length); pi++) {
    const raw = rawPassages[pi];
    const db  = dbPassages[pi];

    // Sanity check: first 40 chars of first text should match
    const rawSnippet = raw.texts[0]?.slice(0, 40) ?? "";
    const dbSnippet  = (db.texts as string[])[0]?.slice(0, 40) ?? "";
    if (rawSnippet !== dbSnippet) {
      console.warn(`  [SKIP] Passage ${pi + 1}: text mismatch`);
      console.warn(`    raw: ${rawSnippet}`);
      console.warn(`    db : ${dbSnippet}`);
      skipped++;
      continue;
    }

    for (let qi = 0; qi < Math.min(raw.questions.length, db.questions.length); qi++) {
      const rawQ = raw.questions[qi];
      const dbQ  = db.questions[qi];

      if (typeof rawQ.explanation !== "object" || rawQ.explanation === null) {
        skipped++;
        continue;
      }

      await prisma.readingQuestion.update({
        where: { id: dbQ.id },
        data:  { explanation: JSON.stringify(rawQ.explanation) },
      });
      updatedQ++;
    }

    process.stdout.write(`\r  passages processed: ${pi + 1}/${Math.min(rawPassages.length, dbPassages.length)}`);
  }

  console.log(`\n  Updated: ${updatedQ} questions | Skipped: ${skipped}`);
}

async function main() {
  console.log("Loading files from D:\\Part 7 ...");
  const single = evalFile("D:\\Part 7\\data_single.js");
  const double = evalFile("D:\\Part 7\\data_double.js");
  const triple = evalFile("D:\\Part 7\\data_triple.js");
  console.log(`Loaded: ${single.length} single, ${double.length} double, ${triple.length} triple`);

  await updateType(single, "single");
  await updateType(double, "double");
  await updateType(triple, "triple");

  console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
