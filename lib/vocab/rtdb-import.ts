import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { makeId, makeSlug } from "./deck";
import { normalizeWord } from "./normalize";

/**
 * Nhập các từ bị kẹt ở RTDB `vocab/{studentCode}` vào Sổ từ vựng (Postgres).
 *
 * Vì sao có: sau khi kho từ chuyển sang Postgres, nút "Lưu vào Vocab" khi bôi
 * đen (và nút lưu ở phần giải thích Full test) vẫn ghi vào RTDB, nên từ học
 * viên lưu không hiện trong sổ. Hàm này chạy MỘT lần cho mỗi học viên, ở lần
 * đầu mở sổ sau khi sửa.
 *
 * Chỉ lấy mục tạo SAU lần chuyển dữ liệu (id dạng `v{timestamp}` mới hơn bộ
 * "migrated" sớm nhất): mục cũ hơn đã được chuyển rồi, nhập lại sẽ làm sống lại
 * từ mà học viên đã cố ý xoá khỏi sổ.
 *
 * Không bao giờ ném lỗi ra ngoài — trục trặc thì để lần sau thử lại.
 */
export async function nhapTuKhoCu(userId: string, studentCode: string | null): Promise<number> {
  if (!studentCode) return 0;
  try {
    if (await prisma.vocabRtdbSync.findUnique({ where: { userId } })) return 0;
    // Giữ chỗ trước để hai request song song không cùng nhập
    await prisma.vocabRtdbSync.create({ data: { userId, imported: 0 } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return 0;
    console.error("[rtdb-import] marker:", e instanceof Error ? e.message : String(e));
    return 0;
  }

  try {
    const snap = await getAdminDb().ref(`vocab/${studentCode}`).get();
    const val = (snap.exists() ? snap.val() : {}) as Record<
      string,
      { word?: string; vi?: string; ipa?: string; pos?: string; def?: string; example?: string }
    >;

    const migrated = await prisma.vocabDeck.findFirst({
      where: { ownerId: userId, source: "migrated" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const cutoff = migrated?.createdAt.getTime() ?? 0;

    const daCo = new Set(
      (
        await prisma.vocabCard.findMany({
          where: { deck: { ownerId: userId } },
          select: { wordKey: true },
        })
      ).map((c) => c.wordKey)
    );

    const moi = new Map<string, Prisma.VocabCardCreateManyInput>();
    for (const [id, v] of Object.entries(val)) {
      const ts = Number(id.replace(/^v/, ""));
      const word = v?.word?.trim();
      if (!word || !Number.isFinite(ts) || ts <= cutoff) continue;
      const wordKey = normalizeWord(word);
      if (daCo.has(wordKey) || moi.has(wordKey)) continue;
      moi.set(wordKey, {
        id: makeId("vc"),
        deckId: "",
        word,
        wordKey,
        meaningVi: v.vi || null,
        ipa: v.ipa || null,
        pos: v.pos || null,
        definition: v.def || null,
        example: v.example || null,
        sourceLabel: "Lưu khi bôi đen (trước đây)",
        order: 9999,
      });
    }

    if (moi.size === 0) return 0;

    let deck = await prisma.vocabDeck.findFirst({ where: { ownerId: userId, title: "Từ mới" }, select: { id: true } });
    if (!deck) {
      deck = await prisma.vocabDeck.create({
        data: { id: makeId("vd"), ownerId: userId, title: "Từ mới", description: "Từ tra & lưu nhanh", slug: makeSlug(), source: "manual", cardCount: 0 },
        select: { id: true },
      });
    }
    const deckId = deck.id;
    const { count } = await prisma.vocabCard.createMany({
      data: [...moi.values()].map((c) => ({ ...c, deckId })),
      skipDuplicates: true,
    });
    await prisma.$transaction([
      prisma.vocabDeck.update({ where: { id: deckId }, data: { cardCount: { increment: count } } }),
      prisma.vocabRtdbSync.update({ where: { userId }, data: { imported: count } }),
    ]);
    return count;
  } catch (e) {
    // Bỏ dấu giữ chỗ để lần mở sổ sau thử lại
    console.error("[rtdb-import]", e instanceof Error ? e.message : String(e));
    await prisma.vocabRtdbSync.delete({ where: { userId } }).catch(() => undefined);
    return 0;
  }
}
