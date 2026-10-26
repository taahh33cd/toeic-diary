import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireVocabUser } from "@/lib/vocab/guard";

export const dynamic = "force-dynamic";

/**
 * Số từ đến hạn ôn của chính mình — nguồn duy nhất cho badge nav và dashboard.
 *
 * Trước đây mỗi nơi tải cả kho từ về rồi tự tính, nên badge và trang lệch nhau.
 * Giờ là một câu COUNT trên index (user_id, due_at); đếm theo TỪ nên từ trùng
 * giữa các bộ không bị đếm hai lần.
 */
export async function GET() {
  const gate = await requireVocabUser();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const now = new Date();
    const [dueCount, total, mastered, lastReviewed] = await Promise.all([
      prisma.vocabProgress.count({
        where: { userId: gate.userId, mastered: false, OR: [{ dueAt: null }, { dueAt: { lte: now } }] },
      }),
      prisma.vocabProgress.count({ where: { userId: gate.userId } }),
      prisma.vocabProgress.count({ where: { userId: gate.userId, mastered: true } }),
      prisma.vocabProgress.findFirst({
        where: { userId: gate.userId, lastReview: { not: null } },
        orderBy: { lastReview: "desc" },
        select: { lastReview: true },
      }),
    ]);

    // Dấu nhắc nhẹ: không còn từ nào đến hạn nhưng đã 3 ngày không ôn.
    // Quyết ở server vì ở đây có "bây giờ" đáng tin, và để client chỉ việc đọc
    // — eslint react-hooks/purity chặn gọi Date.now() trong thân hook.
    const remind =
      dueCount === 0 &&
      total > 0 &&
      (!lastReviewed?.lastReview ||
        lastReviewed.lastReview.getTime() < now.getTime() - 3 * 86_400_000);

    return NextResponse.json({
      dueCount,
      total,
      mastered,
      remind,
      lastReview: lastReviewed?.lastReview ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[flashcards/due GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
