import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { refreshDrafts } from "@/lib/homework/drafts";

export const dynamic = "force-dynamic";

const Body = z.object({
  targetType: z.enum(["class", "student"]),
  targetId: z.string().trim().min(1).max(80),
  targetLabel: z.string().trim().min(1).max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startLesson: z.number().int().min(1).max(200).default(1),
  autoAssign: z.boolean().default(false),
});

/** POST — gắn giáo trình cho một lớp/HV, rồi sinh luôn nháp các buổi sắp tới. */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/hw-curricula/[id]/runs">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const b = parsed.data;

  const cur = await prisma.hwCurriculum.findUnique({ where: { id }, select: { id: true } });
  if (!cur) return NextResponse.json({ error: "Không tìm thấy giáo trình" }, { status: 404 });

  // Một lớp/HV chỉ chạy một giáo trình một lúc — gắn cái mới thì cái cũ kết thúc.
  await prisma.hwRun.updateMany({
    where: { targetType: b.targetType, targetId: b.targetId, status: "active" },
    data: { status: "ended" },
  });
  const run = await prisma.hwRun.create({ data: { ...b, curriculumId: id, createdBy: gate.user!.id } });
  await refreshDrafts({ runIds: [run.id] }).catch((e) => console.error("[runs POST refresh]", e));
  return NextResponse.json({ run }, { status: 201 });
}
