import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { suggestDeck } from "@/lib/vocab/lexicon";

export const dynamic = "force-dynamic";

const input = z.object({
  topic: z.string().trim().min(2).max(80),
  level: z.enum(["550", "650", "750", "850"]),
  count: z.number().int().min(5).max(30),
});

/** AI gợi ý từ cho một bộ mới theo chủ đề + cấp. Bỏ qua từ đã có trong sổ. */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Chủ đề, cấp hoặc số từ không hợp lệ" }, { status: 400 });

  try {
    const cards = await prisma.vocabCard.findMany({
      where: { deck: { ownerId: gate.userId } },
      select: { word: true },
      distinct: ["wordKey"],
      take: 400,
    });
    const { topic, level, count } = parsed.data;
    return NextResponse.json(await suggestDeck(topic, level, count, cards.map((c) => c.word), gate.userId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[vocab/suggest]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
