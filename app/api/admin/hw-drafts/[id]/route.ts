import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { ContentSchema, contentOf, toJson } from "@/lib/homework/content";

export const dynamic = "force-dynamic";

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  status: z.enum(["draft", "approved", "skipped"]).optional(),
  content: ContentSchema.optional(),
  title: z.string().max(300).optional(),
  date: Day.optional(),
  endDate: Day.nullable().optional(),
});

/** PATCH — duyệt / bỏ duyệt / bỏ qua, hoặc lưu nội dung giáo viên sửa. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/hw-drafts/[id]">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const b = parsed.data;

  const draft = await prisma.hwDraft.findUnique({ where: { id }, select: { status: true } });
  if (!draft) return NextResponse.json({ error: "Không tìm thấy nháp" }, { status: 404 });
  if (draft.status === "assigned") {
    return NextResponse.json({ error: "Nháp đã giao — sửa BTVN ở trang lớp/HV" }, { status: 409 });
  }

  const edits = b.content !== undefined || b.title !== undefined || b.date !== undefined || b.endDate !== undefined;
  const updated = await prisma.hwDraft.update({
    where: { id },
    data: {
      ...(b.status ? { status: b.status } : {}),
      ...(b.content ? { content: toJson(contentOf(b.content)) } : {}),
      ...(b.title !== undefined ? { title: b.title.trim() || null } : {}),
      ...(b.date ? { date: b.date } : {}),
      ...(b.endDate !== undefined ? { endDate: b.endDate } : {}),
      ...(edits ? { edited: true } : {}),
    },
  });
  return NextResponse.json({ draft: updated });
}
