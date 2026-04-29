"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export interface DictationStats {
  todayLessons: number;
  weekLessons: number;
  totalLessons: number;
  avgScore: number;
  currentStreak: number;
  totalXp: number;
  level: number;
  recentLessons: { id: string; title: string; score: number; date: string }[];
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export async function getDictationStats(): Promise<DictationStats | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const [profile, todayCount, weekCount, totalCompleted, recent] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { totalXp: true, level: true, currentStreak: true },
    }),
    prisma.userProgress.count({
      where: { userId: user.id, status: "completed", completedAt: { gte: today } },
    }),
    prisma.userProgress.count({
      where: { userId: user.id, status: "completed", completedAt: { gte: weekAgo } },
    }),
    prisma.userProgress.findMany({
      where: { userId: user.id, status: "completed" },
      select: { bestScore: true },
    }),
    prisma.userProgress.findMany({
      where: { userId: user.id, status: "completed" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        lessonId: true,
        bestScore: true,
        completedAt: true,
        lesson: { select: { id: true, title: true } },
      },
    }),
  ]);

  const totalLessons = totalCompleted.length;
  const avgScore =
    totalLessons > 0
      ? Math.round(
          totalCompleted.reduce((sum, p) => sum + p.bestScore, 0) / totalLessons
        )
      : 0;

  return {
    todayLessons: todayCount,
    weekLessons: weekCount,
    totalLessons,
    avgScore,
    currentStreak: profile?.currentStreak ?? 0,
    totalXp: profile?.totalXp ?? 0,
    level: profile?.level ?? 1,
    recentLessons: recent.map((r) => ({
      id: r.lesson.id,
      title: r.lesson.title,
      score: r.bestScore,
      date: r.completedAt?.toISOString() ?? "",
    })),
  };
}
