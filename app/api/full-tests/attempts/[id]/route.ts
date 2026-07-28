import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { loadTest, scoreAttempt, type PartNumber } from "@/lib/full-tests";

type Ctx = { params: Promise<{ id: string }> };

function sanitizeAnswers(raw: unknown): Record<number, string> {
  const out: Record<number, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const q = Number(k);
    if (Number.isInteger(q) && q >= 1 && q <= 200 && typeof v === "string" && /^[A-D]$/.test(v)) {
      out[q] = v;
    }
  }
  return out;
}

function sanitizeMarked(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((n) => Number.isInteger(n) && n >= 1 && n <= 200))] as number[];
}

/** Auto-save trong lúc làm bài. */
export async function PATCH(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    answers?: unknown;
    marked?: unknown;
    secondsLeft?: number | null;
  };

  // updateMany + điều kiện userId: vừa chặn sửa bài người khác, vừa khỏi query 2 lần.
  const res = await prisma.fullTestAttempt.updateMany({
    where: { id, userId: user.id, status: "in_progress" },
    data: {
      answers: sanitizeAnswers(body.answers),
      marked: sanitizeMarked(body.marked),
      secondsLeft:
        typeof body.secondsLeft === "number" ? Math.max(0, Math.floor(body.secondsLeft)) : null,
    },
  });

  if (res.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/** Nộp bài — chấm ở server rồi chốt lượt làm. */
export async function POST(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { answers?: unknown; marked?: unknown };

  const attempt = await prisma.fullTestAttempt.findFirst({
    where: { id, userId: user.id },
  });
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attempt.status === "done") {
    return NextResponse.json({ error: "Đã nộp bài rồi" }, { status: 409 });
  }

  const test = await loadTest(attempt.testSlug);
  if (!test) return NextResponse.json({ error: "Unknown test" }, { status: 404 });

  const config = attempt.config as { parts?: unknown };
  const parts = (Array.isArray(config?.parts) ? config.parts : [])
    .filter((p): p is PartNumber => Number.isInteger(p) && (p as number) >= 1 && (p as number) <= 7);
  if (!parts.length) {
    return NextResponse.json({ error: "Cấu hình lượt làm không hợp lệ" }, { status: 400 });
  }

  const answers = sanitizeAnswers(body.answers);
  const result = scoreAttempt(test, answers, parts);

  const updated = await prisma.fullTestAttempt.update({
    where: { id },
    data: {
      status: "done",
      answers,
      marked: sanitizeMarked(body.marked),
      correct: result.correct,
      gradable: result.gradable,
      listening: result.scaled?.ls ?? null,
      reading: result.scaled?.rd ?? null,
      total: result.scaled?.total ?? null,
      partScores: result.parts.map((p) => ({
        part: p.part, correct: p.correct, gradable: p.gradable,
      })),
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ attempt: updated, result });
}
