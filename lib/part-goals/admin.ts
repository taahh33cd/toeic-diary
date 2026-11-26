/**
 * Mục tiêu — dữ liệu cho khu GV: danh sách HV, mục tiêu tổng, ai còn thiếu.
 * Server only. Đọc cả nhánh students/goals của RTDB bằng Admin SDK (client
 * không được đọc cả nhánh goals/), nên cache ngắn để badge menu không gọi liên tục.
 */

import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Goal } from "@/lib/firebase/types";
import { shiftMonth, vnDayOfMonth, vnMonth } from "./core";
import { toDTO } from "./server";
import type { PartGoalDTO } from "./core";

export interface RosterRow {
  code: string;
  name: string;
  frozen: boolean;
  goal: Pick<Goal, "examType" | "target" | "deadline" | "swTargetS" | "swTargetW" | "swDeadline" | "setByRole" | "setByName" | "updatedAt"> | null;
}

let rosterCache: { at: number; rows: RosterRow[] } | null = null;
const TTL = 2 * 60_000;

export function invalidateRoster() {
  rosterCache = null;
}

/** `fresh` = bỏ qua cache (trang Mục tiêu cần số liệu ngay sau khi GV lưu). */
export async function loadRoster(fresh = false): Promise<RosterRow[]> {
  if (!fresh && rosterCache && Date.now() - rosterCache.at < TTL) return rosterCache.rows;
  const db = getAdminDb();
  const [studentsSnap, goalsSnap] = await Promise.all([db.ref("students").get(), db.ref("goals").get()]);
  const students = (studentsSnap.val() ?? {}) as Record<string, { name?: string; frozen?: boolean }>;
  const goals = (goalsSnap.val() ?? {}) as Record<string, Goal>;
  const rows: RosterRow[] = Object.entries(students).map(([code, s]) => {
    const g = goals[code];
    return {
      code,
      name: s?.name ?? code,
      frozen: !!s?.frozen,
      goal: g
        ? {
            examType: g.examType, target: g.target, deadline: g.deadline,
            swTargetS: g.swTargetS, swTargetW: g.swTargetW, swDeadline: g.swDeadline,
            setByRole: g.setByRole, setByName: g.setByName, updatedAt: g.updatedAt,
          }
        : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  rosterCache = { at: Date.now(), rows };
  return rows;
}

export function hasTotalGoal(g: RosterRow["goal"]): boolean {
  return !!g && (typeof g.target === "number" || g.swTargetS !== undefined || g.swTargetW !== undefined);
}

/** Tháng cần nhắc: tháng này, và tháng sau khi đã từ ngày 25. */
export function reminderMonths(now: Date = new Date()): string[] {
  const cur = vnMonth(now);
  return vnDayOfMonth(now) >= 25 ? [cur, shiftMonth(cur, 1)] : [cur];
}

export async function loadGoalsForMonths(months: string[]): Promise<Record<string, Record<string, PartGoalDTO>>> {
  const rows = await prisma.partGoal.findMany({ where: { month: { in: months } } });
  const out: Record<string, Record<string, PartGoalDTO>> = {};
  for (const m of months) out[m] = {};
  for (const r of rows) out[r.month][r.studentCode] = toDTO(r);
  return out;
}

export interface Reminders {
  months: string[];
  /** HV đang học, kỳ L&R, chưa có mục tiêu part của tháng (theo từng tháng). */
  missingPart: { code: string; name: string; months: string[] }[];
  /** HV đang học chưa đặt mục tiêu tổng kỳ nào. */
  missingTotal: { code: string; name: string }[];
  count: number;
}

export async function loadReminders(): Promise<Reminders> {
  const months = reminderMonths();
  const [roster, goals] = await Promise.all([loadRoster(), loadGoalsForMonths(months)]);
  const active = roster.filter((r) => !r.frozen);
  const missingPart = active
    .filter((r) => r.goal?.examType !== "sw")
    .map((r) => ({ code: r.code, name: r.name, months: months.filter((m) => !goals[m][r.code]) }))
    .filter((r) => r.months.length > 0);
  const missingTotal = active.filter((r) => !hasTotalGoal(r.goal)).map((r) => ({ code: r.code, name: r.name }));
  const count = new Set([...missingPart.map((r) => r.code), ...missingTotal.map((r) => r.code)]).size;
  return { months, missingPart, missingTotal, count };
}
