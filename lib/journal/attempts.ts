/**
 * Lịch sử làm bài ở khu Luyện đề, gom hai nguồn về một dạng để sổ học tập
 * hiển thị chung:
 *   - part_practice_attempts  → luyện lẻ một part (/skills/listening/partN)
 *   - full_test_attempts      → thi trọn đề 200 câu (/skills/full-tests)
 *
 * Chỉ dùng ở server: file này import catalog đề (JSON) để lấy tên đề.
 */

import { prisma } from "@/lib/db/prisma";
import { getPracticeEntry } from "@/lib/listening-practice";
import { parsePracticeAttemptSlug } from "@/lib/listening-practice/adapt";
import { getCatalogEntry, getExamSet } from "@/lib/full-tests";

export type AttemptStatus = "in_progress" | "done";

/** Một lượt làm bài đã quy về dạng chung. */
export interface AttemptItem {
  id: string;
  /** "part" = luyện lẻ, "full" = thi trọn đề */
  kind: "part" | "full";
  status: AttemptStatus;
  /** Khoá gom nhóm theo dạng bài, vd "listening-1" | "full-est-2026" */
  groupKey: string;
  /** Nhãn nhóm, vd "Listening · Part 1" */
  groupLabel: string;
  /** Tên đề, vd "CA Test 5" */
  testTitle: string;
  /** Link vào làm lại / làm tiếp đề đó */
  testHref: string;
  /** "Thi thử" | "Luyện tập" */
  modeLabel: string;
  correct: number | null;
  gradable: number | null;
  /** Điểm quy đổi ETS — chỉ thi trọn đề mới có */
  total: number | null;
  /** Số câu đã trả lời (dùng cho lượt đang làm dở) */
  answered: number;
  /** Nộp lúc nào (done) hoặc lưu lúc nào (in_progress) */
  at: Date;
}

/** Số câu đã trả lời trong cột answers dạng { "1": "B", ... }. */
function countAnswers(answers: unknown): number {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return 0;
  return Object.keys(answers as Record<string, unknown>).length;
}

function modeLabel(config: unknown): string {
  const mode = (config as { mode?: string } | null)?.mode;
  return mode === "real" ? "Thi thử" : "Luyện tập";
}

/** Đọc số đề từ khoá lượt thi trọn đề, vd "est-2026-test-7" → 7. */
function fullTestNumber(testSlug: string): number | null {
  const m = /-test-(\d+)$/.exec(testSlug);
  return m ? Number(m[1]) : null;
}

/**
 * Toàn bộ lượt làm bài của một học viên, mới nhất trước.
 * Lượt đang làm dở xếp cùng danh sách — sổ học tập tự tách ra để nhắc "làm tiếp".
 */
export async function loadAttemptHistory(userId: string): Promise<AttemptItem[]> {
  const [parts, fulls] = await Promise.all([
    prisma.partPracticeAttempt.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true, skill: true, part: true, testSlug: true, status: true, config: true,
        answers: true, correct: true, gradable: true, completedAt: true, updatedAt: true,
      },
    }),
    prisma.fullTestAttempt.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true, examSlug: true, testSlug: true, status: true, config: true,
        answers: true, correct: true, gradable: true, total: true,
        completedAt: true, updatedAt: true,
      },
    }),
  ]);

  const items: AttemptItem[] = [];

  for (const a of parts) {
    const parsed = parsePracticeAttemptSlug(a.testSlug);
    const entry = parsed ? getPracticeEntry(parsed.testNumber) : undefined;
    const skillLabel = a.skill === "reading" ? "Reading" : "Listening";
    items.push({
      id: a.id,
      kind: "part",
      status: a.status === "in_progress" ? "in_progress" : "done",
      groupKey: `${a.skill}-${a.part}`,
      groupLabel: `${skillLabel} · Part ${a.part}`,
      testTitle: entry?.title ?? a.testSlug,
      testHref: parsed ? `/skills/${a.skill}/part${a.part}/${parsed.testNumber}` : `/skills/${a.skill}`,
      modeLabel: modeLabel(a.config),
      correct: a.correct,
      gradable: a.gradable,
      total: null,
      answered: countAnswers(a.answers),
      at: a.completedAt ?? a.updatedAt,
    });
  }

  for (const a of fulls) {
    const n = fullTestNumber(a.testSlug);
    const entry = n ? getCatalogEntry(a.examSlug, n) : undefined;
    const exam = getExamSet(a.examSlug);
    items.push({
      id: a.id,
      kind: "full",
      status: a.status === "in_progress" ? "in_progress" : "done",
      groupKey: `full-${a.examSlug}`,
      groupLabel: exam?.title ?? "Thi thử trọn đề",
      testTitle: entry?.title ?? a.testSlug,
      testHref: n ? `/skills/full-tests/${a.examSlug}/${n}` : "/skills/full-tests",
      modeLabel: modeLabel(a.config),
      correct: a.correct,
      gradable: a.gradable,
      total: a.total,
      answered: countAnswers(a.answers),
      at: a.completedAt ?? a.updatedAt,
    });
  }

  return items.sort((x, y) => y.at.getTime() - x.at.getTime());
}

/** Một đề: gom các lượt đã nộp của cùng một đề lại. */
export interface AttemptGroupTest {
  testTitle: string;
  testHref: string;
  attempts: AttemptItem[];
  /** Lượt gần nhất (đứng đầu attempts) */
  latest: AttemptItem;
  /** Số câu đúng cao nhất trong các lượt */
  best: number | null;
}

/** Một dạng bài: Part 1, Part 2, hay một bộ đề thi thử. */
export interface AttemptGroup {
  key: string;
  label: string;
  tests: AttemptGroupTest[];
  attemptCount: number;
}

/**
 * Gom các lượt ĐÃ NỘP theo dạng bài → đề, giữ thứ tự mới nhất trước ở cả hai cấp.
 */
export function groupAttempts(items: AttemptItem[]): AttemptGroup[] {
  const groups = new Map<string, AttemptGroup>();

  for (const it of items) {
    if (it.status !== "done") continue;

    let g = groups.get(it.groupKey);
    if (!g) {
      g = { key: it.groupKey, label: it.groupLabel, tests: [], attemptCount: 0 };
      groups.set(it.groupKey, g);
    }
    g.attemptCount += 1;

    let t = g.tests.find((x) => x.testTitle === it.testTitle);
    if (!t) {
      t = { testTitle: it.testTitle, testHref: it.testHref, attempts: [], latest: it, best: null };
      g.tests.push(t);
    }
    t.attempts.push(it);
    if (it.correct !== null) t.best = t.best === null ? it.correct : Math.max(t.best, it.correct);
  }

  return [...groups.values()];
}
