/**
 * lib/achievement-check.ts — server-side audit for which badges đã unlock.
 *
 * Stateless: tính từ dữ liệu thật (UserProgress, XpEvent, Profile).
 * Không lưu unlock state riêng — render UI có thể compute on-demand.
 * Một achievement gallery sẽ gọi `computeUnlocked(userId)` mỗi lần render.
 */

import { prisma } from "@/lib/db/prisma";

export interface UnlockedSet {
  ids: Set<string>;
  // For progress display: id → "23/100" hoặc "0/30 ngày"
  progress: Record<string, string>;
}

export async function computeUnlocked(userId: string): Promise<UnlockedSet> {
  const ids = new Set<string>();
  const progress: Record<string, string> = {};

  const [profile, completedAll, xpVocabReview, xpVocabMaster, xpHomework, xpTestScore, completedToday, partsHit] =
    await Promise.all([
      prisma.profile.findUnique({
        where: { id: userId },
        select: { longestStreak: true },
      }),
      prisma.userProgress.findMany({
        where: { userId, status: "completed" },
        select: { bestScore: true, lessonId: true, completedAt: true, lesson: { select: { partId: true } } },
      }),
      prisma.xpEvent.count({ where: { userId, source: "vocab_review" } }),
      prisma.xpEvent.count({ where: { userId, source: "vocab_master" } }),
      prisma.xpEvent.count({ where: { userId, source: "homework_submit" } }),
      prisma.xpEvent.count({ where: { userId, source: "test_score" } }),
      // count completed today
      (async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return prisma.userProgress.count({
          where: { userId, status: "completed", completedAt: { gte: start } },
        });
      })(),
      prisma.userProgress.findMany({
        where: { userId, status: "completed" },
        distinct: ["lessonId"],
        select: { lesson: { select: { partId: true } } },
      }),
    ]);

  const completedHi = completedAll.filter((c) => c.bestScore >= 70).length;
  const perfectCount = completedAll.filter((c) => c.bestScore === 100).length;
  const partsCovered = new Set(partsHit.map((p) => p.lesson.partId)).size;
  const longestStreak = profile?.longestStreak ?? 0;

  const check = (id: string, cond: boolean, prog?: string) => {
    if (cond) ids.add(id);
    if (prog) progress[id] = prog;
  };

  // Existing badges
  check("first_lesson", completedAll.length >= 1, `${completedAll.length}/1`);
  check("ten_lessons", completedHi >= 10, `${completedHi}/10`);
  check("fifty_lessons", completedHi >= 50, `${completedHi}/50`);
  check("hundred", completedHi >= 100, `${completedHi}/100`);
  check("streak7", longestStreak >= 7, `${longestStreak}/7`);
  check("streak30", longestStreak >= 30, `${longestStreak}/30`);
  check("perfect", perfectCount >= 1, `${perfectCount}/1`);
  // 4 dictation parts (1-4) — partsCovered counts unique partIds.
  // Approximate "all_parts" as ≥4 distinct parts hit.
  check("all_parts", partsCovered >= 4, `${partsCovered}/4`);
  check("speed_demon", completedToday >= 5, `${completedToday}/5`);

  // Journal expansion
  check("vocab_master", xpVocabReview >= 100, `${xpVocabReview}/100`);
  check("vocab_legend", xpVocabMaster >= 50, `${xpVocabMaster}/50`);
  check("marathon", longestStreak >= 30, `${longestStreak}/30`);
  check("centurion", longestStreak >= 100, `${longestStreak}/100`);
  check("homework_hero", xpHomework >= 20, `${xpHomework}/20`);
  check("test_taker", xpTestScore >= 10, `${xpTestScore}/10`);
  check("perfectionist", perfectCount >= 10, `${perfectCount}/10`);
  check(
    "polyglot",
    xpVocabReview >= 50 && completedAll.length >= 50,
    `${Math.min(xpVocabReview, 50)}+${Math.min(completedAll.length, 50)}/50+50`
  );

  return { ids, progress };
}
