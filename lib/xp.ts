/**
 * lib/xp.ts — XP, level, streak engine.
 *
 * recordXp() là single entry-point cho mọi action có thưởng XP.
 * Mọi callsite (dictation lesson, vocab review, mission, homework, test score…)
 * gọi vào đây — function lo việc:
 *   1. Insert XpEvent (audit log)
 *   2. Update Profile.totalXp + level
 *   3. Update streak dựa lastActiveDate
 *   4. Trigger streak milestone bonus nếu match
 *
 * Server-side only (uses Prisma).
 */

import { prisma } from "@/lib/db/prisma";

export type XpSource =
  | "dictation_lesson"
  | "dictation_high_score"
  | "dictation_perfect"
  | "vocab_review"
  | "vocab_master"
  | "mission_task"
  | "mission_day"
  | "homework_submit"
  | "test_score"
  | "daily_login"
  | "streak_7"
  | "streak_30"
  | "streak_100";

export const XP_RULES: Record<XpSource, number> = {
  dictation_lesson: 20,
  dictation_high_score: 10, // bonus on top of dictation_lesson when score >= 80
  dictation_perfect: 30,    // bonus on top when score === 100
  vocab_review: 2,
  vocab_master: 20,
  mission_task: 5,
  mission_day: 20,          // bonus when 100% done in a day
  homework_submit: 30,
  test_score: 15,
  daily_login: 5,
  streak_7: 50,
  streak_30: 200,
  streak_100: 1000,
};

// ─── Level curve ──────────────────────────────────────────────────────────────
// level = floor(sqrt(totalXp / 100)) + 1
// 1→100, 2→400, 3→900, 4→1600, 5→2500 …
export function calculateLevel(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

export function xpToNextLevel(totalXp: number): { current: number; next: number; pct: number } {
  const lvl = calculateLevel(totalXp);
  const currentFloor = (lvl - 1) ** 2 * 100;
  const nextFloor = lvl ** 2 * 100;
  const pct = Math.min(100, ((totalXp - currentFloor) / (nextFloor - currentFloor)) * 100);
  return { current: currentFloor, next: nextFloor, pct };
}

// ─── Streak helper ────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isYesterday(prev: Date, today: Date): boolean {
  const y = new Date(today);
  y.setUTCDate(today.getUTCDate() - 1);
  return isSameDay(prev, y);
}

const STREAK_MILESTONES: { days: number; source: XpSource }[] = [
  { days: 7, source: "streak_7" },
  { days: 30, source: "streak_30" },
  { days: 100, source: "streak_100" },
];

// ─── Public API ───────────────────────────────────────────────────────────────
export interface RecordXpResult {
  totalXp: number;
  level: number;
  levelUp: boolean;
  streak: number;
  streakBonus: { source: XpSource; xp: number } | null;
}

export async function recordXp(
  userId: string,
  source: XpSource,
  xp: number = XP_RULES[source],
  metadata?: Record<string, unknown>
): Promise<RecordXpResult> {
  const profileBefore = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      totalXp: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
    },
  });
  if (!profileBefore) throw new Error(`Profile not found: ${userId}`);

  const now = new Date();
  let nextStreak = profileBefore.currentStreak;
  const last = profileBefore.lastActiveDate;
  if (!last) {
    nextStreak = 1;
  } else if (isSameDay(last, now)) {
    // already counted today
  } else if (isYesterday(last, now)) {
    nextStreak = profileBefore.currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  const milestone = STREAK_MILESTONES.find(
    (m) => m.days === nextStreak && profileBefore.currentStreak < m.days
  );
  const streakBonusXp = milestone ? XP_RULES[milestone.source] : 0;
  const totalDelta = xp + streakBonusXp;
  const nextTotalXp = profileBefore.totalXp + totalDelta;
  const nextLevel = calculateLevel(nextTotalXp);
  const levelUp = nextLevel > profileBefore.level;
  const longestStreak = Math.max(profileBefore.longestStreak, nextStreak);

  await prisma.$transaction([
    prisma.xpEvent.create({
      data: { userId, source, xp, metadata: metadata as never },
    }),
    ...(milestone
      ? [
          prisma.xpEvent.create({
            data: {
              userId,
              source: milestone.source,
              xp: streakBonusXp,
              metadata: { streakDays: nextStreak } as never,
            },
          }),
        ]
      : []),
    prisma.profile.update({
      where: { id: userId },
      data: {
        totalXp: nextTotalXp,
        level: nextLevel,
        currentStreak: nextStreak,
        longestStreak,
        lastActiveDate: now,
      },
    }),
  ]);

  return {
    totalXp: nextTotalXp,
    level: nextLevel,
    levelUp,
    streak: nextStreak,
    streakBonus: milestone ? { source: milestone.source, xp: streakBonusXp } : null,
  };
}
