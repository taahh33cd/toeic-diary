import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { bamViDu } from "@/lib/vocab/wordform";

export const dynamic = "force-dynamic";

/**
 * Bộ phương án "chọn dạng từ" cho một bộ thẻ.
 *
 * Lọc theo CẢ wordKey lẫn exampleHash: bộ phương án gắn với một câu ví dụ cụ
 * thể, mà học viên sửa được câu ví dụ trên thẻ của mình. Nếu chỉ lọc theo
 * wordKey thì sửa ví dụ xong đề bài vẫn là câu cũ — câu hỏi nói một đằng, thẻ
 * một nẻo. Lệch hash thì coi như chưa có, lần sinh sau sẽ soạn lại.
 */
export async function GET(req: Request) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const deckId = new URL(req.url).searchParams.get("deckId");
  if (!deckId) return NextResponse.json({ error: "Thiếu deckId" }, { status: 400 });

  try {
    const deck = await prisma.vocabDeck.findUnique({
      where: { id: deckId },
      select: { ownerId: true, visibility: true },
    });
    if (!deck) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    if (deck.ownerId !== gate.userId && deck.visibility === "private") {
      return NextResponse.json({ error: "Bộ thẻ này không mở" }, { status: 403 });
    }

    const cards = await prisma.vocabCard.findMany({
      where: { deckId, example: { not: null } },
      select: { wordKey: true, example: true },
    });
    if (cards.length === 0) return NextResponse.json({ forms: [] });

    const hopLe = new Map(cards.map((c) => [c.wordKey, bamViDu(c.example!)]));
    const rows = await prisma.vocabWordForm.findMany({
      where: { wordKey: { in: [...hopLe.keys()] }, status: "ok" },
      select: { id: true, wordKey: true, exampleHash: true, cloze: true, answer: true, distractors: true },
    });

    // exampleHash chỉ dùng để lọc ở đây, không gửi ra client
    const forms = rows
      .filter((r) => hopLe.get(r.wordKey) === r.exampleHash)
      .map((r) => ({
        id: r.id,
        wordKey: r.wordKey,
        cloze: r.cloze,
        answer: r.answer,
        distractors: r.distractors,
      }));

    return NextResponse.json({ forms });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/wordforms GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

const reportInput = z.object({
  id: z.string().min(1),
  note: z.string().trim().max(300).optional(),
});

/**
 * Học viên báo câu hỏi sai → TẮT NGAY cho mọi người.
 *
 * Không chờ thầy duyệt: dạng này do AI soạn, một câu hỏng dạy sai cả lớp mỗi
 * lần nó xuất hiện. Mất một câu rẻ hơn nhiều. Dòng vẫn nằm đó cho thầy xem
 * lại, và lần sinh sau sẽ không dựng lại đúng câu vừa bị bỏ.
 */
export async function POST(req: Request) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: z.infer<typeof reportInput>;
  try {
    body = reportInput.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  try {
    const co = await prisma.vocabWordForm.findUnique({
      where: { id: body.id },
      select: { id: true },
    });
    if (!co) return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });

    await prisma.vocabWordForm.update({
      where: { id: body.id },
      data: {
        status: "reported",
        reportCount: { increment: 1 },
        ...(body.note ? { reportNote: body.note } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/wordforms POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
