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

export default async function JournalDashboardPage() {
  let xpStats: XpStats | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

  return <DashboardClient xpStats={xpStats} />;
}
