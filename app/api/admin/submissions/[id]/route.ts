import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";
import { estimateBand, mergeAnnotationReplies, sanitizeFeedback, scaleFor } from "@/lib/submissions";
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

/**
 * Lưu bài chấm. Hai chế độ:
 *
 * - `publish: false` (tự lưu) — chỉ ghi vào `draft_feedback`. Không đổi trạng
 *   thái, không tính điểm, không báo cho học viên. Cần cột riêng vì trang xem
 *   lại của học viên render thẳng `feedback` bất kể trạng thái; ghi nháp vào đó
 *   là học viên đọc được bài chấm dở.
 * - `publish: true` (bấm gửi) — gộp hội thoại rồi chép sang `feedback`, đánh dấu
 *   đã chấm, xoá nháp, báo cho học viên nếu đây là lần chấm đầu.
 */
export async function POST(req: Request, { params }: Ctx) {
  const gate = await requireGrader();
  if (gate.error || !gate.user) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null) as { feedback?: unknown; publish?: boolean } | null;
  const incoming = sanitizeFeedback(body?.feedback);
  // Mặc định là công bố để nơi gọi cũ không đổi hành vi.
  const publish = body?.publish !== false;

  try {
    if (!publish) {
      const existing = await prisma.skillSubmission.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (existing.status === "draft") {
        return NextResponse.json({ error: "Học viên chưa gửi bài này" }, { status: 409 });
      }
      await prisma.skillSubmission.update({
        where: { id },
        data: { draftFeedback: incoming as unknown as Prisma.InputJsonValue },
      });
      return NextResponse.json({ savedAt: new Date().toISOString() });
    }

    /**
     * Khoá hàng rồi mới đọc-gộp-ghi. Trang chấm gửi lên nguyên khối feedback
     * chụp từ lúc mở trang, nên nếu học viên vừa trả lời một thẻ thì lượt đó
     * chỉ nằm ở DB — phải đọc trong cùng transaction mới gộp lại được, và phải
     * khoá để lượt trả lời gửi song song không lọt vào giữa đọc và ghi.
     */
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { user_id: string; title: string; status: string; skill: string; unit: string; feedback: unknown }[]
      >`SELECT user_id, title, status, skill, unit, feedback
          FROM skill_submissions WHERE id = ${id} FOR UPDATE`;
      const existing = rows[0];
      if (!existing) return { error: "Not found", status: 404 } as const;
      if (existing.status === "draft") {
        return { error: "Học viên chưa gửi bài này", status: 409 } as const;
      }

      const feedback = mergeAnnotationReplies(incoming, sanitizeFeedback(existing.feedback));

      const submission = await tx.skillSubmission.update({
        where: { id },
        data: {
          feedback: feedback as unknown as Prisma.InputJsonValue,
          band: estimateBand(feedback, scaleFor(existing.skill, existing.unit)),
          status: "graded",
          gradedBy: gate.user!.id,
          gradedAt: new Date(),
          // Nháp đã thành bản chính thức, giữ lại chỉ tổ lần sau load nhầm bản cũ.
          draftFeedback: Prisma.DbNull,
        },
      });
      return { submission, existing } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const { submission, existing } = result;

    // Lần chấm lại không báo nữa — học viên đã biết bài được chấm rồi.
    if (existing.status === "submitted") {
      await sendPushToUser(existing.user_id, {
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
