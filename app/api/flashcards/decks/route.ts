import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { deckCreateInput, makeId, makeSlug, prepareCards, moTaLoi } from "@/lib/vocab/deck";

export const dynamic = "force-dynamic";

/** Danh sách bộ thẻ của chính mình, mới sửa trước. */
export async function GET() {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const decks = await prisma.vocabDeck.findMany({
      where: { ownerId: gate.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        visibility: true,
        source: true,
        part: true,
        cardCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ decks });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

/** Tạo bộ mới, kèm thẻ luôn nếu có. */
export async function POST(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = deckCreateInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: moTaLoi(parsed.error) },
      { status: 400 }
    );
  }
  const body = parsed.data;

  try {
    const { rows, duplicates } = prepareCards(body.cards ?? []);

    const deck = await prisma.vocabDeck.create({
      data: {
        id: makeId("vd"),
        ownerId: gate.userId,
        title: body.title,
        description: body.description,
        slug: makeSlug(),
        part: body.part,
        source: body.source ?? "manual",
        sourceRef: body.sourceRef,
        cardCount: rows.length,
        cards: { create: rows },
      },
      select: { id: true, title: true, slug: true, cardCount: true },
    });

    return NextResponse.json({ deck, duplicates }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/decks POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
