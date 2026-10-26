import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";
import { applyReview, emptyState, type SrsState } from "@/lib/vocab/srs";

export const dynamic = "force-dynamic";

const input = z.object({
  /** Từ ở dạng học viên thấy; server tự chuẩn hoá thành word_key. */
  word: z.string().trim().min(1).max(120),
  /** true = Thuộc, false = Chưa thuộc */
  known: z.boolean(),
});

/**
 * Ghi một lượt lật thẻ ở chế độ Học.
 *
 * Lượt quiz đi đường khác (/api/flashcards/sessions/[id]/finish) vì cần ghi cả
 * phiên và từng câu; ở đây chỉ một từ một lần nên gọi thẳng cho nhẹ.
 */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }

  const word = parsed.data.word.trim();
  const wordKey = normalizeWord(word);

  try {
    const cur = await prisma.vocabProgress.findUnique({
      where: { userId_wordKey: { userId: gate.userId, wordKey } },
    });

    const truoc: SrsState = cur
      ? {
          repCount: cur.repCount,
          intervalDays: cur.intervalDays,
          ease: cur.ease,
          lapses: cur.lapses,
          seenCount: cur.seenCount,
          wrongCount: cur.wrongCount,
          mastered: cur.mastered,
          lastReview: cur.lastReview,
          dueAt: cur.dueAt,
        }
      : emptyState();

    const sau = applyReview(truoc, { kind: "flip", known: parsed.data.known });

    const row = await prisma.vocabProgress.upsert({
      where: { userId_wordKey: { userId: gate.userId, wordKey } },
      create: { id: makeId("vp"), userId: gate.userId, wordKey, word, ...sau },
      update: { word, ...sau },
      select: { repCount: true, intervalDays: true, mastered: true, dueAt: true, seenCount: true },
    });

    return NextResponse.json({ progress: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/review POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
