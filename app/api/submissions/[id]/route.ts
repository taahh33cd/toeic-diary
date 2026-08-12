import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

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
