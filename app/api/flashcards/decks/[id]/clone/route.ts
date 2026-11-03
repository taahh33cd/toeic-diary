import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeId, makeSlug } from "@/lib/vocab/deck";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Lấy một bộ về kho của mình.
 *
 * Nhân bản thành bộ RIÊNG chứ không trỏ tới bộ gốc: học viên sửa nghĩa, thêm
 * ảnh theo ý mình mà không đụng vào bộ của thầy, và thầy sửa bộ gốc cũng không
 * làm xáo trộn bản học viên đang dùng.
 *
 * TIẾN ĐỘ không cần chép: nó khoá theo word_key nên từ nào đã học rồi thì bản
 * sao hiện ngay số lần đã ôn, không bắt đầu lại từ 0.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  try {
    const goc = await prisma.vocabDeck.findFirst({
      where: {
        id,
        // Lấy được bộ trong thư viện, bộ đang chia sẻ link, hoặc bộ của chính mình
        OR: [
          { visibility: "library" },
          { visibility: "link" },
          { ownerId: gate.userId },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        part: true,
        ownerId: true,
        cards: {
          orderBy: { order: "asc" },
          select: {
            word: true, wordKey: true, ipa: true, pos: true, meaningVi: true,
            definition: true, example: true, imageUrl: true, audioUrl: true, order: true,
          },
        },
      },
    });
    if (!goc) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    if (goc.cards.length === 0) {
      return NextResponse.json({ error: "Bộ chưa có thẻ nào" }, { status: 400 });
    }

    const daCo = await prisma.vocabDeck.findFirst({
      where: { ownerId: gate.userId, clonedFrom: goc.id },
      select: { id: true },
    });
    if (daCo) {
      // Không lấy hai lần: trả về bản đã có để UI đưa thẳng tới đó.
      return NextResponse.json({ deckId: daCo.id, daCoSan: true });
    }

    const deck = await prisma.vocabDeck.create({
      data: {
        id: makeId("vd"),
        ownerId: gate.userId,
        title: goc.title,
        description: goc.description,
        slug: makeSlug(),
        visibility: "private",
        source: "manual",
        part: goc.part ?? undefined,
        clonedFrom: goc.id,
        cardCount: goc.cards.length,
        cards: {
          create: goc.cards.map((c, i) => ({ id: makeId("vc"), ...c, order: i })),
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ deckId: deck.id, daCoSan: false }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks/:id/clone]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
