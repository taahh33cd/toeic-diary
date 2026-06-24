import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    part: string;
    questionWord: string;
    exerciseIndex: number;
    score: number;
    passed: boolean;
    itemIdx?: number | null;
    correctCount?: number | null;
  };

  if (
    !body.part ||
    !body.questionWord ||
    body.exerciseIndex == null ||
    body.score == null ||
    body.passed == null
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.subskillAttempt.create({
    data: {
      userId: user.id,
      part: body.part,
      questionWord: body.questionWord,
      exerciseIndex: body.exerciseIndex,
      score: body.score,
      passed: body.passed,
      itemIdx: body.itemIdx ?? null,
      correctCount: body.correctCount ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const part         = searchParams.get("part");
  const questionWord = searchParams.get("questionWord");

  const attempts = await prisma.subskillAttempt.findMany({
    where: {
      userId: user.id,
      ...(part         ? { part }         : {}),
      ...(questionWord ? { questionWord }  : {}),
    },
    orderBy: { completedAt: "desc" },
    select: { questionWord: true, exerciseIndex: true, score: true, passed: true, completedAt: true },
  });

  // Best score per (questionWord, exerciseIndex)
  const best: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    const key = `${a.questionWord}:${a.exerciseIndex}`;
    if (!best[key] || a.score > best[key].score) {
      best[key] = { score: a.score, passed: a.passed };
    }
  }

  return NextResponse.json(best);
}
