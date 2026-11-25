import { NextResponse } from "next/server";
import { z } from "zod";

import { requireGrader } from "@/lib/submissions/guard";
import { draftFromNote } from "@/lib/homework/ai-draft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  note: z.string().trim().min(5).max(2000),
  budget: z.number().int().min(10).max(240).optional(),
  band: z.number().int().min(10).max(990).nullable().optional(),
});

/** POST — AI chọn bài trong kho theo ghi chú buổi học. Giáo viên duyệt lại trong khung soạn. */
export async function POST(req: Request) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ghi chú quá ngắn hoặc quá dài" }, { status: 400 });
  try {
    const r = await draftFromNote(parsed.data.note, { budget: parsed.data.budget, band: parsed.data.band });
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 422 });
    return NextResponse.json({ items: r.items });
  } catch (e) {
    console.error("[ai-draft]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "AI đang lỗi, thử lại sau" }, { status: 502 });
  }
}
