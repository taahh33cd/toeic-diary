/**
 * Import một lô bài Part 7 (output của merge-explanations.py) vào reading_passages /
 * reading_questions, nối tiếp orderIndex sau các bài đã có.
 *
 *   npx tsx scripts/reading-practice/import-batch.ts <batch-final.json> [--dry]
 *
 * Sau khi import xong, script ghi `source` của các bài vừa nhập vào
 * scripts/reading-practice/used-sources.json để lô sau không chọn trùng.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const USED_FILE = path.join(__dirname, "used-sources.json");

type Batch = {
  source: string;
  type: string;
  category: string | null;
  texts: string[];
  questions: {
    text: string;
    options: { A: string; B: string; C: string; D: string };
    correct: string;
    explanation: Record<string, unknown>;
  }[];
}[];

async function main() {
  const [file, ...flags] = process.argv.slice(2);
  const dry = flags.includes("--dry");
  const batch: Batch = JSON.parse(fs.readFileSync(file, "utf8"));

  const maxByType = new Map<string, number>();
  for (const type of new Set(batch.map((g) => g.type))) {
    const last = await prisma.readingPassage.findFirst({
      where: { type },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    maxByType.set(type, last?.orderIndex ?? 0);
  }
  console.log("orderIndex hiện tại:", Object.fromEntries(maxByType));

  if (dry) {
    for (const g of batch) {
      const next = maxByType.get(g.type)! + 1;
      maxByType.set(g.type, next);
      console.log(`  ${g.type} #${next} ← ${g.source} (${g.questions.length} câu)`);
    }
    console.log("Dry run — chưa ghi gì.");
    return;
  }

  const imported: string[] = [];
  for (const g of batch) {
    const orderIndex = maxByType.get(g.type)! + 1;
    maxByType.set(g.type, orderIndex);

    const passage = await prisma.readingPassage.create({
      data: {
        type: g.type,
        category: g.category,
        texts: g.texts,
        orderIndex,
      },
    });

    await prisma.readingQuestion.createMany({
      data: g.questions.map((q, i) => ({
        passageId: passage.id,
        orderIndex: i + 1,
        text: q.text,
        optionA: q.options.A,
        optionB: q.options.B,
        optionC: q.options.C,
        optionD: q.options.D,
        correct: q.correct,
        explanation: JSON.stringify(q.explanation),
      })),
    });

    imported.push(g.source);
    console.log(`  ${g.type} #${orderIndex} ✓ ${g.source}`);
  }

  const used: string[] = fs.existsSync(USED_FILE)
    ? JSON.parse(fs.readFileSync(USED_FILE, "utf8"))
    : [];
  fs.writeFileSync(USED_FILE, JSON.stringify([...used, ...imported], null, 1), "utf8");

  const total = await prisma.readingPassage.count();
  console.log(`\nXong. Đã nhập ${imported.length} bài. Tổng số bài: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
