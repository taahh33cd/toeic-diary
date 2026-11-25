import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { ContentSchema, contentOf, toJson } from "@/lib/homework/content";

export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: ContentSchema.optional(),
  /** Đánh dấu vừa dùng mẫu (đếm số lần dùng). */
  used: z.literal(true).optional(),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/hw-templates/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const b = parsed.data;
  try {
    const t = await prisma.hwTemplate.update({
      where: { id },
      data: {
        ...(b.title ? { title: b.title } : {}),
        ...(b.content ? { content: toJson(contentOf(b.content)) } : {}),
        ...(b.used ? { useCount: { increment: 1 } } : {}),
      },
    });
    return NextResponse.json({ template: t });
  } catch {
    return NextResponse.json({ error: "Không tìm thấy mẫu" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/hw-templates/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  await prisma.hwTemplate.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
