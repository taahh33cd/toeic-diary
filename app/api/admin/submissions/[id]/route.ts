import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";
import { estimateBand, sanitizeFeedback, scaleFor } from "@/lib/submissions";
import { requireGrader } from "@/lib/submissions/guard";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Chi tiết bài để giáo viên chấm. */
export async function GET(_req: Request, { params }: Ctx) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  try {
    const submission = await prisma.skillSubmission.findUnique({
      where: { id },
      include: { profile: { select: { id: true, displayName: true, studentCode: true } } },
    });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ submission });
  } catch (e) {
    // Không để lỗi lọt ra thành HTML 500 — client cần JSON mới đọc được nguyên nhân.
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/submissions/:id GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

/** Lưu nhận xét. Gọi lại lần nữa để sửa nhận xét đã lưu. */
export async function POST(req: Request, { params }: Ctx) {
  const gate = await requireGrader();
  if (gate.error || !gate.user) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null) as { feedback?: unknown } | null;
  const feedback = sanitizeFeedback(body?.feedback);

  try {
    const existing = await prisma.skillSubmission.findUnique({
      where: { id },
      select: { userId: true, title: true, status: true, skill: true, unit: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status === "draft") {
      return NextResponse.json({ error: "Học viên chưa gửi bài này" }, { status: 409 });
    }

    const submission = await prisma.skillSubmission.update({
      where: { id },
      data: {
        feedback: feedback as unknown as Prisma.InputJsonValue,
        band: estimateBand(feedback, scaleFor(existing.skill, existing.unit)),
        status: "graded",
        gradedBy: gate.user.id,
        gradedAt: new Date(),
      },
    });

    // Lần chấm lại không báo nữa — học viên đã biết bài được chấm rồi.
    if (existing.status === "submitted") {
      await sendPushToUser(existing.userId, {
        title: "Bài của bạn đã được chấm",
        body: `${existing.title} — xem nhận xét của giáo viên`,
        url: `/journal/submissions/${id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ submission });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/submissions/:id POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
