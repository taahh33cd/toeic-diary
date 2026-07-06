import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    section: string;
    difficulty: string;
    exerciseIndex: number;
    score: number;
    passed: boolean;
    itemIdx?: number | null;
    correctCount?: number | null;
  };

  if (
    !body.section ||
    !body.difficulty ||
    body.exerciseIndex == null ||
    body.score == null ||
    body.passed == null
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await prisma.ipaAttempt.create({
      data: {
        userId: user.id,
        section: body.section,
        difficulty: body.difficulty,
        exerciseIndex: body.exerciseIndex,
        score: body.score,
        passed: body.passed,
        itemIdx: body.itemIdx ?? null,
        correctCount: body.correctCount ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Table may not exist yet (before `prisma db push`) — don't break the UX.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
