import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId, moTaLoi } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";
import { applyReview, emptyState, type SrsState } from "@/lib/vocab/srs";
import { recordXp, XP_RULES } from "@/lib/xp";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const item = z.object({
  word: z.string().trim().min(1).max(120),
  quizType: z.string().trim().max(40),
  correct: z.boolean(),
  answerMs: z.number().int().min(0).max(600_000).optional(),
  given: z.string().trim().max(200).optional(),
});

const input = z.object({
  deckId: z.string().trim().min(1).max(80),
  modes: z.array(z.string().trim().max(40)).max(10),
  runMode: z.enum(["practice", "exam"]).optional(),
  durationMs: z.number().int().min(0).max(24 * 3600_000).optional(),
  items: z.array(item).min(1).max(500),
});

/**
 * Ghi một lượt quiz: lưu phiên, lưu từng câu, rồi đẩy SRS cho từng TỪ.
 *
 * Client gửi lên kết quả đúng/sai và thời gian trả lời. Đây là tự khai — với
 * việc tự ôn thì không sao, gian lận chỉ hại chính người học. Bảng theo dõi
 * của giáo viên vì thế ghi rõ đây là bằng chứng luyện tập, không phải điểm thi.
 *
 * Một từ có thể xuất hiện nhiều câu (nhiều dạng); SRS áp lần lượt theo đúng
 * thứ tự trả lời, nên trả lời sai ở dạng nghe rồi đúng ở dạng chữ vẫn phản ánh
 * đúng diễn biến.
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
  const b = parsed.data;

  try {
    const deck = await prisma.vocabDeck.findFirst({
      where: {
        id: b.deckId,
        // Làm quiz được trên bộ của mình HOẶC bộ đang chia sẻ — học viên mở
        // link của bạn rồi làm quiz thì vẫn phải ghi được.
        OR: [{ ownerId: gate.userId }, { visibility: "link" }],
      },
      select: { id: true },
    });
    if (!deck) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });

    const sessionId = makeId("vs");
    const dung = b.items.filter((i) => i.correct).length;

    await prisma.vocabQuizSession.create({
      data: {
        id: sessionId,
        userId: gate.userId,
        deckId: b.deckId,
        modes: b.modes,
        runMode: b.runMode ?? "practice",
        total: b.items.length,
        correct: dung,
        durationMs: b.durationMs,
        finishedAt: new Date(),
        items: {
          create: b.items.map((i) => ({
            id: makeId("vi"),
            wordKey: normalizeWord(i.word),
            quizType: i.quizType,
            correct: i.correct,
            answerMs: i.answerMs,
            given: i.given,
          })),
        },
      },
    });

    // ── Đẩy SRS cho từng từ ──
    const theoTu = new Map<string, typeof b.items>();
    for (const i of b.items) {
      const k = normalizeWord(i.word);
      if (!theoTu.has(k)) theoTu.set(k, []);
      theoTu.get(k)!.push(i);
    }

    const hienCo = await prisma.vocabProgress.findMany({
      where: { userId: gate.userId, wordKey: { in: [...theoTu.keys()] } },
    });
    const bang = new Map(hienCo.map((p) => [p.wordKey, p]));
    let vuaThuoc = 0;

    for (const [wordKey, ds] of theoTu) {
      const cu = bang.get(wordKey);
      let st: SrsState = cu
        ? {
            repCount: cu.repCount,
            intervalDays: cu.intervalDays,
            ease: cu.ease,
            lapses: cu.lapses,
            seenCount: cu.seenCount,
            wrongCount: cu.wrongCount,
            mastered: cu.mastered,
            lastReview: cu.lastReview,
            dueAt: cu.dueAt,
          }
        : emptyState();

      for (const i of ds) {
        st = applyReview(st, {
          kind: "quiz",
          correct: i.correct,
          answerMs: i.answerMs,
          quizType: i.quizType,
        });
      }

      if (st.mastered && !(cu?.mastered ?? false)) vuaThuoc++;

      await prisma.vocabProgress.upsert({
        where: { userId_wordKey: { userId: gate.userId, wordKey } },
        create: { id: makeId("vp"), userId: gate.userId, wordKey, word: ds[0].word.trim(), ...st },
        update: { word: ds[0].word.trim(), ...st },
      });
    }

    // XP cộng ở SERVER, gộp một lần cho cả phiên: 18 câu mà gọi /api/xp/record
    // 18 lần thì vừa chậm vừa đẻ 18 dòng XpEvent cho một lượt học.
    let xp: Awaited<ReturnType<typeof recordXp>> | null = null;
    if (dung > 0) {
      const thuong = dung * XP_RULES.vocab_review + vuaThuoc * XP_RULES.vocab_master;
      xp = await recordXp(gate.userId, "vocab_review", thuong, {
        sessionId,
        deckId: b.deckId,
        correct: dung,
        total: b.items.length,
        newlyMastered: vuaThuoc,
      }).catch(() => null);
    }

    return NextResponse.json({
      sessionId,
      total: b.items.length,
      correct: dung,
      percent: Math.round((dung / b.items.length) * 100),
      newlyMastered: vuaThuoc,
      xp: xp ? { totalXp: xp.totalXp, level: xp.level, levelUp: xp.levelUp } : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/sessions POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
