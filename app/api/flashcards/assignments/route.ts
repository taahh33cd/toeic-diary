import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { makeId } from "@/lib/vocab/deck";

export const dynamic = "force-dynamic";

const input = z.object({
  deckId: z.string().trim().min(1).max(80),
  studentCode: z.string().trim().min(1).max(40),
  activity: z.enum(["study", "quiz"]).optional(),
  minScore: z.number().int().min(1).max(100).optional(),
  dueDate: z.string().trim().max(40).optional(),
  homeworkId: z.string().trim().max(80).optional(),
});

/** Giáo viên giao một bộ thẻ cho một học viên. */
export async function POST(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }
  const b = parsed.data;

  try {
    const deck = await prisma.vocabDeck.findFirst({
      where: { id: b.deckId, ownerId: gate.user!.id },
      select: { id: true, slug: true, visibility: true, cardCount: true },
    });
    if (!deck) return NextResponse.json({ error: "Không tìm thấy bộ thẻ" }, { status: 404 });
    if (deck.cardCount === 0) {
      return NextResponse.json({ error: "Bộ chưa có thẻ nào" }, { status: 400 });
    }
    // Giao bài thì học viên phải mở được link — bật chia sẻ luôn, khỏi bắt
    // giáo viên nhớ làm hai bước rồi giao nhầm bộ private.
    if (deck.visibility !== "link") {
      await prisma.vocabDeck.update({ where: { id: deck.id }, data: { visibility: "link" } });
    }

    const row = await prisma.vocabDeckAssignment.upsert({
      where: { deckId_studentCode: { deckId: b.deckId, studentCode: b.studentCode } },
      create: {
        id: makeId("va"),
        deckId: b.deckId,
        assignedBy: gate.user!.id,
        studentCode: b.studentCode,
        activity: b.activity ?? "study",
        minScore: b.minScore ?? 70,
        dueDate: b.dueDate ? new Date(b.dueDate) : null,
        homeworkId: b.homeworkId,
      },
      update: {
        activity: b.activity ?? "study",
        minScore: b.minScore ?? 70,
        dueDate: b.dueDate ? new Date(b.dueDate) : null,
        homeworkId: b.homeworkId,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: row.id, slug: deck.slug }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/assignments POST]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}

/**
 * Các bộ đã giao, kèm tiến độ của từng học viên.
 *
 * "Xong" hiện đo bằng tỷ lệ từ trong bộ mà học viên đã ôn ít nhất một lần —
 * đúng với chế độ Học (lật thẻ) đang có. Khi engine quiz xong sẽ đo bằng điểm
 * thật của phiên quiz.
 */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const studentCode = new URL(req.url).searchParams.get("studentCode");

  try {
    const rows = await prisma.vocabDeckAssignment.findMany({
      where: {
        assignedBy: gate.user!.id,
        ...(studentCode ? { studentCode } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        studentCode: true,
        activity: true,
        minScore: true,
        dueDate: true,
        createdAt: true,
        deck: { select: { id: true, title: true, slug: true, cardCount: true, cards: { select: { wordKey: true } } } },
      },
    });
    if (rows.length === 0) return NextResponse.json({ assignments: [] });

    const codes = [...new Set(rows.map((r) => r.studentCode))];
    const profiles = await prisma.profile.findMany({
      where: { studentCode: { in: codes } },
      select: { id: true, studentCode: true, displayName: true },
    });
    const theoMa = new Map(profiles.map((p) => [p.studentCode!, p]));

    const tienDo = await prisma.vocabProgress.findMany({
      where: { userId: { in: profiles.map((p) => p.id) }, repCount: { gt: 0 } },
      select: { userId: true, wordKey: true, mastered: true },
    });
    const theoUser = new Map<string, Set<string>>();
    const thuocTheoUser = new Map<string, Set<string>>();
    for (const t of tienDo) {
      if (!theoUser.has(t.userId)) theoUser.set(t.userId, new Set());
      theoUser.get(t.userId)!.add(t.wordKey);
      if (t.mastered) {
        if (!thuocTheoUser.has(t.userId)) thuocTheoUser.set(t.userId, new Set());
        thuocTheoUser.get(t.userId)!.add(t.wordKey);
      }
    }

    const assignments = rows.map((r) => {
      const p = theoMa.get(r.studentCode);
      const daOn = p ? (theoUser.get(p.id) ?? new Set<string>()) : new Set<string>();
      const daThuoc = p ? (thuocTheoUser.get(p.id) ?? new Set<string>()) : new Set<string>();
      const keys = r.deck.cards.map((c) => c.wordKey);
      const soDaOn = keys.filter((k) => daOn.has(k)).length;
      const soDaThuoc = keys.filter((k) => daThuoc.has(k)).length;
      const pct = keys.length > 0 ? Math.round((soDaOn / keys.length) * 100) : 0;

      return {
        id: r.id,
        studentCode: r.studentCode,
        studentName: p?.displayName ?? null,
        deckId: r.deck.id,
        deckTitle: r.deck.title,
        slug: r.deck.slug,
        cardCount: r.deck.cardCount,
        activity: r.activity,
        minScore: r.minScore,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
        reviewed: soDaOn,
        mastered: soDaThuoc,
        percent: pct,
        done: pct >= (r.minScore ?? 70),
      };
    });

    return NextResponse.json({ assignments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/assignments GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
