import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { deckPatchInput } from "@/lib/vocab/deck";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Chi tiết một bộ — kèm thẻ và tiến độ ôn của chính người gọi.
 *
 * Tiến độ nối theo word_key chứ không theo card id, nên một từ học ở bộ khác
 * vẫn hiện đúng số lần đã ôn ở đây.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  try {
    const deck = await prisma.vocabDeck.findFirst({
      // Lọc luôn theo ownerId: bộ của người khác trả 404, không hé ra là nó tồn tại.
      where: { id, ownerId: gate.userId },
      include: { cards: { orderBy: { order: "asc" } } },
    });
    if (!deck) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });

    const progress = await prisma.vocabProgress.findMany({
      where: { userId: gate.userId, wordKey: { in: deck.cards.map((c) => c.wordKey) } },
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

    return NextResponse.json({ deck, progress });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks/:id GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

/** Sửa tiêu đề / mô tả / Part. Nội dung thẻ sửa ở route cards. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = deckPatchInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const { count } = await prisma.vocabDeck.updateMany({
      where: { id, ownerId: gate.userId },
      data: parsed.data,
    });
    if (count === 0) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks/:id PATCH]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

/**
 * Xoá bộ. Thẻ xoá theo (cascade), nhưng TIẾN ĐỘ ôn thì giữ: nó thuộc về từ chứ
 * không thuộc về bộ, nên xoá bộ không được làm học viên mất công ôn đã bỏ ra.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  try {
    const { count } = await prisma.vocabDeck.deleteMany({
      where: { id, ownerId: gate.userId },
    });
    if (count === 0) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks/:id DELETE]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
