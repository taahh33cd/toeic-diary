/**
 * lib/roadmap/replan.ts — tái lập kế hoạch.
 *
 * Ba ngòi nổ, cùng một đường đi (plan-roadmap-ai.md §11):
 *   replan_weekly      — hết tuần: tổng kết rồi sinh tuần kế theo sức thật
 *   replan_after_test  — có điểm thi thử mới: vẽ lại mục tiêu, xếp lại tuần đang chạy
 *   manual             — học viên bấm "Tính lại", có hạn mức
 *
 * `replan_missed` (bỏ lỡ nhiều ngày) KHÔNG gọi AI và đi qua `replanWeek` với
 * điều chỉnh "lighten" — người đang đuối không cần lời văn mới, cần ít việc hơn.
 */

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

import { applyEnrichment, enrichPlan, isAiConfigured } from "./ai";
import { MANUAL_REPLAN_QUOTA_PER_MONTH } from "./config";
import { diagnose } from "./diagnose";
import { buildMonthGoals } from "./months";
import { planWeek } from "./planner";
import { buildReview, decideAdjustment, type Adjustment, type WeekReview } from "./review";
import { addDays, daysBetween, mondayOf, vnDateKey, vnToday } from "./vn-date";
import type { Intake, MonthGoal, PartScoreInput, WeaknessReport } from "./types";

export type ReplanTrigger = "replan_weekly" | "replan_after_test" | "replan_missed" | "manual";

export type ReplanResult =
  | {
      ok: true;
      weekIndex: number;
      adjustment: Adjustment;
      review: WeekReview | null;
      aiUsed: boolean;
      tasks: number;
    }
  | { ok: false; error: "no_plan" | "no_week" | "quota" | "plan_finished" };

// ─────────────────────────────────────────────────────────────────────────────
// Hạn mức AI cho nút "Tính lại"
// ─────────────────────────────────────────────────────────────────────────────

/** Số lần HV đã tự bấm tính lại (có gọi AI) trong 30 ngày qua. */
export async function manualReplanUsed(userId: string): Promise<number> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  return prisma.planEvent.count({
    where: { userId, type: "manual", aiCalledAt: { gte: since } },
  });
}

export async function manualReplanLeft(userId: string): Promise<number> {
  return Math.max(0, MANUAL_REPLAN_QUOTA_PER_MONTH - (await manualReplanUsed(userId)));
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sinh tuần kế tiếp.
 *
 * Luôn khoá tuần hiện tại lại trước (ghi `review`, chuyển `status` sang "done")
 * rồi mới sinh tuần mới — nếu không, chạy lại hàm này sẽ đẻ ra hai tuần cùng số.
 */
export async function replanWeek(
  userId: string,
  trigger: ReplanTrigger,
  opts: { allowAi?: boolean } = {},
): Promise<ReplanResult> {
  const plan = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    include: {
      weeks: {
        orderBy: { weekIndex: "desc" },
        // Lấy hai tuần: tuần cuối có thể là một tuần TƯƠNG LAI đã xếp sẵn (học
        // viên bấm "Tính lại" giữa tuần), khi đó tuần cần nhìn lại là tuần kế
        // trước đó.
        take: 2,
        include: { tasks: true },
      },
    },
  });
  if (!plan) return { ok: false, error: "no_plan" };

  const today0 = vnToday();
  /**
   * Tuần đã xếp sẵn cho tương lai, nếu có.
   *
   * Bấm "Tính lại" lần nữa phải XẾP LẠI tuần đó chứ không chồng thêm tuần mới:
   * không thì mỗi lần bấm lại đẻ một tuần, lịch trôi đi hàng tháng và học viên
   * chẳng thấy gì đổi vì trang chỉ hiện tuần sát nhất.
   */
  const future =
    plan.weeks[0] && vnDateKey(plan.weeks[0].startDate) > today0 ? plan.weeks[0] : null;
  const lastWeek = future ? plan.weeks[1] : plan.weeks[0];
  if (!lastWeek) return { ok: false, error: "no_week" };

  if (trigger === "manual") {
    const left = await manualReplanLeft(userId);
    if (left <= 0) return { ok: false, error: "quota" };
  }

  // ── Nhìn lại tuần vừa rồi ────────────────────────────────────────────────
  const review = buildReview(lastWeek.tasks);
  const adjustment =
    trigger === "replan_missed"
      ? {
          kind: "lighten" as const,
          minutesFactor: 2 / 3,
          bandBoost: 0,
          focusLimit: 1 as const,
          preferFoundation: true,
          reason: "Bạn nghỉ mấy hôm liền, nên lộ trình tự giảm tải để dễ quay lại nhịp.",
        }
      : decideAdjustment(review);

  const intake = plan.intake as unknown as Intake;
  const baseline = plan.baseline as unknown as BaselineJson;
  const current = (plan.current as unknown as BaselineJson | null) ?? baseline;

  const report = diagnoseFromJson(current, plan, intake);

  // Hết hạn lộ trình thì dừng hẳn, không đẻ thêm tuần.
  const deadline = plan.deadline ? vnDateKey(plan.deadline) : null;
  const nextStart = addDays(vnDateKey(lastWeek.endDate), 1);
  if (deadline && daysBetween(nextStart, deadline) < 0) {
    await prisma.studyPlan.update({
      where: { id: plan.id },
      data: { status: "completed" },
    });
    return { ok: false, error: "plan_finished" };
  }

  // ── Những gì đã học và đã giao ───────────────────────────────────────────
  const allTasks = await prisma.studyTask.findMany({
    where: { planId: plan.id },
    select: { catalogId: true, status: true },
  });
  const completed = new Set(
    allTasks.filter((t) => t.status === "done").map((t) => t.catalogId),
  );
  // Bài của tuần tương lai sắp bị thay không tính là "đã giao", để lần xếp này
  // được chọn lại nếu vẫn hợp.
  const futureIds = new Set(future?.tasks.map((t) => t.catalogId) ?? []);
  const used = new Set(
    allTasks.map((t) => t.catalogId).filter((id) => !futureIds.has(id)),
  );

  const months = (plan.monthGoals as unknown as MonthGoal[]) ?? [];
  // Xếp lại tuần tương lai thì giữ nguyên số tuần của nó.
  const weekIndex = future ? future.weekIndex : lastWeek.weekIndex + 1;
  const weekStart = future ? vnDateKey(future.startDate) : mondayOf(nextStart);

  let week = planWeek({
    report,
    intake: {
      ...intake,
      minutesPerDay: Math.max(10, Math.round(intake.minutesPerDay * adjustment.minutesFactor)),
      // Tuần mới bắt đầu từ thứ Hai, không còn bị cụt như tuần đầu.
      startDate: weekStart,
    },
    weekIndex,
    weekStart,
    completed,
    used,
    monthCheckpoint: isMonthBoundary(months, weekStart, addDays(weekStart, 6)),
    adjustment: {
      bandBoost: adjustment.bandBoost,
      focusLimit: adjustment.focusLimit,
      preferFoundation: adjustment.preferFoundation,
    },
  });

  // ── Lớp AI ───────────────────────────────────────────────────────────────
  let aiUsed = false;
  const wantAi = opts.allowAi !== false && isAiConfigured() && trigger !== "replan_missed";
  if (wantAi) {
    const enriched = await enrichPlan({
      report,
      week,
      months,
      intake: { minutesPerDay: intake.minutesPerDay, daysPerWeek: intake.daysPerWeek },
    });
    if (enriched.ok) {
      week = applyEnrichment(week, months, enriched.data, {
        daysPerWeek: intake.daysPerWeek,
      }).week;
      aiUsed = true;
    }
  }

  // Lý do điều chỉnh luôn được nối vào, dù AI có viết gì: học viên phải biết vì
  // sao tuần này khác tuần trước, nếu không việc "tự nhiên nhẹ đi" trông như lỗi.
  const goalText = `${week.goalText} ${adjustment.reason}`;

  const taskRows = week.days.flatMap((day) =>
    day.tasks.map((task, order) => ({
      planId: plan.id,
      userId,
      date: new Date(`${day.date}T00:00:00Z`),
      order,
      catalogId: task.catalogId,
      title: task.title,
      href: task.href,
      kind: task.kind,
      target: task.target as unknown as Prisma.InputJsonValue,
      estMinutes: task.estMinutes,
      priority: task.priority,
      status: "pending",
    })),
  );

  await prisma.$transaction(async (tx) => {
    // Tuần tương lai cũ bị xoá hẳn (tasks xoá theo cascade) — nó chưa ai làm.
    if (future) {
      await tx.studyWeek.delete({ where: { id: future.id } });
    } else {
      await tx.studyWeek.update({
        where: { id: lastWeek.id },
        data: { status: "done", review: review as unknown as Prisma.InputJsonValue },
      });
    }

    const created = await tx.studyWeek.create({
      data: {
        planId: plan.id,
        userId,
        weekIndex,
        startDate: new Date(`${week.startDate}T00:00:00Z`),
        endDate: new Date(`${week.endDate}T00:00:00Z`),
        theme: week.theme,
        goalText,
        targetMinutes: week.targetMinutes,
        status: "current",
      },
    });

    if (taskRows.length) {
      await tx.studyTask.createMany({
        data: taskRows.map((r) => ({ ...r, weekId: created.id })),
      });
    }

    await tx.studyPlan.update({
      where: { id: plan.id },
      data: { version: { increment: 1 } },
    });

    await tx.planEvent.create({
      data: {
        planId: plan.id,
        userId,
        type: trigger,
        payload: {
          weekIndex,
          adjustment: adjustment.kind,
          completionRate: Math.round(review.completionRate * 100),
          accuracy: review.accuracy === null ? null : Math.round(review.accuracy * 100),
          tasks: taskRows.length,
        } as unknown as Prisma.InputJsonValue,
        aiCalledAt: aiUsed ? new Date() : null,
      },
    });
  });

  return { ok: true, weekIndex, adjustment, review, aiUsed, tasks: taskRows.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Có điểm thi thử mới
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cập nhật mốc hiện tại và vẽ lại khung mục tiêu từ một lượt thi mới.
 *
 * KHÔNG xoá việc học viên đã làm: chỉ thay những việc còn `pending` của tuần
 * đang chạy, từ hôm nay trở đi. Xoá sạch rồi xếp lại thì công của họ bốc hơi.
 */
export async function replanAfterTest(
  userId: string,
  attemptId: string,
): Promise<ReplanResult> {
  const plan = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    include: { weeks: { orderBy: { weekIndex: "desc" }, take: 1, include: { tasks: true } } },
  });
  if (!plan) return { ok: false, error: "no_plan" };
  const week = plan.weeks[0];
  if (!week) return { ok: false, error: "no_week" };

  const attempt = await prisma.fullTestAttempt.findFirst({
    where: { id: attemptId, userId, status: "done" },
  });
  if (!attempt || attempt.total === null) return { ok: false, error: "no_week" };

  const parts = normalizePartScores(attempt.partScores);
  const currentJson: BaselineJson = {
    total: attempt.total,
    listening: attempt.listening,
    reading: attempt.reading,
    parts,
    attemptId: attempt.id,
  };

  const intake = plan.intake as unknown as Intake;
  const report = diagnoseFromJson(currentJson, plan, intake);
  const months = buildMonthGoals({
    report,
    startDate: intake.startDate,
    deadline: plan.deadline ? vnDateKey(plan.deadline) : null,
  });

  const today = vnToday();
  const stale = week.tasks.filter(
    (t) => t.status === "pending" && vnDateKey(t.date) >= today,
  );

  const allTasks = await prisma.studyTask.findMany({
    where: { planId: plan.id },
    select: { catalogId: true, status: true },
  });
  const completed = new Set(allTasks.filter((t) => t.status === "done").map((t) => t.catalogId));
  // Việc sắp bị thay thì không tính là "đã giao", để bài của chúng được chọn lại
  // nếu vẫn hợp — chỉ lần này thứ tự ưu tiên đã khác.
  const staleIds = new Set(stale.map((t) => t.catalogId));
  const used = new Set(
    allTasks.map((t) => t.catalogId).filter((id) => !staleIds.has(id)),
  );

  const fresh = planWeek({
    report,
    intake: { ...intake, startDate: today },
    weekIndex: week.weekIndex,
    weekStart: vnDateKey(week.startDate),
    completed,
    used,
  });

  const rows = fresh.days
    .filter((d) => d.date >= today)
    .flatMap((day) =>
      day.tasks.map((task, order) => ({
        planId: plan.id,
        weekId: week.id,
        userId,
        date: new Date(`${day.date}T00:00:00Z`),
        order,
        catalogId: task.catalogId,
        title: task.title,
        href: task.href,
        kind: task.kind,
        target: task.target as unknown as Prisma.InputJsonValue,
        estMinutes: task.estMinutes,
        priority: task.priority,
        status: "pending",
      })),
    );

  await prisma.$transaction(async (tx) => {
    if (stale.length) {
      await tx.studyTask.deleteMany({ where: { id: { in: stale.map((t) => t.id) } } });
    }
    if (rows.length) await tx.studyTask.createMany({ data: rows });

    await tx.studyPlan.update({
      where: { id: plan.id },
      data: {
        current: currentJson as unknown as Prisma.InputJsonValue,
        monthGoals: months as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });

    await tx.studyWeek.update({
      where: { id: week.id },
      data: {
        goalText: `${week.goalText} Lộ trình vừa được xếp lại theo điểm thi thử mới (${attempt.total}).`,
      },
    });

    await tx.planEvent.create({
      data: {
        planId: plan.id,
        userId,
        type: "replan_after_test",
        payload: {
          attemptId: attempt.id,
          total: attempt.total,
          replaced: stale.length,
          added: rows.length,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  });

  return {
    ok: true,
    weekIndex: week.weekIndex,
    adjustment: decideAdjustment(buildReview(week.tasks)),
    review: null,
    aiUsed: false,
    tasks: rows.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

type BaselineJson = {
  total: number;
  listening: number | null;
  reading: number | null;
  parts: PartScoreInput[];
  attemptId?: string;
};

function diagnoseFromJson(
  snapshot: BaselineJson,
  plan: { targetScore: number | null; deadline: Date | null },
  intake: Intake,
): WeaknessReport {
  return diagnose({
    partScores: snapshot.parts,
    total: snapshot.total,
    listening: snapshot.listening,
    reading: snapshot.reading,
    targetScore: plan.targetScore,
    deadline: plan.deadline ? vnDateKey(plan.deadline) : null,
    startDate: vnToday(),
    minutesPerDay: intake.minutesPerDay,
    daysPerWeek: intake.daysPerWeek,
  });
}

/** Tuần này có vắt qua mốc cuối tháng của lộ trình không. */
function isMonthBoundary(months: MonthGoal[], start: string, end: string): boolean {
  return months.some((m) => m.endDate >= start && m.endDate <= end);
}

function normalizePartScores(raw: unknown): PartScoreInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => r as { part?: number; correct?: number; gradable?: number })
    .filter(
      (r) =>
        typeof r.part === "number" &&
        r.part >= 1 &&
        r.part <= 7 &&
        typeof r.correct === "number" &&
        typeof r.gradable === "number" &&
        r.gradable > 0,
    )
    .map((r) => ({
      part: r.part as PartScoreInput["part"],
      correct: r.correct!,
      gradable: r.gradable!,
    }));
}
