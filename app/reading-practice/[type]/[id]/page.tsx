import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { PracticeClient } from "./PracticeClient";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { type, id } = await params;
  const { cat } = await searchParams;

  const passage = await prisma.readingPassage.findUnique({
    where: { id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!passage || passage.type !== type) notFound();

  // Find next passage in the same session (same type + same category if cat provided)
  const nextPassage = await prisma.readingPassage.findFirst({
    where: {
      type,
      orderIndex: { gt: passage.orderIndex },
      ...(cat && cat !== "all" ? { category: cat } : {}),
    },
    orderBy: { orderIndex: "asc" },
    select: { id: true },
  });

  const nextHref = nextPassage
    ? `/reading-practice/${type}/${nextPassage.id}${cat ? `?cat=${encodeURIComponent(cat)}` : ""}`
    : null;

  const backHref = `/reading-practice/${type}`;

  return (
    <PracticeClient
      passage={{
        id: passage.id,
        type: passage.type,
        category: passage.category,
        orderIndex: passage.orderIndex,
        texts: passage.texts as string[],
        questions: passage.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          correct: q.correct,
          explanation: q.explanation,
        })),
      }}
      nextHref={nextHref}
      backHref={backHref}
    />
  );
}
