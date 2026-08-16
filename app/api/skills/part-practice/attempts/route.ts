import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { getPracticeEntry } from "@/lib/listening-practice";
import { parsePracticeAttemptSlug } from "@/lib/listening-practice/adapt";

/** Bắt đầu một lượt luyện part mới, hoặc trả lại lượt đang làm dở của chính bộ đó. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    skill: string;
    part: number;
    testSlug: string;
    config: unknown;
    /** true = bỏ bài dở, làm lại từ đầu */
    restart?: boolean;
  };

  if (!body.skill || !body.testSlug || !body.config) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const parsed = parsePracticeAttemptSlug(body.testSlug);
  if (!parsed || !getPracticeEntry(parsed.testNumber) || parsed.part !== body.part) {
    return NextResponse.json({ error: "Unknown test" }, { status: 404 });
  }

  const existing = await prisma.partPracticeAttempt.findFirst({
    where: { userId: user.id, testSlug: body.testSlug, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
  });

  if (existing && !body.restart) {
    return NextResponse.json({ attempt: existing, resumed: true });
  }

  // Làm lại từ đầu: dọn các lượt dở cũ để không tích lại nhiều bản nháp.
  if (body.restart) {
    await prisma.partPracticeAttempt.deleteMany({
      where: { userId: user.id, testSlug: body.testSlug, status: "in_progress" },
    });
  }

  const attempt = await prisma.partPracticeAttempt.create({
    data: {
      userId: user.id,
      skill: body.skill,
      part: parsed.part,
      testSlug: body.testSlug,
      config: body.config as object,
    },
  });

  return NextResponse.json({ attempt, resumed: false });
}

/** Lịch sử các lượt đã nộp, hoặc lượt đang làm dở (status=in_progress). */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const testSlug = sp.get("testSlug");
  const status = sp.get("status") === "in_progress" ? "in_progress" : "done";

  if (status === "in_progress") {
    const attempt = await prisma.partPracticeAttempt.findFirst({
      where: { userId: user.id, status, ...(testSlug ? { testSlug } : {}) },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ attempt });
  }

  const attempts = await prisma.partPracticeAttempt.findMany({
    where: { userId: user.id, status, ...(testSlug ? { testSlug } : {}) },
    orderBy: { completedAt: "desc" },
    take: 50,
    select: {
      id: true, skill: true, part: true, testSlug: true,
      correct: true, gradable: true, completedAt: true, config: true,
    },
  });

  return NextResponse.json({ attempts });
}
