import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    passageId: string;
    answers: Record<string, string>; // { "0": "A", "1": "C", ... }
    score: number;
  };

  if (!body.passageId || !body.answers || body.score == null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const attempt = await prisma.readingAttempt.create({
    data: {
      userId: user.id,
      passageId: body.passageId,
      answers: body.answers,
      score: body.score,
    },
  });

  return NextResponse.json({ ok: true, attemptId: attempt.id });
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const passageId = searchParams.get("passageId");

  const attempts = await prisma.readingAttempt.findMany({
    where: { userId: user.id, ...(passageId ? { passageId } : {}) },
    orderBy: { completedAt: "desc" },
    select: { passageId: true, score: true, completedAt: true },
  });

  // Best score per passage
  const best: Record<string, number> = {};
  for (const a of attempts) {
    if (best[a.passageId] == null || a.score > best[a.passageId]) {
      best[a.passageId] = a.score;
    }
  }

  return NextResponse.json(best);
}
