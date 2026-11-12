import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { canUseRoadmap } from "@/lib/roadmap/access";
import { BASELINE_MAX_AGE_DAYS } from "@/lib/roadmap/config";
import { findBaselineAttempt } from "@/lib/roadmap/persist";
import { vnDateKey } from "@/lib/roadmap/vn-date";

/**
 * GET /api/roadmap — trạng thái lộ trình của người đang đăng nhập.
 *
 * Trả về một trong ba trạng thái, để client biết hiển thị gì mà không phải đoán:
 *   closed       — chưa mở cho tài khoản này
 *   needs_test   — có quyền nhưng chưa có lộ trình và chưa có bài test dùng được
 *   has_baseline — chưa có lộ trình, nhưng có lượt thi gần đây dùng luôn được
 *   active       — đã có lộ trình
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile
    .findUnique({
      where: { id: user.id },
      select: { createdAt: true, roadmapEnabled: true },
    })
    .catch(() => null);

  if (!canUseRoadmap(profile)) {
    return NextResponse.json({ state: "closed" as const });
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id, status: "active" },
    include: {
      weeks: {
        orderBy: { weekIndex: "asc" },
        include: { tasks: { orderBy: [{ date: "asc" }, { order: "asc" }] } },
      },
    },
  });

  if (!plan) {
    const attempt = await findBaselineAttempt(user.id);
    if (!attempt || attempt.total === null) {
      return NextResponse.json({ state: "needs_test" as const });
    }
    return NextResponse.json({
      state: "has_baseline" as const,
      baseline: {
        attemptId: attempt.id,
        testSlug: attempt.testSlug,
        total: attempt.total,
        listening: attempt.listening,
        reading: attempt.reading,
        completedAt: attempt.completedAt,
        maxAgeDays: BASELINE_MAX_AGE_DAYS,
      },
    });
  }

  return NextResponse.json({
    state: "active" as const,
    plan: {
      id: plan.id,
      baseline: plan.baseline,
      current: plan.current,
      intake: plan.intake,
      targetScore: plan.targetScore,
      deadline: plan.deadline ? vnDateKey(plan.deadline) : null,
      monthGoals: plan.monthGoals,
      createdAt: plan.createdAt,
    },
    weeks: plan.weeks.map((w) => ({
      id: w.id,
      weekIndex: w.weekIndex,
      startDate: vnDateKey(w.startDate),
      endDate: vnDateKey(w.endDate),
      theme: w.theme,
      goalText: w.goalText,
      targetMinutes: w.targetMinutes,
      status: w.status,
      tasks: w.tasks.map((t) => ({
        id: t.id,
        date: vnDateKey(t.date),
        order: t.order,
        catalogId: t.catalogId,
        title: t.title,
        href: t.href,
        kind: t.kind,
        estMinutes: t.estMinutes,
        priority: t.priority,
        status: t.status,
      })),
    })),
  });
}
