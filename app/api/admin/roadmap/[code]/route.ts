import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getCatalogItem } from "@/lib/roadmap/catalog";
import { vnToday } from "@/lib/roadmap/vn-date";

/**
 * PATCH /api/admin/roadmap/[code] — giáo viên sửa lộ trình của một học viên.
 *
 * Ba việc, cố ý hẹp:
 *   remove   — bỏ một việc khỏi lịch
 *   add      — thêm một việc từ catalog vào một ngày
 *   note     — ghi chú cho tuần (nằm trong `StudyWeek.review.teacherNote`)
 *
 * KHÔNG cho sửa tiêu đề hay đường dẫn của việc: mọi việc phải trỏ tới một mục
 * có thật trong catalog, nếu không chốt chặn `check:catalog` mất tác dụng và
 * học viên có thể nhận link chết.
 */

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("remove"), taskId: z.string().uuid() }),
  z.object({
    action: z.literal("add"),
    catalogId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({ action: z.literal("note"), weekId: z.string().uuid(), note: z.string().max(500) }),
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const student = await prisma.profile.findUnique({
    where: { studentCode: code },
    select: { id: true },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const body = parsed.data;

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: student.id, status: "active" },
    select: { id: true },
  });
  if (!plan) return NextResponse.json({ error: "no_plan" }, { status: 404 });

  if (body.action === "remove") {
    const task = await prisma.studyTask.findFirst({
      where: { id: body.taskId, planId: plan.id },
      select: { id: true, status: true },
    });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Việc học viên đã làm xong thì không xoá: xoá đi là xoá cả bằng chứng và
    // XP đã cộng, còn thống kê tuần thì sai từ đó trở đi.
    if (task.status === "done") {
      return NextResponse.json({ error: "already_done" }, { status: 409 });
    }
    await prisma.studyTask.delete({ where: { id: task.id } });
    await logEdit(plan.id, student.id, user.id, { removed: body.taskId });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "add") {
    const item = getCatalogItem(body.catalogId);
    if (!item) return NextResponse.json({ error: "unknown_catalog_id" }, { status: 400 });

    const week = await prisma.studyWeek.findFirst({
      where: {
        planId: plan.id,
        startDate: { lte: new Date(`${body.date}T00:00:00Z`) },
        endDate: { gte: new Date(`${body.date}T00:00:00Z`) },
      },
      select: { id: true },
    });
    if (!week) return NextResponse.json({ error: "date_outside_plan" }, { status: 400 });

    const last = await prisma.studyTask.findFirst({
      where: { planId: plan.id, date: new Date(`${body.date}T00:00:00Z`) },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const created = await prisma.studyTask.create({
      data: {
        planId: plan.id,
        weekId: week.id,
        userId: student.id,
        date: new Date(`${body.date}T00:00:00Z`),
        order: (last?.order ?? -1) + 1,
        catalogId: item.id,
        title: item.title,
        href: item.href,
        kind: item.kind,
        target: item.evidence as unknown as object,
        estMinutes: item.estMinutes,
        priority: "core",
        status: "pending",
      },
    });
    await logEdit(plan.id, student.id, user.id, { added: item.id, date: body.date });
    return NextResponse.json({ ok: true, taskId: created.id });
  }

  // note
  const week = await prisma.studyWeek.findFirst({
    where: { id: body.weekId, planId: plan.id },
    select: { id: true, review: true },
  });
  if (!week) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const review = (week.review as Record<string, unknown> | null) ?? {};
  await prisma.studyWeek.update({
    where: { id: week.id },
    data: {
      review: {
        ...review,
        teacherNote: body.note,
        teacherNoteAt: new Date().toISOString(),
      } as unknown as object,
    },
  });
  await logEdit(plan.id, student.id, user.id, { note: body.weekId });
  return NextResponse.json({ ok: true });
}

/** Mọi lần GV sửa đều để lại dấu — sau này lộ trình lệch còn biết ai đổi gì. */
async function logEdit(
  planId: string,
  userId: string,
  teacherId: string,
  payload: Record<string, unknown>,
) {
  await prisma.planEvent.create({
    data: {
      planId,
      userId,
      type: "teacher_edit",
      payload: { ...payload, teacherId, at: vnToday() } as unknown as object,
    },
  });
}
