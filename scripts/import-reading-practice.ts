import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });


type RawQuestion = {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
};

type RawPassage = {
  type: string;
  category?: string;
  texts: string[];
  questions: RawQuestion[];
};

async function importPassages(passages: RawPassage[], typeName: string) {
  console.log(`Importing ${passages.length} ${typeName} passages...`);
  let count = 0;
  for (const [i, p] of passages.entries()) {
    const passage = await prisma.readingPassage.create({
      data: {
        type: typeName,
        category: p.category ?? null,
        texts: p.texts as any,
        orderIndex: i + 1,
      },
    });

    await prisma.readingQuestion.createMany({
      data: p.questions.map((q, qi) => ({
        passageId: passage.id,
        orderIndex: qi + 1,
        text: q.text,
        optionA: q.options.A,
        optionB: q.options.B,
        optionC: q.options.C,
        optionD: q.options.D,
        correct: q.correct,
        explanation: q.explanation,
      })),
    });

    count++;
    process.stdout.write(`\r  ${count}/${passages.length}`);
  }
  console.log(`\n  Done.`);
}

async function main() {
  // Check if already imported
  const existing = await prisma.readingPassage.count();
  if (existing > 0) {
    console.log(`Already have ${existing} passages. Delete them first if you want to re-import.`);
    return;
  }

  const baseDir = "D:\\";
  const singleFile = path.join(baseDir, "TOEIC P7_đoạn đơn", "data_single.js");
  const doubleFile = path.join(baseDir, "TOEIC P7_đoạn đôi", "data.js");
  const tripleFile = path.join(baseDir, "TOEIC P7_đoạn ba", "data_triple.js");

  // Use a sandboxed eval to load the JS arrays
  function evalDataFile(filePath: string): RawPassage[] {
    const code = fs.readFileSync(filePath, "utf8");
    const fn = new Function(`${code}\n; return typeof rawExamDataSingle !== 'undefined' ? rawExamDataSingle : rawExamData;`);
    return fn() as RawPassage[];
  }

  const singleData: RawPassage[] = evalDataFile(singleFile);
  const doubleData: RawPassage[] = evalDataFile(doubleFile);
  const tripleData: RawPassage[] = evalDataFile(tripleFile);

  console.log(`Loaded: ${singleData.length} single, ${doubleData.length} double, ${tripleData.length} triple`);

  await importPassages(singleData, "single");
  await importPassages(doubleData, "double");
  await importPassages(tripleData, "triple");

  const total = await prisma.readingPassage.count();
  console.log(`\nImport complete. Total passages: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
