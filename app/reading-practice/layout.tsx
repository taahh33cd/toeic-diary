import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ReadingBannerAndNav } from "@/components/reading/ReadingBannerAndNav";

export const dynamic = "force-dynamic";

export default async function ReadingPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/reading-practice");

  const [profile, attempts, totalPassages] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { displayName: true },
    }),
    prisma.readingAttempt.findMany({
      where: { userId: user.id },
      select: { passageId: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
    prisma.readingPassage.count(),
  ]);

  const completedCount = new Set(attempts.map((a) => a.passageId)).size;
  const streak = calcReadingStreak(attempts.map((a) => a.completedAt));
  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "bạn";

  return (
    <div
      className="theme-reading"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <ReadingBannerAndNav
        displayName={displayName}
        streak={streak}
        completedCount={completedCount}
        totalPassages={totalPassages}
      />

      {/* Children area: scrollable for landing/list pages,
          flex-fill for practice page (banner hidden = full height) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Count consecutive days (today or yesterday anchor) with ≥1 reading attempt */
function calcReadingStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const daySet = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  const days = Array.from(daySet).sort().reverse(); // newest first

  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  // Streak must start from today or yesterday
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diffMs = new Date(days[i - 1]).getTime() - new Date(days[i]).getTime();
    if (Math.round(diffMs / 86_400_000) === 1) streak++;
    else break;
  }
  return streak;
}
