import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId, makeSlug, moTaLoi } from "@/lib/vocab/deck";
import { normalizeWord } from "@/lib/vocab/normalize";
import { nhapTuKhoCu } from "@/lib/vocab/rtdb-import";

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
    // Từ lưu bằng bôi đen trước đây bị ghi nhầm vào RTDB — nhập một lần rồi thôi.
    await nhapTuKhoCu(gate.userId, gate.studentCode);

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
          context: true,
          sourceUrl: true,
          sourceLabel: true,
          createdAt: true,
          deck: { select: { part: true } },
        },
      }),
    ]);

    const noiDung = new Map<string, (typeof cards)[number]>();
    const nguCanh = new Map<string, (typeof cards)[number]>();
    const deckIds = new Map<string, string[]>();
    for (const c of cards) {
      if (!noiDung.has(c.wordKey)) noiDung.set(c.wordKey, c);
      if ((c.context || c.sourceLabel) && !nguCanh.has(c.wordKey)) nguCanh.set(c.wordKey, c);
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

    // Cấp độ TOEIC nằm ở từ điển dùng chung, không nằm trên thẻ
    const lex = await prisma.vocabLexicon.findMany({
      where: { wordKey: { in: moiKhoa }, level: { not: null } },
      select: { wordKey: true, level: true },
    });
    const capTheoKey = new Map(lex.map((l) => [l.wordKey, l.level]));

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
        context: nguCanh.get(wordKey)?.context ?? null,
        sourceUrl: nguCanh.get(wordKey)?.sourceUrl ?? null,
        sourceLabel: nguCanh.get(wordKey)?.sourceLabel ?? null,
        part: c?.deck.part ?? null,
        level: capTheoKey.get(wordKey) ?? null,
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
  /** Bộ đích do học viên chọn. Bỏ trống = theo Part, không Part = "Từ mới". */
  deckId: z.string().trim().min(1).max(60).optional(),
  /** Câu gốc chứa từ (lưu bằng bôi đen) */
  context: z.string().trim().max(400).optional(),
  /** Chỉ nhận đường dẫn nội bộ — không lưu link ra ngoài */
  sourceUrl: z.string().trim().max(300).regex(/^\/(?!\/)/, "sourceUrl phải là đường dẫn nội bộ").optional(),
  sourceLabel: z.string().trim().max(120).optional(),
});

/**
 * Thêm nhanh MỘT từ.
 *
 * Có deckId thì vào đúng bộ đó (phải là bộ của mình). Không thì vào bộ
 * "Từ vựng Part N" nếu có Part, hoặc bộ mặc định "Từ mới" — tạo mới nếu chưa có.
 */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = quickAdd.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: moTaLoi(parsed.error) },
      { status: 400 }
    );
  }
  const b = parsed.data;
  const word = b.word.trim();
  const wordKey = normalizeWord(word);
  const part = b.part ?? null;
  let tieuDe = part === null ? "Từ mới" : `Từ vựng Part ${part}`;

  try {
    let deck: { id: string } | null;
    if (b.deckId) {
      const chon = await prisma.vocabDeck.findFirst({
        where: { id: b.deckId, ownerId: gate.userId },
        select: { id: true, title: true },
      });
      if (!chon) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
      deck = { id: chon.id };
      tieuDe = chon.title;
    } else {
      deck = await prisma.vocabDeck.findFirst({
        where: { ownerId: gate.userId, title: tieuDe },
        select: { id: true },
      });
    }
    if (!deck) {
      deck = await prisma.vocabDeck.create({
        data: {
          id: makeId("vd"),
          ownerId: gate.userId,
          title: tieuDe,
          description: part === null ? "Từ tra & lưu nhanh" : "Từ thêm lẻ",
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
          context: b.context,
          sourceUrl: b.sourceUrl,
          sourceLabel: b.sourceLabel,
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
