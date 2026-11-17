import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { splitDisplayWords } from "@/lib/shadow/prosody";

export const dynamic = "force-dynamic";

/**
 * Ghi đè Shadow theo lô: từ đỉnh nhấn và câu ⭐ (docs/shadow-spec.md, giai đoạn 4).
 *
 * Trường nào không gửi thì giữ nguyên; gửi `null` là trả về luật tự động.
 */
const update = z.object({
  id: z.string().min(1),
  stressOverride: z.array(z.number().int().min(0)).max(200).nullable().optional(),
  isStarred: z.boolean().nullable().optional(),
});
const input = z.object({ updates: z.array(update).min(1).max(500) });

export async function PATCH(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const { updates } = parsed.data;

  const rows = await prisma.sentence.findMany({
    where: { id: { in: updates.map((u) => u.id) } },
    select: { id: true, content: true },
  });
  const words = new Map(rows.map((r) => [r.id, splitDisplayWords(r.content).length]));

  const bad = updates.find(
    (u) => !words.has(u.id) || (u.stressOverride ?? []).some((k) => k >= (words.get(u.id) ?? 0))
  );
  if (bad) {
    return NextResponse.json({ error: `Câu ${bad.id} không có hoặc chỉ số từ vượt quá độ dài câu` }, { status: 400 });
  }

  await prisma.$transaction(
    updates.map((u) => {
      const data: Prisma.SentenceUpdateInput = {};
      if (u.stressOverride !== undefined) {
        const uniq = u.stressOverride && [...new Set(u.stressOverride)].sort((a, b) => a - b);
        data.stressOverride = uniq && uniq.length ? uniq : Prisma.DbNull;
      }
      if (u.isStarred !== undefined) data.isStarred = u.isStarred;
      return prisma.sentence.update({ where: { id: u.id }, data });
    })
  );
  return NextResponse.json({ ok: true, updated: updates.length });
}
