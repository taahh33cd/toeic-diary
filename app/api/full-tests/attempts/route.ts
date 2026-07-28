import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { getCatalogEntry } from "@/lib/full-tests";

/** Bắt đầu một lượt mới, hoặc trả lại lượt đang làm dở của chính đề đó. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    examSlug: string;
    testSlug: string;
    config: unknown;
    /** true = bỏ bài dở, làm lại từ đầu */
    restart?: boolean;
  };

  if (!body.examSlug || !body.testSlug || !body.config) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const testNumber = Number(body.testSlug.split("-").pop());
  if (!getCatalogEntry(body.examSlug, testNumber)) {
    return NextResponse.json({ error: "Unknown test" }, { status: 404 });
  }

  const existing = await prisma.fullTestAttempt.findFirst({
    where: { userId: user.id, testSlug: body.testSlug, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
  });

  if (existing && !body.restart) {
    return NextResponse.json({ attempt: existing, resumed: true });
  }

  // Làm lại từ đầu: dọn các lượt dở cũ để không tích lại nhiều bản nháp.
  if (body.restart) {
    await prisma.fullTestAttempt.deleteMany({
      where: { userId: user.id, testSlug: body.testSlug, status: "in_progress" },
    });
  }

  const attempt = await prisma.fullTestAttempt.create({
    data: {
      userId: user.id,
      examSlug: body.examSlug,
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
    const attempt = await prisma.fullTestAttempt.findFirst({
      where: { userId: user.id, status, ...(testSlug ? { testSlug } : {}) },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ attempt });
  }

  const attempts = await prisma.fullTestAttempt.findMany({
    where: { userId: user.id, status, ...(testSlug ? { testSlug } : {}) },
    orderBy: { completedAt: "desc" },
    take: 50,
    select: {
      id: true, testSlug: true, correct: true, gradable: true,
      listening: true, reading: true, total: true, partScores: true,
      completedAt: true, config: true,
    },
  });

  return NextResponse.json({ attempts });
}
