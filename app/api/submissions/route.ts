import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isUsageExempt } from "@/lib/access";
import { notifyAdmins } from "@/lib/push";
import { hasContent, isGradableSkill, sanitizeItems } from "@/lib/submissions";

/** Danh sách bài làm của chính học viên — dùng cho sổ tay. */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const skill = sp.get("skill") ?? undefined;
  const unit = sp.get("unit") ?? undefined;
  const status = sp.get("status") ?? undefined;

  const submissions = await prisma.skillSubmission.findMany({
    where: { userId: user.id, skill, unit, status },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ submissions });
}

/** Lưu nháp vào sổ tay, hoặc gửi giáo viên chấm (`submit: true`). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    id?: string;
    skill?: string;
    unit?: string;
    testKey?: string;
    title?: string;
    items?: unknown;
    submit?: boolean;
  } | null;

  if (!body?.skill || !body.unit || !isGradableSkill(body.skill)) {
    return NextResponse.json({ error: "Thiếu skill/unit hợp lệ" }, { status: 400 });
  }

  const items = sanitizeItems(body.items);
  if (items.length === 0) {
    return NextResponse.json({ error: "Bài làm trống" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, studentCode: true, enrolledCourses: true, displayName: true },
  });

  const submit = body.submit === true;
  if (submit) {
    if (!isUsageExempt(profile)) {
      return NextResponse.json(
        { error: "Chỉ học viên đã đăng ký khoá học mới gửi bài chấm được" },
        { status: 403 }
      );
    }
    if (!hasContent(items)) {
      return NextResponse.json({ error: "Chưa có bài viết hoặc ghi âm để gửi" }, { status: 400 });
    }
  }

  const data = {
    skill: body.skill,
    unit: body.unit,
    testKey: (body.testKey ?? "").slice(0, 100),
    title: (body.title ?? `${body.skill} ${body.unit}`).slice(0, 200),
    items: items as unknown as Prisma.InputJsonValue,
    ...(submit ? { status: "submitted" as const, submittedAt: new Date() } : {}),
  };

  let submission;
  if (body.id) {
    // Bài đã gửi/đã chấm thì khoá lại — tránh sửa bài sau khi giáo viên đã đọc.
    const existing = await prisma.skillSubmission.findFirst({
      where: { id: body.id, userId: user.id },
      select: { status: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Bài đã gửi, không sửa được nữa" }, { status: 409 });
    }
    submission = await prisma.skillSubmission.update({ where: { id: body.id }, data });
  } else {
    submission = await prisma.skillSubmission.create({ data: { ...data, userId: user.id } });
  }

  if (submit) {
    const who = profile?.studentCode ?? profile?.displayName ?? "Học viên";
    await notifyAdmins({
      title: "Bài mới chờ chấm",
      body: `${who} vừa gửi ${submission.title}`,
      url: `/admin/grading/${submission.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ submission });
}
