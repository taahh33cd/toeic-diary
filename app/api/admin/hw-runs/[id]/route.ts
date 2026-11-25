import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { refreshDrafts } from "@/lib/homework/drafts";

export const dynamic = "force-dynamic";

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  startDate: Day.optional(),
  startLesson: z.number().int().min(1).max(200).optional(),
  autoAssign: z.boolean().optional(),
  addSkip: Day.optional(),
  removeSkip: Day.optional(),
  status: z.enum(["active", "ended"]).optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/hw-runs/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const b = parsed.data;

  const run = await prisma.hwRun.findUnique({ where: { id } });
  if (!run) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  let skip = run.skipDates;
  if (b.addSkip && !skip.includes(b.addSkip)) skip = [...skip, b.addSkip].sort();
  if (b.removeSkip) skip = skip.filter((d) => d !== b.removeSkip);

  const updated = await prisma.hwRun.update({
    where: { id },
    data: {
      ...(b.startDate ? { startDate: b.startDate } : {}),
      ...(b.startLesson ? { startLesson: b.startLesson } : {}),
      ...(b.autoAssign !== undefined ? { autoAssign: b.autoAssign } : {}),
      ...(b.status ? { status: b.status } : {}),
      skipDates: skip,
    },
  });
  if (updated.status === "active") await refreshDrafts({ runIds: [id] }).catch(() => 0);
  return NextResponse.json({ run: updated });
}

/** DELETE — gỡ giáo trình khỏi lớp/HV. Nháp chưa giao bị xoá, BTVN đã giao giữ nguyên. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/hw-runs/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  await prisma.hwRun.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
