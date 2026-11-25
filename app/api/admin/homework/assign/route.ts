import { NextResponse } from "next/server";
import { z } from "zod";

import { requireGrader } from "@/lib/submissions/guard";
import { ContentSchema, contentOf } from "@/lib/homework/content";
import { assignHomework } from "@/lib/homework/assign-server";
import type { Homework } from "@/lib/firebase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  hw: z.object({
    id: z.string().min(1).max(80),
    date: Day,
    endDate: Day.optional(),
    title: z.string().max(300).optional(),
    content: ContentSchema,
  }),
  targets: z
    .array(z.object({ type: z.enum(["class", "student"]), id: z.string().trim().min(1).max(80) }))
    .min(1)
    .max(30),
});

/**
 * POST /api/admin/homework/assign — giao thêm một BTVN cho nhiều lớp/HV.
 * Ngày tự dời theo lịch học của từng nơi (buổi gần nhất từ ngày gốc trở đi).
 */
export async function POST(req: Request) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { hw, targets } = parsed.data;

  const base: Homework = {
    id: hw.id,
    date: hw.date,
    ...(hw.endDate ? { endDate: hw.endDate } : {}),
    ...(hw.title?.trim() ? { title: hw.title.trim() } : {}),
    ...contentOf(hw.content),
  };

  const results = [];
  for (const t of targets) {
    try {
      const r = await assignHomework(t, base, gate.user!.id, { shift: true });
      results.push({ ...t, ok: true, date: r.hw.date, endDate: r.hw.endDate ?? null, students: r.students });
    } catch (e) {
      results.push({ ...t, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ results });
}
