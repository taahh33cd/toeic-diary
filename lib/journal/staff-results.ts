/**
 * Kết quả luyện đề của mọi học viên, cho bảng "Kết quả HV" ở admin.
 *
 * Chỉ dùng ở server, chỉ gọi từ khu admin — không lọc theo người đang đăng nhập.
 * Đọc hai bảng lượt làm bài bằng SQL thuần để đếm số câu đã trả lời ngay trong
 * Postgres: kéo cả cột `answers` (JSON vài trăm khoá mỗi lượt) của cả trung tâm
 * về Node chỉ để đếm thì quá nặng.
 */

import { prisma } from "@/lib/db/prisma";
import {
  answeredEnough, estimateFromTotals, weakestPart, type PartTally,
} from "@/lib/journal/results-math";

export interface StudentPracticeSummary {
  userId: string;
  studentCode: string;
  displayName: string | null;
  /** Lần nộp bài gần nhất (ISO), null = chưa nộp lượt nào */
  lastAtISO: string | null;
  /** Số lượt đã nộp trong 7 ngày qua */
  done7d: number;
  /** Tổng số lượt đã nộp */
  doneTotal: number;
  /** Số bài đang làm dở (đã trả lời ít nhất 1 câu) */
  unfinished: number;
  /** Điểm ước tính từ tối đa 3 bài thi thử gần nhất */
  estimate: { value: number; n: number } | null;
  /** Bài thi thử gần nhất so với bài liền trước (điểm 990), null khi chưa đủ 2 bài */
  trend: number | null;
  /** Part có tỷ lệ đúng thấp nhất */
  weakest: { part: number; pct: number; gradable: number } | null;
}

interface PartRow {
  userId: string;
  part: number;
  status: string;
  correct: number | null;
  gradable: number | null;
  answered: number;
  at: Date;
}

interface FullRow {
  userId: string;
  status: string;
  mode: string | null;
  gradable: number | null;
  total: number | null;
  partScores: unknown;
  answered: number;
  at: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Đọc mảng part_scores [{ part, correct, gradable }] một cách phòng thủ. */
function toPartScores(raw: unknown): PartTally[] {
  if (!Array.isArray(raw)) return [];
  const out: PartTally[] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const { part, correct, gradable } = x as Record<string, unknown>;
    if (Number.isInteger(part) && typeof correct === "number" && typeof gradable === "number" && gradable > 0) {
      out.push({ part: part as number, correct, gradable });
    }
  }
  return out;
}

export async function loadStudentPracticeSummaries(now: Date = new Date()): Promise<StudentPracticeSummary[]> {
  const [profiles, parts, fulls] = await Promise.all([
    prisma.profile.findMany({
      where: { studentCode: { not: null } },
      select: { id: true, studentCode: true, displayName: true },
    }),
    // jsonb_typeof: bản ghi lỗi có answers không phải object thì đếm 0, không làm hỏng cả câu truy vấn.
    prisma.$queryRaw<PartRow[]>`
      SELECT user_id AS "userId", part, status, correct, gradable,
             COALESCE(completed_at, updated_at) AS "at",
             CASE WHEN jsonb_typeof(answers) = 'object'
                  THEN (SELECT count(*) FROM jsonb_object_keys(answers))::int
                  ELSE 0 END AS "answered"
      FROM part_practice_attempts
    `,
    prisma.$queryRaw<FullRow[]>`
      SELECT user_id AS "userId", status, config->>'mode' AS "mode", gradable, total,
             part_scores AS "partScores",
             COALESCE(completed_at, updated_at) AS "at",
             CASE WHEN jsonb_typeof(answers) = 'object'
                  THEN (SELECT count(*) FROM jsonb_object_keys(answers))::int
                  ELSE 0 END AS "answered"
      FROM full_test_attempts
    `,
  ]);

  type Acc = {
    last: Date | null; done7d: number; doneTotal: number; unfinished: number;
    mocks: { total: number; at: Date }[];
    tallies: Map<number, PartTally>;
  };
  const byUser = new Map<string, Acc>();
  const acc = (userId: string): Acc => {
    let a = byUser.get(userId);
    if (!a) {
      a = { last: null, done7d: 0, doneTotal: 0, unfinished: 0, mocks: [], tallies: new Map() };
      byUser.set(userId, a);
    }
    return a;
  };
  const addTally = (a: Acc, t: PartTally) => {
    const cur = a.tallies.get(t.part) ?? { part: t.part, correct: 0, gradable: 0 };
    cur.correct += t.correct;
    cur.gradable += t.gradable;
    a.tallies.set(t.part, cur);
  };
  const since7d = now.getTime() - 7 * DAY_MS;
  const markDone = (a: Acc, at: Date) => {
    a.doneTotal += 1;
    if (at.getTime() >= since7d) a.done7d += 1;
    if (!a.last || at > a.last) a.last = at;
  };

  for (const r of parts) {
    const a = acc(r.userId);
    if (r.status !== "done") {
      if (r.answered > 0) a.unfinished += 1;
      continue;
    }
    markDone(a, r.at);
    if (r.correct !== null && r.gradable && answeredEnough(r.answered, r.gradable)) {
      addTally(a, { part: r.part, correct: r.correct, gradable: r.gradable });
    }
  }

  for (const r of fulls) {
    const a = acc(r.userId);
    if (r.status !== "done") {
      if (r.answered > 0) a.unfinished += 1;
      continue;
    }
    markDone(a, r.at);
    // Cùng quy tắc với trang Kết quả của học viên: chỉ bài thi thử có điểm 990.
    if (r.mode === "real" && r.total !== null) a.mocks.push({ total: r.total, at: r.at });
    if (answeredEnough(r.answered, r.gradable)) {
      for (const t of toPartScores(r.partScores)) addTally(a, t);
    }
  }

  return profiles.map((p) => {
    const a = byUser.get(p.id);
    const mocks = a ? [...a.mocks].sort((x, y) => y.at.getTime() - x.at.getTime()) : [];
    return {
      userId: p.id,
      studentCode: p.studentCode!,
      displayName: p.displayName,
      lastAtISO: a?.last ? a.last.toISOString() : null,
      done7d: a?.done7d ?? 0,
      doneTotal: a?.doneTotal ?? 0,
      unfinished: a?.unfinished ?? 0,
      estimate: estimateFromTotals(mocks.map((m) => m.total)),
      trend: mocks.length >= 2 ? mocks[0].total - mocks[1].total : null,
      weakest: a ? weakestPart(a.tallies.values()) : null,
    };
  });
}
