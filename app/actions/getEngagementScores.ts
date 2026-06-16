"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export interface EngagementRow {
  userId: string;
  studentCode: string | null;
  displayName: string | null;
  score: number; // 0-100
  breakdown: {
    dictation: number;   // weeklyLessons clamped 0..40
    streak: number;      // streak/30 * 30 capped
    homework: number;    // weekly homework_submit count *10 capped
    vocab: number;       // weekly vocab_review count /5 capped
  };
}

const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d;
};

/**
 * Engagement score: weighted blend over the last 7 days.
 *   dictation 40%  (1pt per lesson, max 40)
 *   streak    30%  (longestStreak/30 * 30 capped)
 *   homework  20%  (10pt per submission, max 20)
 *   vocab     10%  (1pt per 5 reviews, max 10)
 *
 * Teacher sees it for students they manage; admin sees all students.
 */
export async function getEngagementScores(): Promise<EngagementRow[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const role = (user.app_metadata?.role as string | undefined) ?? "student";
  if (role !== "teacher" && role !== "admin") return [];

  const students = await prisma.profile.findMany({
    where: {
      role: "student",
      ...(role === "teacher" ? { teacherId: user.id } : {}),
    },
    select: {
      id: true,
      studentCode: true,
      displayName: true,
      currentStreak: true,
    },
  });
  if (students.length === 0) return [];

  const since = startOfWeek();
  const ids = students.map((s) => s.id);

  const [lessons, homeworkEvents, vocabEvents] = await Promise.all([
    prisma.userProgress.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: "completed", completedAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, source: "homework_submit", createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, source: "vocab_review", createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const lessonCount = new Map(lessons.map((r) => [r.userId, r._count._all]));
  const hwCount = new Map(homeworkEvents.map((r) => [r.userId, r._count._all]));
  const vocabCount = new Map(vocabEvents.map((r) => [r.userId, r._count._all]));

  return students
    .map((s): EngagementRow => {
      const dictation = Math.min(40, lessonCount.get(s.id) ?? 0);
      const streak = Math.min(30, ((s.currentStreak ?? 0) / 30) * 30);
      const homework = Math.min(20, (hwCount.get(s.id) ?? 0) * 10);
      const vocab = Math.min(10, Math.floor((vocabCount.get(s.id) ?? 0) / 5));
      const score = Math.round(dictation + streak + homework + vocab);
      return {
        userId: s.id,
        studentCode: s.studentCode,
        displayName: s.displayName,
        score,
        breakdown: { dictation, streak, homework, vocab },
      };
    })
    .sort((a, b) => b.score - a.score);
  } catch (err) {
    console.error("[getEngagementScores] DB error (check DATABASE_URL):", err instanceof Error ? err.message : err);
    return [];
  }
}
