import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { makeSlug } from "@/lib/vocab/deck";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const input = z.object({ enabled: z.boolean() });

/**
 * Bật/tắt chia sẻ công khai một bộ thẻ.
 *
 * Tắt rồi bật lại sẽ sinh slug MỚI: link cũ phải chết hẳn, nếu không thì "tắt
 * chia sẻ" chỉ là tạm ẩn — ai lưu link cũ vẫn vào được khi chủ bộ bật lại.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const deck = await prisma.vocabDeck.findFirst({
      where: { id, ownerId: gate.userId },
      select: { id: true, slug: true, visibility: true, cardCount: true },
    });
    if (!deck) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });

    if (!parsed.data.enabled) {
      const slugMoi = makeSlug();
      await prisma.vocabDeck.update({
        where: { id },
        data: { visibility: "private", slug: slugMoi },
      });
      return NextResponse.json({ visibility: "private", slug: null });
    }

    if (deck.cardCount === 0) {
      return NextResponse.json({ error: "Bộ chưa có thẻ nào để chia sẻ" }, { status: 400 });
    }

    await prisma.vocabDeck.update({ where: { id }, data: { visibility: "link" } });
    return NextResponse.json({ visibility: "link", slug: deck.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks/:id/share]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
