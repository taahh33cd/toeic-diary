/**
 * Mục tiêu part theo tháng — phần tính toán dùng chung server/client.
 * Quy tắc: docs/goals-spec.md §3.
 */

import { rawNeeded } from "@/lib/ets-scale";

export const PART_KEYS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;
export type PartKey = (typeof PART_KEYS)[number];

/** Số câu mỗi part trong một đề chuẩn — GV nhập ngưỡng theo mẫu số này. */
export const PART_STD: Record<PartKey, number> = { p1: 6, p2: 25, p3: 39, p4: 30, p5: 30, p6: 16, p7: 54 };

export const DEFAULT_TIMES = 5;

export interface PartTarget {
  /** Số câu đúng tối thiểu trên `of` câu (đề chuẩn). */
  correct: number;
  of: number;
  /** Số lần cần đạt trong tháng. */
  times: number;
}
export type PartTargets = Partial<Record<PartKey, PartTarget>>;

export interface PartGoalDTO {
  month: string; // YYYY-MM
  parts: PartTargets;
  setByName: string | null;
  updatedAt: string;
}

/** Một lần làm một part, đã quy về dạng chung. */
export interface PartRun {
  source: "full" | "practice" | "manual";
  /** Khoá đề — cùng khoá thì chỉ lấy lần tốt nhất. */
  key: string;
  label: string;
  date: string; // YYYY-MM-DD giờ VN
  part: PartKey;
  correct: number;
  gradable: number;
}

export interface PartRunView extends PartRun {
  passed: boolean;
}

export interface PartProgress {
  part: PartKey;
  target: PartTarget;
  passedCount: number;
  done: boolean;
  /** Các lần được xét trong tháng (đã bỏ lần quá ngắn, đã gộp đề trùng), mới nhất trước. */
  runs: PartRunView[];
}

export interface MonthProgress {
  month: string;
  parts: PartProgress[];
  doneCount: number;
  achieved: boolean;
}

// ── Ngày giờ VN ──────────────────────────────────────────────────────────────

const VN_OFFSET = 7 * 3_600_000;

export function vnDate(d: Date): string {
  return new Date(d.getTime() + VN_OFFSET).toISOString().slice(0, 10);
}

export function vnMonth(d: Date = new Date()): string {
  return vnDate(d).slice(0, 7);
}

export function vnDayOfMonth(d: Date = new Date()): number {
  return Number(vnDate(d).slice(8, 10));
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `tháng ${Number(m)}/${y}`;
}

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// ── Quy tắc tính ─────────────────────────────────────────────────────────────

export function pct(correct: number, of: number): number {
  return of > 0 ? Math.round((correct / of) * 100) : 0;
}

/** Đạt ngưỡng theo %: correct/gradable ≥ target.correct/target.of (so nguyên, không sai số). */
export function runPasses(run: { correct: number; gradable: number }, t: PartTarget): boolean {
  return run.correct * t.of >= t.correct * run.gradable;
}

/** Số câu cần đúng cho một lần có `gradable` câu — làm tròn lên. */
export function neededFor(gradable: number, t: PartTarget): number {
  return Math.ceil((t.correct * gradable) / t.of);
}

/** Lần làm quá ngắn (dưới 50% số câu chuẩn của part) không được xét. */
export function longEnough(run: { gradable: number; part: PartKey }): boolean {
  return run.gradable * 2 >= PART_STD[run.part];
}

export function computeProgress(month: string, parts: PartTargets, runs: PartRun[]): MonthProgress {
  const inMonth = runs.filter((r) => r.date.startsWith(month) && r.gradable > 0 && longEnough(r));
  const out: PartProgress[] = [];
  for (const part of PART_KEYS) {
    const target = parts[part];
    if (!target) continue;
    // Gộp đề trùng: giữ lần có tỷ lệ đúng cao nhất (hoà thì lần mới hơn).
    const best = new Map<string, PartRun>();
    for (const r of inMonth) {
      if (r.part !== part) continue;
      const cur = best.get(r.key);
      const better = !cur
        || r.correct * cur.gradable > cur.correct * r.gradable
        || (r.correct * cur.gradable === cur.correct * r.gradable && r.date > cur.date);
      if (better) best.set(r.key, r);
    }
    const list = [...best.values()]
      .map((r) => ({ ...r, passed: runPasses(r, target) }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const passedCount = list.filter((r) => r.passed).length;
    out.push({ part, target, passedCount, done: passedCount >= target.times, runs: list });
  }
  const doneCount = out.filter((p) => p.done).length;
  return { month, parts: out, doneCount, achieved: out.length > 0 && doneCount === out.length };
}

/** Kiểm tra + làm sạch dữ liệu GV gửi lên. Trả null nếu không hợp lệ. */
export function sanitizeParts(raw: unknown): PartTargets | null {
  if (!raw || typeof raw !== "object") return null;
  const out: PartTargets = {};
  for (const k of PART_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (v == null) continue;
    const { correct, of, times } = v as Record<string, unknown>;
    const std = PART_STD[k];
    if (!Number.isInteger(correct) || !Number.isInteger(times)) return null;
    const c = correct as number, n = times as number;
    if (of !== undefined && of !== std) return null;
    if (c < 1 || c > std || n < 1 || n > 50) return null;
    out[k] = { correct: c, of: std, times: n };
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ── Gợi ý từ mục tiêu tổng ───────────────────────────────────────────────────

/**
 * Lệch tỷ lệ đúng từng part so với trung bình cả phần. Part 1 và Part 5 thường
 * dễ hơn, Part 2 và Part 7 khó giữ hơn — GV duyệt lại bảng ở docs/goals-spec.md.
 */
const PART_OFFSET: Record<PartKey, number> = {
  p1: 0.15, p2: -0.05, p3: 0, p4: 0.02,
  p5: 0.05, p6: 0.03, p7: -0.04,
};

function spread(keys: PartKey[], raw: number): Record<string, number> {
  const base = raw / 100;
  // Dưới 90% cả phần thì không đòi tuyệt đối ở part nào (P1 6/6 quá gắt cho HV 600).
  const cap = (k: PartKey) => (base >= 0.9 ? PART_STD[k] : PART_STD[k] - 1);
  const res: Record<string, number> = {};
  for (const k of keys) {
    const acc = Math.min(1, Math.max(0, base + PART_OFFSET[k]));
    res[k] = Math.min(cap(k), Math.round(acc * PART_STD[k]));
  }
  // Cân lại cho tổng đúng bằng số câu cần của cả phần.
  let sum = keys.reduce((a, k) => a + res[k], 0);
  let guard = 200;
  while (sum !== raw && guard-- > 0) {
    const up = sum < raw;
    const pick = keys
      .filter((k) => (up ? res[k] < cap(k) : res[k] > 0))
      .sort((a, b) => (up ? 1 : -1) * (res[a] / PART_STD[a] - res[b] / PART_STD[b]))[0];
    if (!pick) break;
    res[pick] += up ? 1 : -1;
    sum += up ? 1 : -1;
  }
  return res;
}

/** Bộ mục tiêu part gợi ý cho một mục tiêu tổng L&R (10–990). */
export function suggestParts(total: number, times = DEFAULT_TIMES): PartTargets {
  const t = Math.min(990, Math.max(10, total));
  // Listening thường cao hơn Reading ~50 điểm ở cùng trình độ.
  const listening = Math.min(495, Math.max(5, Math.round((t / 2 + 25) / 5) * 5));
  const reading = Math.min(495, Math.max(5, t - listening));
  const l = spread(["p1", "p2", "p3", "p4"], rawNeeded("listening", listening));
  const r = spread(["p5", "p6", "p7"], rawNeeded("reading", reading));
  const out: PartTargets = {};
  for (const k of PART_KEYS) {
    const c = Math.max(1, (l[k] ?? r[k]) as number);
    out[k] = { correct: c, of: PART_STD[k], times };
  }
  return out;
}
