import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";
import { applyReview, emptyState, type SrsState } from "@/lib/vocab/srs";

export const dynamic = "force-dynamic";

/** Từ ở dạng học viên thấy; server tự chuẩn hoá thành word_key. */
const word = z.string().trim().min(1).max(120);

const input = z.discriminatedUnion("kind", [
  /** Lật thẻ ở chế độ Học rồi tự đánh dấu — nửa trọng số. */
  z.object({ kind: z.literal("flip"), word, known: z.boolean() }),
  /** Một câu trả lời: gõ từ, chọn đáp án… — trọng số đầy, có tính tốc độ. */
  z.object({
    kind: z.literal("quiz"),
    word,
    correct: z.boolean(),
    answerMs: z.number().int().min(0).max(600_000).optional(),
    quizType: z.string().trim().max(40).optional(),
  }),
]);

/**
 * Ghi MỘT lượt ôn của MỘT từ — lật thẻ hoặc một câu trả lời lẻ.
 *
 * Phiên quiz trọn bộ đi đường khác (sessions/[id]/finish) vì còn phải ghi cả
 * phiên và từng câu để tính "top từ hay sai"; ở đây một từ một lần nên gọi
 * thẳng cho nhẹ.
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

  const body = parsed.data;
  const word = body.word.trim();
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

    const sau = applyReview(
      truoc,
      body.kind === "flip"
        ? { kind: "flip", known: body.known }
        : { kind: "quiz", correct: body.correct, answerMs: body.answerMs, quizType: body.quizType }
    );

    const row = await prisma.vocabProgress.upsert({
      where: { userId_wordKey: { userId: gate.userId, wordKey } },
      create: { id: makeId("vp"), userId: gate.userId, wordKey, word, ...sau },
      update: { word, ...sau },
      select: {
        wordKey: true,
        repCount: true,
        intervalDays: true,
        mastered: true,
        wrongCount: true,
        seenCount: true,
        lastReview: true,
        dueAt: true,
      },
    });

    // wasMastered để client biết có phải vừa mới thuộc (để cộng XP) hay không
    return NextResponse.json({ progress: row, wasMastered: truoc.mastered });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/review POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
