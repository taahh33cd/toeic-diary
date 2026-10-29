import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { cardInput, prepareCards, moTaLoi } from "@/lib/vocab/deck";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const putInput = z.object({
  cards: z.array(cardInput).max(500, "Một bộ tối đa 500 thẻ"),
});

/**
 * Thay trọn danh sách thẻ của một bộ.
 *
 * Màn soạn bộ cho sửa/xoá/đổi thứ tự nhiều thẻ cùng lúc, nên gửi cả danh sách
 * một lần đơn giản và đúng hơn là PATCH từng thẻ: không phải đồng bộ thứ tự,
 * không có trạng thái nửa vời khi mạng rớt giữa chừng.
 *
 * Tiến độ ôn KHÔNG bị ảnh hưởng — nó khoá theo word_key, nên xoá rồi thêm lại
 * cùng một từ thì số lần đã ôn vẫn còn.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = putInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: moTaLoi(parsed.error) },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const owned = await prisma.vocabDeck.findFirst({
      where: { id, ownerId: gate.userId },
      select: { id: true },
    });
    if (!owned) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });

    const { rows, duplicates } = prepareCards(parsed.data.cards);

    await prisma.$transaction([
      prisma.vocabCard.deleteMany({ where: { deckId: id } }),
      prisma.vocabCard.createMany({ data: rows.map((r) => ({ ...r, deckId: id })) }),
      prisma.vocabDeck.update({ where: { id }, data: { cardCount: rows.length } }),
    ]);

    return NextResponse.json({ ok: true, cardCount: rows.length, duplicates });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks/:id/cards PUT]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
