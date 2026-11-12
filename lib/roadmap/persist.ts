/**
 * lib/roadmap/persist.ts — ghép mọi lớp lại và ghi xuống DB.
 *
 * Đường đi: FullTestAttempt → diagnose → planWeek + buildMonthGoals → (AI) →
 * StudyPlan + StudyWeek + StudyTask[] + PlanEvent.
 *
 * Chỉ file này chạm Prisma; diagnose/planner/ai đều thuần, kiểm chứng được bằng
 * script mà không cần DB.
 */

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

import { applyEnrichment, enrichPlan, isAiConfigured } from "./ai";
import { BASELINE_MAX_AGE_DAYS } from "./config";
import { diagnose } from "./diagnose";
import { buildMonthGoals } from "./months";
import { planWeek } from "./planner";
import { mondayOf, vnDateKey, vnToday } from "./vn-date";
import type {
  DraftWeek,
  Intake,
  MonthGoal,
  PartScoreInput,
  WeaknessReport,
} from "./types";

export type GenerateInput = {
  userId: string;
  intake: Intake;
  targetScore?: number | null;
  /** "YYYY-MM-DD" */
  deadline?: string | null;
  /** Chỉ định lượt thi làm baseline; bỏ trống thì lấy lượt mới nhất hợp lệ. */
  attemptId?: string;
};

export type GenerateResult =
  | {
      ok: true;
      planId: string;
      report: WeaknessReport;
      week: DraftWeek;
      months: MonthGoal[];
      aiUsed: boolean;
      /** Lý do không dùng được AI, nếu có — để hiện ở trang admin, không cho HV. */
      aiReason?: string;
      /** true = lộ trình đã có sẵn, không tạo mới. */
      reused: boolean;
    }
  | { ok: false; error: "no_baseline" | "incomplete_baseline" };

/**
 * Lượt thi dùng được làm baseline: đã nộp, chấm đủ 7 part, và chưa quá cũ.
 *
 * Đòi `total !== null` là đòi đúng điều kiện "làm đủ 7 part" — engine chấm chỉ
 * quy đổi thang ETS khi đủ cả 7 (xem lib/full-tests/scoring.ts), nên bài làm nửa
 * chừng không bao giờ lọt vào đây.
 */
export async function findBaselineAttempt(userId: string, attemptId?: string) {
  if (attemptId) {
    const a = await prisma.fullTestAttempt.findFirst({
      where: { id: attemptId, userId, status: "done" },
    });
    return a;
  }
  const cutoff = new Date(Date.now() - BASELINE_MAX_AGE_DAYS * 86_400_000);
  return prisma.fullTestAttempt.findFirst({
    where: {
      userId,
      status: "done",
      total: { not: null },
      completedAt: { gte: cutoff },
    },
    orderBy: { completedAt: "desc" },
  });
}

export async function generatePlan(input: GenerateInput): Promise<GenerateResult> {
  const attempt = await findBaselineAttempt(input.userId, input.attemptId);
  if (!attempt) return { ok: false, error: "no_baseline" };
  if (attempt.total === null || !attempt.partScores) {
    return { ok: false, error: "incomplete_baseline" };
  }

  const partScores = normalizePartScores(attempt.partScores);
  if (partScores.length === 0) return { ok: false, error: "incomplete_baseline" };

  // Đã có lộ trình đang chạy dựng trên đúng lượt thi này → trả lại, đừng tạo
  // bản thứ hai. Học viên bấm lại nút hoặc tải lại trang không được phép sinh
  // ra hai lộ trình (DB cũng chặn bằng unique index, nhưng chặn ở đây thì
  // người dùng thấy kết quả thay vì thấy lỗi).
  const existing = await prisma.studyPlan.findFirst({
    where: { userId: input.userId, status: "active" },
    include: { weeks: { orderBy: { weekIndex: "asc" }, include: { tasks: true } } },
  });
  if (existing && existing.baselineAttemptId === attempt.id) {
    return {
      ok: true,
      planId: existing.id,
      report: diagnoseFrom(attempt, partScores, input),
      week: weekFromDb(existing.weeks[0]),
      months: (existing.monthGoals as unknown as MonthGoal[]) ?? [],
      aiUsed: false,
      reused: true,
    };
  }

  const report = diagnoseFrom(attempt, partScores, input);
  const months = buildMonthGoals({
    report,
    startDate: input.intake.startDate,
    deadline: input.deadline ?? null,
  });
  let week = planWeek({ report, intake: input.intake, weekIndex: 1 });

  // ── Lớp AI, có hỏng cũng không sao ────────────────────────────────────────
  let aiUsed = false;
  let aiReason: string | undefined;
  let monthGoals = months;

  if (isAiConfigured()) {
    const enriched = await enrichPlan({
      report,
      week,
      months,
      intake: { minutesPerDay: input.intake.minutesPerDay, daysPerWeek: input.intake.daysPerWeek },
    });
    if (enriched.ok) {
      const merged = applyEnrichment(week, months, enriched.data, {
        daysPerWeek: input.intake.daysPerWeek,
      });
      week = merged.week;
      monthGoals = merged.months;
      aiUsed = true;
    } else {
      aiReason = enriched.reason;
    }
  } else {
    aiReason = "no_api_key";
  }

  // ── Ghi xuống DB ──────────────────────────────────────────────────────────
  const planId = await prisma.$transaction(async (tx) => {
    // Lộ trình cũ (nếu có, dựng trên lượt thi khác) lui về archived — unique
    // index chỉ cho phép một bản active mỗi học viên.
    await tx.studyPlan.updateMany({
      where: { userId: input.userId, status: "active" },
      data: { status: "archived" },
    });

    const plan = await tx.studyPlan.create({
      data: {
        userId: input.userId,
        status: "active",
        examType: "lr",
        baselineAttemptId: attempt.id,
        baseline: {
          total: attempt.total,
          listening: attempt.listening,
          reading: attempt.reading,
          parts: partScores,
        } as unknown as Prisma.InputJsonValue,
        intake: input.intake as unknown as Prisma.InputJsonValue,
        targetScore: input.targetScore ?? null,
        deadline: input.deadline ? new Date(`${input.deadline}T00:00:00+07:00`) : null,
        monthGoals: monthGoals as unknown as Prisma.InputJsonValue,
      },
    });

    const createdWeek = await tx.studyWeek.create({
      data: {
        planId: plan.id,
        userId: input.userId,
        weekIndex: week.weekIndex,
        startDate: new Date(`${week.startDate}T00:00:00Z`),
        endDate: new Date(`${week.endDate}T00:00:00Z`),
        theme: week.theme,
        goalText: week.goalText,
        targetMinutes: week.targetMinutes,
        status: "current",
      },
    });

    const rows = week.days.flatMap((day) =>
      day.tasks.map((task, order) => ({
        planId: plan.id,
        weekId: createdWeek.id,
        userId: input.userId,
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
    if (rows.length) await tx.studyTask.createMany({ data: rows });

    await tx.planEvent.create({
      data: {
        planId: plan.id,
        userId: input.userId,
        type: "created",
        payload: {
          weekIndex: week.weekIndex,
          tasks: rows.length,
          baselineAttemptId: attempt.id,
          aiReason: aiReason ?? null,
        } as unknown as Prisma.InputJsonValue,
        aiCalledAt: aiUsed ? new Date() : null,
      },
    });

    return plan.id;
  });

  return { ok: true, planId, report, week, months: monthGoals, aiUsed, aiReason, reused: false };
}

// ─────────────────────────────────────────────────────────────────────────────

function diagnoseFrom(
  attempt: { total: number | null; listening: number | null; reading: number | null },
  partScores: PartScoreInput[],
  input: GenerateInput,
): WeaknessReport {
  return diagnose({
    partScores,
    total: attempt.total!,
    listening: attempt.listening,
    reading: attempt.reading,
    targetScore: input.targetScore ?? null,
    deadline: input.deadline ?? null,
    startDate: input.intake.startDate,
    minutesPerDay: input.intake.minutesPerDay,
    daysPerWeek: input.intake.daysPerWeek,
  });
}

/**
 * `part_scores` trong DB là JSON do engine chấm ghi: [{part, correct, gradable,
 * answered, accuracy}]. Chỉ lấy ba trường cần, và bỏ part nào không chấm được.
 */
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

/** Dựng lại DraftWeek từ bản ghi DB, để trang kết quả dùng chung một kiểu. */
function weekFromDb(
  w:
    | (Prisma.StudyWeekGetPayload<{ include: { tasks: true } }> | undefined)
    | null,
): DraftWeek {
  if (!w) {
    const today = vnToday();
    return {
      weekIndex: 1,
      startDate: mondayOf(today),
      endDate: mondayOf(today),
      theme: "",
      goalText: "",
      targetMinutes: 0,
      days: [],
    };
  }

  const byDate = new Map<string, typeof w.tasks>();
  for (const t of w.tasks) {
    const key = vnDateKey(t.date);
    const list = byDate.get(key) ?? [];
    list.push(t);
    byDate.set(key, list);
  }

  const days = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tasks]) => ({
      date,
      weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
      rest: false,
      busy: false,
      budgetMinutes: tasks.reduce((s, t) => s + t.estMinutes, 0),
      tasks: tasks
        .sort((a, b) => a.order - b.order)
        .map((t) => ({
          catalogId: t.catalogId,
          title: t.title,
          href: t.href,
          kind: t.kind as DraftWeek["days"][number]["tasks"][number]["kind"],
          target: t.target as unknown as DraftWeek["days"][number]["tasks"][number]["target"],
          estMinutes: t.estMinutes,
          priority: t.priority as "core" | "bonus",
          reason: "focus" as const,
        })),
    }));

  return {
    weekIndex: w.weekIndex,
    startDate: vnDateKey(w.startDate),
    endDate: vnDateKey(w.endDate),
    theme: w.theme,
    goalText: w.goalText,
    targetMinutes: w.targetMinutes,
    days,
  };
}
