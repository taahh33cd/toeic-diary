import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId, makeSlug } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";

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
          createdAt: true,
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

    // Danh sách = HỢP của thẻ và tiến độ, không chỉ tiến độ:
    //  - từ vừa thêm chưa ôn lần nào thì chưa có dòng tiến độ, nhưng phải hiện
    //    ra ngay (nếu không, học viên thêm từ xong thấy nó biến mất)
    //  - từ còn tiến độ nhưng bộ chứa nó đã bị xoá cũng phải hiện, vì công ôn
    //    đã bỏ ra không mất theo bộ
    const tdTheoKey = new Map(progress.map((p) => [p.wordKey, p]));
    const moiKhoa = [
      ...progress.map((p) => p.wordKey),
      ...[...noiDung.keys()].filter((k) => !tdTheoKey.has(k)),
    ];

    const words = moiKhoa.map((wordKey) => {
      const p = tdTheoKey.get(wordKey);
      const c = noiDung.get(wordKey);
      return {
        wordKey,
        word: c?.word ?? p!.word,
        ipa: c?.ipa ?? null,
        pos: c?.pos ?? null,
        meaningVi: c?.meaningVi ?? null,
        definition: c?.definition ?? null,
        example: c?.example ?? null,
        imageUrl: c?.imageUrl ?? null,
        audioUrl: c?.audioUrl ?? null,
        part: c?.deck.part ?? null,
        addedDate: (c?.createdAt ?? p!.createdAt).toISOString().slice(0, 10),
        deckIds: deckIds.get(wordKey) ?? [],
        // Chưa ôn lần nào → tiến độ 0 và dueAt null, tức đến hạn ngay.
        repCount: p?.repCount ?? 0,
        intervalDays: p?.intervalDays ?? 0,
        mastered: p?.mastered ?? false,
        wrongCount: p?.wrongCount ?? 0,
        seenCount: p?.seenCount ?? 0,
        lastReview: p?.lastReview ?? null,
        dueAt: p?.dueAt ?? null,
      };
    });

    return NextResponse.json({ words });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/words GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const quickAdd = z.object({
  word: z.string().trim().min(1).max(120),
  vi: z.string().trim().max(300).optional(),
  ipa: z.string().trim().max(120).optional(),
  pos: z.string().trim().max(20).optional(),
  def: z.string().trim().max(1000).optional(),
  example: z.string().trim().max(1000).optional(),
  audioUrl: z.string().trim().url().max(600).optional(),
  part: z.number().int().min(1).max(7).optional(),
});

/**
 * Thêm nhanh MỘT từ, không cần chọn bộ trước.
 *
 * Từ được bỏ vào bộ "Từ vựng Part N" của học viên, tạo mới nếu chưa có — đúng
 * cách kho từ cũ gom theo Part, nên thói quen thêm từ lẻ không đổi. Từ không
 * có Part vào bộ "Từ vựng khác".
 */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = quickAdd.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }
  const b = parsed.data;
  const word = b.word.trim();
  const wordKey = normalizeWord(word);
  const part = b.part ?? null;
  const tieuDe = part === null ? "Từ vựng khác" : `Từ vựng Part ${part}`;

  try {
    let deck = await prisma.vocabDeck.findFirst({
      where: { ownerId: gate.userId, title: tieuDe },
      select: { id: true },
    });
    if (!deck) {
      deck = await prisma.vocabDeck.create({
        data: {
          id: makeId("vd"),
          ownerId: gate.userId,
          title: tieuDe,
          description: "Từ thêm lẻ",
          slug: makeSlug(),
          part: part ?? undefined,
          source: "manual",
          cardCount: 0,
        },
        select: { id: true },
      });
    }

    const daCo = await prisma.vocabCard.findUnique({
      where: { deckId_wordKey: { deckId: deck.id, wordKey } },
      select: { id: true },
    });
    if (daCo) {
      return NextResponse.json({ error: `"${word}" đã có trong ${tieuDe}` }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.vocabCard.create({
        data: {
          id: makeId("vc"),
          deckId: deck.id,
          word,
          wordKey,
          ipa: b.ipa,
          pos: b.pos,
          meaningVi: b.vi,
          definition: b.def,
          example: b.example,
          audioUrl: b.audioUrl,
          order: 9999, // xuống cuối; thứ tự chỉ quan trọng khi soạn bộ
        },
      }),
      prisma.vocabDeck.update({
        where: { id: deck.id },
        data: { cardCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true, deckId: deck.id, deckTitle: tieuDe }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/words POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

/**
 * Xoá hẳn một từ: gỡ khỏi MỌI bộ của mình và xoá luôn tiến độ ôn.
 *
 * Khác với xoá bộ (giữ tiến độ): ở đây học viên nói "tôi không học từ này
 * nữa", nên giữ lại tiến độ chỉ làm số liệu nhiễu.
 */
export async function DELETE(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const raw = new URL(req.url).searchParams.get("word");
  if (!raw) return NextResponse.json({ error: "Thiếu tham số word" }, { status: 400 });
  const wordKey = normalizeWord(raw);

  try {
    const cards = await prisma.vocabCard.findMany({
      where: { wordKey, deck: { ownerId: gate.userId } },
      select: { id: true, deckId: true },
    });

    await prisma.$transaction([
      prisma.vocabCard.deleteMany({ where: { id: { in: cards.map((c) => c.id) } } }),
      ...[...new Set(cards.map((c) => c.deckId))].map((deckId) =>
        prisma.vocabDeck.update({
          where: { id: deckId },
          data: { cardCount: { decrement: cards.filter((c) => c.deckId === deckId).length } },
        })
      ),
      prisma.vocabProgress.deleteMany({ where: { userId: gate.userId, wordKey } }),
    ]);

    return NextResponse.json({ ok: true, removed: cards.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/words DELETE]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
