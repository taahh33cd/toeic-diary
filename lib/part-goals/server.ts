/**
 * Mục tiêu part theo tháng — phần chỉ chạy ở server (Prisma + Firebase Admin).
 */

import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { recordXp } from "@/lib/xp";
import { getCatalogEntry, getExamSet } from "@/lib/full-tests";
import { practiceTestTitle } from "@/lib/listening-practice";
import { parsePracticeAttemptSlug } from "@/lib/listening-practice/adapt";
import { fullTestNumber, shortTestTitle } from "@/lib/journal/attempts";
import type { ToeicScore } from "@/lib/firebase/types";
import {
  PART_KEYS, PART_STD, computeProgress, vnDate, vnMonth,
  type MonthProgress, type PartGoalDTO, type PartKey, type PartRun, type PartTargets,
} from "./core";

export function toDTO(row: { month: string; parts: unknown; setByName: string | null; updatedAt: Date }): PartGoalDTO {
  return { month: row.month, parts: row.parts as PartTargets, setByName: row.setByName, updatedAt: row.updatedAt.toISOString() };
}

export async function loadPartGoals(code: string): Promise<PartGoalDTO[]> {
  const rows = await prisma.partGoal.findMany({ where: { studentCode: code }, orderBy: { month: "desc" } });
  return rows.map(toDTO);
}

function partKey(n: unknown): PartKey | null {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 7 ? (`p${n}` as PartKey) : null;
}

/** Mọi lần làm từng part của HV từ `since` (giờ VN) — 3 nguồn ở docs/goals-spec.md §3. */
export async function loadPartRuns(userId: string | null, code: string, sinceMonth: string): Promise<PartRun[]> {
  const since = new Date(`${sinceMonth}-01T00:00:00+07:00`);
  const runs: PartRun[] = [];

  if (userId) {
    const [practice, fulls] = await Promise.all([
      prisma.partPracticeAttempt.findMany({
        where: { userId, status: "done", completedAt: { gte: since } },
        select: { part: true, testSlug: true, correct: true, gradable: true, completedAt: true },
      }),
      prisma.fullTestAttempt.findMany({
        where: { userId, status: "done", completedAt: { gte: since } },
        select: { examSlug: true, testSlug: true, partScores: true, completedAt: true },
      }),
    ]);

    for (const a of practice) {
      const part = partKey(a.part);
      if (!part || a.correct == null || !a.gradable || !a.completedAt) continue;
      const parsed = parsePracticeAttemptSlug(a.testSlug);
      const title = parsed ? practiceTestTitle(parsed.testNumber, parsed.part) : undefined;
      runs.push({
        source: "practice", key: `practice:${a.testSlug}`, label: title ?? a.testSlug,
        date: vnDate(a.completedAt), part, correct: a.correct, gradable: a.gradable,
      });
    }

    for (const a of fulls) {
      if (!a.completedAt || !Array.isArray(a.partScores)) continue;
      const n = fullTestNumber(a.testSlug);
      const exam = getExamSet(a.examSlug);
      const entry = n ? getCatalogEntry(a.examSlug, n) : undefined;
      const title = shortTestTitle(entry?.title ?? a.testSlug, exam?.title);
      for (const ps of a.partScores as unknown[]) {
        const { part: p, correct, gradable } = (ps ?? {}) as Record<string, unknown>;
        const part = partKey(p);
        if (!part || typeof correct !== "number" || typeof gradable !== "number" || gradable <= 0) continue;
        runs.push({
          source: "full", key: `full:${a.testSlug}:${part}`, label: `${exam?.title ?? "Thi thử"} · ${title}`,
          date: vnDate(a.completedAt), part, correct, gradable,
        });
      }
    }
  }

  // Điểm HV tự nhập có chi tiết part (Firebase). Mỗi lần nhập tính riêng.
  try {
    const snap = await getAdminDb().ref(`students/${code}/scores`).get();
    const list = Object.values((snap.val() ?? {}) as Record<string, ToeicScore>);
    list.forEach((s, i) => {
      if (!s?.date || s.date < `${sinceMonth}-01`) return;
      const hasParts = PART_KEYS.some((k) => (s[k] ?? 0) > 0);
      if (!hasParts) return;
      for (const k of PART_KEYS) {
        const v = s[k];
        if (typeof v !== "number") continue;
        runs.push({
          source: "manual", key: `manual:${s.date}:${i}`, label: s.testname || "Điểm tự nhập",
          date: s.date, part: k, correct: Math.min(v, PART_STD[k]), gradable: PART_STD[k],
        });
      }
    });
  } catch (e) {
    console.error("[part-goals] read manual scores failed", e instanceof Error ? e.message : e);
  }

  return runs;
}

export interface PartGoalsBundle {
  months: { goal: PartGoalDTO; progress: MonthProgress }[];
  /** Tháng vừa đạt trọn và vừa được cộng XP trong lần gọi này — client bật chúc mừng. */
  celebrate: string | null;
}

/** Mục tiêu + tiến độ mọi tháng của một HV. `awardFor` = userId của chính HV để cộng XP khi đạt. */
export async function loadPartGoalsBundle(code: string, userId: string | null, awardFor: string | null): Promise<PartGoalsBundle> {
  const goals = await loadPartGoals(code);
  if (goals.length === 0) return { months: [], celebrate: null };
  const earliest = goals[goals.length - 1].month;
  const runs = await loadPartRuns(userId, code, earliest);
  const months = goals.map((goal) => ({ goal, progress: computeProgress(goal.month, goal.parts, runs) }));

  let celebrate: string | null = null;
  if (awardFor) {
    const current = vnMonth();
    for (const m of months) {
      // Tháng tương lai chưa xét; tháng đã qua mà đạt (chưa thưởng) vẫn được cộng một lần.
      if (!m.progress.achieved || m.goal.month > current) continue;
      const already = await prisma.xpEvent.findFirst({
        where: { userId: awardFor, source: "part_goal_month", metadata: { path: ["month"], equals: m.goal.month } },
        select: { id: true },
      });
      if (already) continue;
      await recordXp(awardFor, "part_goal_month", undefined, { month: m.goal.month });
      celebrate = m.goal.month;
    }
  }
  return { months, celebrate };
}
