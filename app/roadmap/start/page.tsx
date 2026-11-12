import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { canUseRoadmap, ROADMAP_CLOSED_MESSAGE } from "@/lib/roadmap/access";
import { findBaselineAttempt } from "@/lib/roadmap/persist";

import { StartClient } from "./_start-client";

export const metadata = { title: "Tạo lộ trình" };

export default async function RoadmapStartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/roadmap/start");

  const profile = await prisma.profile
    .findUnique({
      where: { id: user.id },
      select: { createdAt: true, roadmapEnabled: true },
    })
    .catch(() => null);

  if (!canUseRoadmap(profile)) {
    return (
      <p className="text-[var(--text-secondary)] leading-relaxed">
        {ROADMAP_CLOSED_MESSAGE}
      </p>
    );
  }

  // Đã có lộ trình rồi thì không vào lại form — muốn đổi thì dùng "Tính lại"
  // ở trang lộ trình (Phase 4).
  const existing = await prisma.studyPlan.findFirst({
    where: { userId: user.id, status: "active" },
    select: { id: true },
  });
  if (existing) redirect("/roadmap");

  const attempt = await findBaselineAttempt(user.id);
  const baseline =
    attempt && attempt.total !== null
      ? {
          attemptId: attempt.id,
          total: attempt.total,
          completedAt: attempt.completedAt?.toISOString() ?? null,
        }
      : null;

  return <StartClient baseline={baseline} />;
}
