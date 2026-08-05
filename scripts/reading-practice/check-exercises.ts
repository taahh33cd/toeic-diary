/**
 * Kiểm tra các bài mới nhập: dữ liệu giải thích có sinh được bài tập sau khi đọc không.
 *
 *   npx tsx scripts/reading-practice/check-exercises.ts [minSingle] [minDoubleTriple]
 *
 * Mặc định kiểm mọi bài single order_index > 51 và double/triple > 15.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import {
  buildExercises,
  type RichExplanation,
} from "../../app/reading-practice/[type]/[id]/exercises";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const minSingle = Number(process.argv[2] ?? 51);
  const minOther = Number(process.argv[3] ?? 15);

  const passages = await prisma.readingPassage.findMany({
    where: {
      OR: [
        { type: "single", orderIndex: { gt: minSingle } },
        { type: { in: ["double", "triple"] }, orderIndex: { gt: minOther } },
      ],
    },
    orderBy: [{ type: "asc" }, { orderIndex: "asc" }],
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  let failed = 0;
  for (const p of passages) {
    const rich: RichExplanation[] = [];
    for (const q of p.questions) {
      try {
        const parsed = JSON.parse(q.explanation);
        if (parsed && typeof parsed === "object" && "dan_chung" in parsed) rich.push(parsed);
      } catch {
        /* định dạng cũ */
      }
    }

    const ex = buildExercises(
      p.questions.map((q) => ({
        text: q.text,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
        correct: q.correct,
      })),
      rich
    );

    const counts = `vocab=${ex.vocab.length} paraphrase=${ex.paraphrase.length} translation=${ex.translation.length}`;
    const ok = rich.length === p.questions.length && ex.vocab.length > 0 && ex.paraphrase.length > 0 && ex.translation.length > 0;
    if (!ok) failed++;
    console.log(
      `${ok ? "OK  " : "LỖI "} ${p.type} #${p.orderIndex}  rich=${rich.length}/${p.questions.length}  ${counts}`
    );
  }

  console.log(`\n${passages.length - failed}/${passages.length} bài sinh đủ 3 nhóm bài tập.`);
  if (failed) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
