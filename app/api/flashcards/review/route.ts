import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId, moTaLoi } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";
import { applyReview, emptyState, type SrsState } from "@/lib/vocab/srs";

export const dynamic = "force-dynamic";

/** Từ ở dạng học viên thấy; server tự chuẩn hoá thành word_key. */
const word = z.string().trim().min(1).max(120);

/** Khoá client sinh, chống ghi trùng khi hàng đợi offline gửi lại. */
const clientRef = z.string().trim().min(8).max(64).optional();

const input = z.discriminatedUnion("kind", [
  /** Lật thẻ ở chế độ Học rồi tự đánh dấu — nửa trọng số. */
  z.object({ kind: z.literal("flip"), word, known: z.boolean(), clientRef }),
  /** Một câu trả lời: gõ từ, chọn đáp án… — trọng số đầy, có tính tốc độ. */
  z.object({
    kind: z.literal("quiz"),
    word,
    correct: z.boolean(),
    answerMs: z.number().int().min(0).max(600_000).optional(),
    quizType: z.string().trim().max(40).optional(),
    clientRef,
  }),
]);

/** Số khoá giữ lại cho mỗi từ — đủ cho một đợt offline, không phình dòng. */
const SO_REF_GIU = 20;

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
      { error: moTaLoi(parsed.error) },
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

    // Hàng đợi offline gửi lại khi không biết server đã nhận hay chưa. Áp lần
    // hai sẽ đẩy SRS của từ này thừa một bậc, nên nhận ra khoá cũ thì trả về
    // nguyên trạng thái đang có, coi như thành công.
    if (body.clientRef && cur?.recentRefs.includes(body.clientRef)) {
      return NextResponse.json({
        progress: {
          wordKey: cur.wordKey,
          repCount: cur.repCount,
          intervalDays: cur.intervalDays,
          mastered: cur.mastered,
          wrongCount: cur.wrongCount,
          seenCount: cur.seenCount,
          lastReview: cur.lastReview,
          dueAt: cur.dueAt,
        },
        wasMastered: cur.mastered,
        daGhiTruocDo: true,
      });
    }

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

    const refMoi = body.clientRef
      ? [body.clientRef, ...(cur?.recentRefs ?? [])].slice(0, SO_REF_GIU)
      : cur?.recentRefs;

    const row = await prisma.vocabProgress.upsert({
      where: { userId_wordKey: { userId: gate.userId, wordKey } },
      create: {
        id: makeId("vp"),
        userId: gate.userId,
        wordKey,
        word,
        ...sau,
        ...(refMoi ? { recentRefs: refMoi } : {}),
      },
      update: { word, ...sau, ...(refMoi ? { recentRefs: refMoi } : {}) },
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
