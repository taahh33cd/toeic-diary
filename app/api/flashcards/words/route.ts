import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";

export const dynamic = "force-dynamic";

/**
 * Toàn bộ kho từ của mình — một dòng mỗi TỪ, kèm tiến độ và nội dung thẻ.
 *
 * Nội dung lấy từ thẻ đầu tiên tìm được của từ đó (một từ có thể nằm ở nhiều
 * bộ với nghĩa/ảnh khác nhau); tiến độ thì chỉ có một, vì nó khoá theo từ.
 *
 * Từ còn tiến độ nhưng bộ chứa nó đã bị xoá vẫn hiện ra — công ôn đã bỏ ra
 * không biến mất chỉ vì học viên dọn bộ thẻ.
 */
export async function GET() {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const [progress, cards] = await Promise.all([
      prisma.vocabProgress.findMany({
        where: { userId: gate.userId },
        orderBy: { dueAt: "asc" },
      }),
      prisma.vocabCard.findMany({
        where: { deck: { ownerId: gate.userId } },
        select: {
          deckId: true,
          word: true,
          wordKey: true,
          ipa: true,
          pos: true,
          meaningVi: true,
          definition: true,
          example: true,
          imageUrl: true,
          audioUrl: true,
          deck: { select: { part: true } },
        },
      }),
    ]);

    const noiDung = new Map<string, (typeof cards)[number]>();
    const deckIds = new Map<string, string[]>();
    for (const c of cards) {
      if (!noiDung.has(c.wordKey)) noiDung.set(c.wordKey, c);
      const arr = deckIds.get(c.wordKey) ?? [];
      arr.push(c.deckId);
      deckIds.set(c.wordKey, arr);
    }

    const words = progress.map((p) => {
      const c = noiDung.get(p.wordKey);
      return {
        wordKey: p.wordKey,
        word: c?.word ?? p.word,
        ipa: c?.ipa ?? null,
        pos: c?.pos ?? null,
        meaningVi: c?.meaningVi ?? null,
        definition: c?.definition ?? null,
        example: c?.example ?? null,
        imageUrl: c?.imageUrl ?? null,
        audioUrl: c?.audioUrl ?? null,
        part: c?.deck.part ?? null,
        deckIds: deckIds.get(p.wordKey) ?? [],
        repCount: p.repCount,
        intervalDays: p.intervalDays,
        mastered: p.mastered,
        wrongCount: p.wrongCount,
        seenCount: p.seenCount,
        lastReview: p.lastReview,
        dueAt: p.dueAt,
      };
    });

    return NextResponse.json({ words });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/words GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
