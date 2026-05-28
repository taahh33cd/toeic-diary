import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempts = await prisma.grammarAttempt.findMany({
    where: { userId: user.id },
    select: { questionId: true, isCorrect: true, topicSlug: true },
  });

  // Per question: was it ever answered correctly?
  const result: Record<string, { everCorrect: boolean; topicSlug: string }> = {};
  for (const a of attempts) {
    if (!result[a.questionId]) {
      result[a.questionId] = { everCorrect: a.isCorrect, topicSlug: a.topicSlug };
    } else if (a.isCorrect) {
      result[a.questionId].everCorrect = true;
    }
  }

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    results: { questionId: string; topicSlug: string; isCorrect: boolean; userAnswer: string }[];
  };

  if (!Array.isArray(body.results) || body.results.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.grammarAttempt.createMany({
    data: body.results.map((r) => ({
      userId: user.id,
      questionId: r.questionId,
      topicSlug: r.topicSlug,
      isCorrect: r.isCorrect,
      userAnswer: r.userAnswer,
    })),
  });

  return NextResponse.json({ ok: true, saved: body.results.length });
}
