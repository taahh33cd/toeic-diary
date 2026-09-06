import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
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

  const submission = await prisma.skillSubmission.findFirst({ where: { id, userId: user.id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const feedback = sanitizeFeedback(submission.feedback);
  const target = feedback.annotations?.find((a) => a.id === annotationId);
  if (!target) return NextResponse.json({ error: "Không tìm thấy nhận xét" }, { status: 404 });

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
  target.replies = [...(target.replies ?? []), reply];

  await prisma.skillSubmission.update({
    where: { id },
    data: { feedback: JSON.parse(JSON.stringify(feedback)) },
  });

  return NextResponse.json({ reply });
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
