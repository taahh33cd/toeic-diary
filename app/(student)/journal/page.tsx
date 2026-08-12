import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { xpToNextLevel } from "@/lib/xp";
import DashboardClient from "./_dashboard-client";

export interface XpStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  xpCurrent: number;
  xpNext: number;
  xpPct: number;
}

/** Tóm tắt bài Speaking/Writing đã lưu — hiện trên tile sổ tay. */
export interface SwWorkStats {
  pending: number;
  graded: number;
  latest: { id: string; title: string; status: string } | null;
}

export default async function JournalDashboardPage() {
  let xpStats: XpStats | null = null;
  let swWork: SwWorkStats | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [submissions, latest] = await Promise.all([
        prisma.skillSubmission.groupBy({
          by: ["status"],
          where: { userId: user.id },
          _count: { _all: true },
        }),
        prisma.skillSubmission.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, status: true },
        }),
      ]);
      const countOf = (s: string) => submissions.find((g) => g.status === s)?._count._all ?? 0;
      swWork = { pending: countOf("submitted"), graded: countOf("graded"), latest };

      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { totalXp: true, level: true, currentStreak: true },
      });
      if (profile) {
        const { current, next, pct } = xpToNextLevel(profile.totalXp);
        xpStats = {
          totalXp: profile.totalXp,
          level: profile.level,
          currentStreak: profile.currentStreak,
          xpCurrent: current,
          xpNext: next,
          xpPct: pct,
        };
      }
    }
  } catch {
    // XP stats không ảnh hưởng đến page render
  }

  return <DashboardClient xpStats={xpStats} swWork={swWork} />;
}
