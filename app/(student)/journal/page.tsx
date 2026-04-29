import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { xpToNextLevel } from "@/lib/xp";
import { DictationWidget } from "@/components/journal/DictationWidget";
import { SuggestionsWidget } from "@/components/journal/SuggestionsWidget";
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

  return (
    <div className="space-y-6">
      <DashboardClient xpStats={xpStats} />
      <Suspense fallback={<DictationWidgetSkeleton />}>
        <DictationWidget />
      </Suspense>
      <Suspense fallback={null}>
        <SuggestionsWidget />
      </Suspense>
    </div>
  );
}

function DictationWidgetSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <div className="h-4 w-32 mb-4 rounded" style={{ background: "var(--border)" }} />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg" style={{ background: "var(--border)" }} />
        ))}
      </div>
    </div>
  );
}
