import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { notifyAdmins } from "@/lib/push";
import { sanitizeFeedback, type AnnotationReply } from "@/lib/submissions";

type Ctx = { params: Promise<{ id: string }> };

/** Chi tiết một bài làm của chính học viên (kèm nhận xét nếu đã chấm). */
export async function GET(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const submission = await prisma.skillSubmission.findFirst({
    where: { id, userId: user.id },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ submission });
}

/**
 * POST — học viên trả lời một thẻ nhận xét.
 *
 * Chỉ được PHỤ THÊM vào `replies` của đúng annotation: đọc feedback hiện có,
 * chèn một lượt trả lời rồi ghi lại. Không nhận feedback từ client để học viên
 * không tự sửa điểm hay đề xuất của giáo viên.
 */
export async function POST(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { annotationId?: string; text?: string };
  const annotationId = (body.annotationId ?? "").trim();
  const text = (body.text ?? "").trim().slice(0, 2000);
  if (!annotationId || !text) {
    return NextResponse.json({ error: "Thiếu nội dung trả lời" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string | null }>();

  const reply: AnnotationReply = {
    id: `r${Date.now().toString(36)}`,
    role: "student",
    authorName: profile?.display_name ?? "Học viên",
    text,
    createdAt: new Date().toISOString(),
  };

  /**
   * Khoá hàng trong suốt đọc-sửa-ghi. Giáo viên bấm Lưu ở trang chấm cũng ghi
   * đè cả khối feedback này; không khoá thì hai bên đè lên nhau và một lượt
   * trả lời hoặc một sửa đổi khi chấm sẽ mất.
   */
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ feedback: unknown }[]>`
      SELECT feedback FROM skill_submissions
        WHERE id = ${id} AND user_id = ${user.id} FOR UPDATE`;
    if (rows.length === 0) return { error: "Not found", status: 404 } as const;

    const feedback = sanitizeFeedback(rows[0].feedback);
    const target = feedback.annotations?.find((a) => a.id === annotationId);
    if (!target) return { error: "Không tìm thấy nhận xét", status: 404 } as const;

    target.replies = [...(target.replies ?? []), reply];
    await tx.skillSubmission.update({
      where: { id },
      data: { feedback: JSON.parse(JSON.stringify(feedback)) },
    });
    return { ok: true } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ reply });
}

/**
 * PATCH — học viên xin giáo viên chấm lại bài AI đã chấm.
 *
 * Đưa bài về "submitted" nhưng GIỮ nguyên `feedback`: nhận xét của AI vẫn còn
 * để học viên đọc trong lúc chờ, và trang chấm nạp sẵn nó cho giáo viên sửa.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "regrade") {
    return NextResponse.json({ error: "Thao tác không hợp lệ" }, { status: 400 });
  }

  const submission = await prisma.skillSubmission.findFirst({
    where: { id, userId: user.id },
    select: { status: true, feedback: true, title: true },
  });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status !== "graded" || sanitizeFeedback(submission.feedback).by !== "ai") {
    return NextResponse.json({ error: "Bài này đang do giáo viên chấm rồi" }, { status: 409 });
  }

  await prisma.skillSubmission.update({
    where: { id },
    data: { status: "submitted", gradedAt: null },
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, student_code")
    .eq("id", user.id)
    .single<{ display_name: string | null; student_code: string | null }>();

  await notifyAdmins({
    title: "Học viên xin chấm lại",
    body: `${profile?.student_code ?? profile?.display_name ?? "Học viên"} xin chấm lại ${submission.title}`,
    url: `/admin/grading/${id}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

/** Xoá bài nháp. Bài đã gửi thì giữ lại để giáo viên còn chấm. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const res = await prisma.skillSubmission.deleteMany({
    where: { id, userId: user.id, status: "draft" },
  });
  if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
