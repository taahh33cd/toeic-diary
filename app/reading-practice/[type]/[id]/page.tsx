import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { PracticeClient } from "./PracticeClient";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;

  const passage = await prisma.readingPassage.findUnique({
    where: { id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!passage || passage.type !== type) notFound();

  return (
    <PracticeClient
      passage={{
        id: passage.id,
        type: passage.type,
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
    />
  );
}
