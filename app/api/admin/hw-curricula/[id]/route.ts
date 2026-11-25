import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { ContentSchema, contentOf, toJson } from "@/lib/homework/content";
import { parseLessons, refreshDrafts } from "@/lib/homework/drafts";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/hw-curricula/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const c = await prisma.hwCurriculum.findUnique({
    where: { id },
    include: { runs: { orderBy: { createdAt: "asc" } } },
  });
  if (!c) return NextResponse.json({ error: "Không tìm thấy giáo trình" }, { status: 404 });
  return NextResponse.json({
    curriculum: { id: c.id, title: c.title, lessons: parseLessons(c.lessons), updatedAt: c.updatedAt },
    runs: c.runs,
  });
}

const Lesson = z.object({
  id: z.string().min(1).max(80),
  topic: z.string().max(300),
  content: ContentSchema,
});
const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  lessons: z.array(Lesson).max(200).optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/hw-curricula/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const b = parsed.data;
  try {
    await prisma.hwCurriculum.update({
      where: { id },
      data: {
        ...(b.title ? { title: b.title } : {}),
        ...(b.lessons
          ? {
              lessons: b.lessons.map((l) => ({
                id: l.id,
                topic: l.topic,
                content: toJson(contentOf(l.content)),
              })),
            }
          : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy giáo trình" }, { status: 404 });
  }
  // Nháp chưa sửa của các lớp đang dùng lấy ngay nội dung mới.
  if (b.lessons) {
    const runs = await prisma.hwRun.findMany({ where: { curriculumId: id, status: "active" }, select: { id: true } });
    if (runs.length) await refreshDrafts({ runIds: runs.map((r) => r.id) }).catch(() => 0);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/hw-curricula/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  await prisma.hwCurriculum.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
