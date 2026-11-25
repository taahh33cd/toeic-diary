import { NextResponse, after, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";
import { LEVEL_BATCH, levelsFor, tagLevels, type Level } from "@/lib/vocab/lexicon";

export const dynamic = "force-dynamic";

/**
 * Thư viện bộ mẫu: các bộ giáo viên đã đăng công khai cho cả trung tâm.
 *
 * Kèm hai thứ học viên cần để quyết định có lấy về không:
 *   - đã lấy về chưa (clonedFrom trỏ về bộ này)
 *   - trong bộ có bao nhiêu từ mình ĐÃ học rồi, vì tiến độ gắn theo từ nên
 *     lấy bộ về không phải bắt đầu lại từ đầu
 */
export async function GET(req: NextRequest) {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const part = new URL(req.url).searchParams.get("part");
  const soPart = part ? Number(part) : null;

  try {
    const decks = await prisma.vocabDeck.findMany({
      where: {
        visibility: "library",
        ...(soPart && soPart >= 1 && soPart <= 7 ? { part: soPart } : {}),
      },
      orderBy: [{ part: "asc" }, { updatedAt: "desc" }],
      take: 60,
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        part: true,
        cardCount: true,
        updatedAt: true,
        owner: { select: { displayName: true } },
        cards: { select: { wordKey: true, word: true } },
      },
    });
    if (decks.length === 0) return NextResponse.json({ decks: [] });

    const moiKhoa = [...new Set(decks.flatMap((d) => d.cards.map((c) => c.wordKey)))];
    const [daHoc, daLay] = await Promise.all([
      prisma.vocabProgress.findMany({
        where: { userId: gate.userId, wordKey: { in: moiKhoa }, repCount: { gt: 0 } },
        select: { wordKey: true },
      }),
      prisma.vocabDeck.findMany({
        where: { ownerId: gate.userId, clonedFrom: { in: decks.map((d) => d.id) } },
        select: { id: true, clonedFrom: true },
      }),
    ]);
    const tapDaHoc = new Set(daHoc.map((p) => p.wordKey));

    // Cấp của bộ = cấp chiếm nhiều nhất trong các từ đã gắn cấp.
    const capTu = await levelsFor(moiKhoa);
    const capBo = (keys: string[]): Level | null => {
      const dem = new Map<Level, number>();
      for (const k of keys) if (capTu[k]) dem.set(capTu[k], (dem.get(capTu[k]) ?? 0) + 1);
      return [...dem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    };
    // Từ chưa có cấp: gắn sau khi trả lời để lần mở sau thư viện lọc được theo cấp
    const thieuCap = decks.flatMap((d) => d.cards).filter((c) => !capTu[c.wordKey]).map((c) => c.word);
    if (thieuCap.length) {
      const userId = gate.userId;
      after(() => tagLevels([...new Set(thieuCap)].slice(0, LEVEL_BATCH), userId).catch(() => undefined));
    }
    const banSao = new Map(daLay.map((d) => [d.clonedFrom!, d.id]));

    return NextResponse.json({
      decks: decks.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        slug: d.slug,
        part: d.part,
        cardCount: d.cardCount,
        tacGia: d.owner.displayName,
        capNhat: d.updatedAt,
        level: capBo(d.cards.map((c) => c.wordKey)),
        daHocTrongBo: d.cards.filter((c) => tapDaHoc.has(c.wordKey)).length,
        banSaoCuaToi: banSao.get(d.id) ?? null,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/library]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
