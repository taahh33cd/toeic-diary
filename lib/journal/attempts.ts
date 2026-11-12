/**
 * Lịch sử làm bài ở khu Luyện đề, gom hai nguồn về một dạng để sổ học tập
 * hiển thị chung:
 *   - part_practice_attempts  → luyện lẻ một part (/skills/listening/partN)
 *   - full_test_attempts      → thi trọn đề 200 câu (/skills/full-tests)
 *
 * Chỉ dùng ở server: file này import catalog đề (JSON) để lấy tên đề.
 */

import { prisma } from "@/lib/db/prisma";
import { countByPart, getPracticeEntry, listPracticeTests, loadPracticeTest } from "@/lib/listening-practice";
import { parsePracticeAttemptSlug, toFullTest } from "@/lib/listening-practice/adapt";
import { getCatalogEntry, getExamSet, listTests, loadTest } from "@/lib/full-tests";
import type { FullTest, PartNumber } from "@/lib/full-tests/types";
import type { RunConfig } from "@/components/full-tests/SetupPanel";

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

/**
 * Tên đề thi trọn bộ đã kèm tên bộ đề ("PRACTICE TEST EST 2026 — Test 1"),
 * mà nhãn nhóm bên ngoài cũng là tên bộ đề ⇒ cắt phần lặp cho gọn.
 */
function shortTestTitle(title: string, examTitle?: string): string {
  if (!examTitle || !title.startsWith(examTitle)) return title;
  const rest = title.slice(examTitle.length).replace(/^[\s—–-]+/, "");
  return rest || title;
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
      testTitle: shortTestTitle(entry?.title ?? a.testSlug, exam?.title),
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

// ── Tổng hợp theo học viên, cho màn giáo viên ────────────────────────────────

export interface StudentAttemptSummary {
  userId: string;
  displayName: string | null;
  studentCode: string | null;
  /** Số lượt đã nộp (cả bài lẻ và trọn đề) */
  attempts: number;
  correct: number;
  gradable: number;
  /** Nộp lần cuối lúc nào */
  last: Date | null;
}

/**
 * Mỗi học viên một dòng: số lượt, tổng câu đúng/câu chấm được, lần nộp cuối.
 * Chỉ gọi từ khu admin — không lọc theo người đang đăng nhập.
 */
export async function loadStudentAttemptSummaries(): Promise<StudentAttemptSummary[]> {
  const [parts, fulls] = await Promise.all([
    prisma.partPracticeAttempt.groupBy({
      by: ["userId"],
      where: { status: "done" },
      _count: { _all: true },
      _sum: { correct: true, gradable: true },
      _max: { completedAt: true },
    }),
    prisma.fullTestAttempt.groupBy({
      by: ["userId"],
      where: { status: "done" },
      _count: { _all: true },
      _sum: { correct: true, gradable: true },
      _max: { completedAt: true },
    }),
  ]);

  const byUser = new Map<string, StudentAttemptSummary>();
  for (const g of [...parts, ...fulls]) {
    const cur = byUser.get(g.userId) ?? {
      userId: g.userId, displayName: null, studentCode: null,
      attempts: 0, correct: 0, gradable: 0, last: null,
    };
    cur.attempts += g._count._all;
    cur.correct += g._sum.correct ?? 0;
    cur.gradable += g._sum.gradable ?? 0;
    const at = g._max.completedAt;
    if (at && (!cur.last || at > cur.last)) cur.last = at;
    byUser.set(g.userId, cur);
  }

  if (byUser.size === 0) return [];

  const profiles = await prisma.profile.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: { id: true, displayName: true, studentCode: true },
  });
  for (const p of profiles) {
    const row = byUser.get(p.id);
    if (row) {
      row.displayName = p.displayName;
      row.studentCode = p.studentCode;
    }
  }

  // Ai nộp gần đây nhất lên trên — giáo viên mở màn này là để xem ai vừa làm.
  return [...byUser.values()].sort(
    (a, b) => (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0),
  );
}

// ── Thống kê theo đề, cho thẻ đề ở khu Luyện đề ──────────────────────────────

export interface TestStat {
  /** Số lượt đã nộp */
  attempts: number;
  /** Điểm lần gần nhất — cố ý lấy lần gần nhất, không phải lần cao nhất */
  latestCorrect: number | null;
  latestGradable: number | null;
  /** Còn một lượt dở dang (đã trả lời ít nhất 1 câu) */
  unfinished: boolean;
}

/**
 * Thống kê từng đề của một part, khoá theo số đề (1..9).
 * Dùng cho danh sách đề ở /skills/listening/partN.
 */
export async function loadPartTestStats(
  userId: string,
  skill: string,
  part: number,
): Promise<Map<number, TestStat>> {
  const rows = await prisma.partPracticeAttempt.findMany({
    where: { userId, skill, part },
    orderBy: { updatedAt: "desc" },
    select: {
      testSlug: true, status: true, correct: true, gradable: true,
      answers: true, completedAt: true,
    },
  });

  const out = new Map<number, TestStat>();
  // Đã sắp mới nhất trước ⇒ lượt "done" gặp đầu tiên của mỗi đề là lần gần nhất.
  for (const r of rows) {
    const parsed = parsePracticeAttemptSlug(r.testSlug);
    if (!parsed) continue;

    let s = out.get(parsed.testNumber);
    if (!s) {
      s = { attempts: 0, latestCorrect: null, latestGradable: null, unfinished: false };
      out.set(parsed.testNumber, s);
    }

    if (r.status === "done") {
      s.attempts += 1;
      if (s.latestCorrect === null) {
        s.latestCorrect = r.correct;
        s.latestGradable = r.gradable;
      }
    } else if (countAnswers(r.answers) > 0) {
      s.unfinished = true;
    }
  }

  return out;
}

// ── Xem lại một lượt ─────────────────────────────────────────────────────────

/** Đáp án lưu dạng { "12": "B" } → khoá số để ReviewPanel dùng được. */
function toAnswerMap(raw: unknown): Record<number, string> {
  const out: Record<number, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(k);
    if (Number.isInteger(n) && typeof v === "string") out[n] = v;
  }
  return out;
}

function toMarked(raw: unknown): number[] {
  return Array.isArray(raw) ? raw.filter((x): x is number => Number.isInteger(x)) : [];
}

/**
 * Config lúc làm bài, vá lại những gì thiếu — bản ghi cũ có thể không đủ field,
 * mà ReviewPanel thì cần `parts` để biết chấm phần nào.
 */
function toRunConfig(raw: unknown, fallbackParts: PartNumber[]): RunConfig {
  const c = (raw ?? {}) as Partial<RunConfig>;
  const parts = Array.isArray(c.parts) && c.parts.length > 0 ? c.parts : fallbackParts;
  return {
    mode: c.mode === "practice" ? "practice" : "real",
    parts: parts as PartNumber[],
    minutes: typeof c.minutes === "number" ? c.minutes : 0,
    autoSubmit: c.autoSubmit ?? true,
    instantFeedback: c.instantFeedback ?? false,
  };
}

export interface AttemptDetail {
  /** Dòng lịch sử của chính lượt này */
  item: AttemptItem;
  /** Đề đã nạp lại từ data, đủ audio + transcript + đáp án đúng */
  test: FullTest;
  config: RunConfig;
  answers: Record<number, string>;
  marked: number[];
}

/**
 * Nạp lại đủ thứ để dựng màn chấm chi tiết của một lượt đã nộp.
 * Trả null khi lượt không tồn tại, không thuộc học viên này, hay data đề đã mất.
 */
export async function loadAttemptDetail(userId: string, id: string): Promise<AttemptDetail | null> {
  const part = await prisma.partPracticeAttempt.findFirst({
    where: { id, userId },
    select: {
      id: true, skill: true, part: true, testSlug: true, status: true, config: true,
      answers: true, marked: true, correct: true, gradable: true,
      completedAt: true, updatedAt: true,
    },
  });

  if (part) {
    const parsed = parsePracticeAttemptSlug(part.testSlug);
    if (!parsed) return null;
    const practice = await loadPracticeTest(`test-${parsed.testNumber}`);
    if (!practice) return null;

    const entry = getPracticeEntry(parsed.testNumber);
    const skillLabel = part.skill === "reading" ? "Reading" : "Listening";
    const item: AttemptItem = {
      id: part.id,
      kind: "part",
      status: part.status === "in_progress" ? "in_progress" : "done",
      groupKey: `${part.skill}-${part.part}`,
      groupLabel: `${skillLabel} · Part ${part.part}`,
      testTitle: entry?.title ?? part.testSlug,
      testHref: `/skills/${part.skill}/part${part.part}/${parsed.testNumber}`,
      modeLabel: modeLabel(part.config),
      correct: part.correct,
      gradable: part.gradable,
      total: null,
      answered: countAnswers(part.answers),
      at: part.completedAt ?? part.updatedAt,
    };

    return {
      item,
      test: toFullTest(practice, parsed.part),
      config: toRunConfig(part.config, [part.part as PartNumber]),
      answers: toAnswerMap(part.answers),
      marked: toMarked(part.marked),
    };
  }

  const full = await prisma.fullTestAttempt.findFirst({
    where: { id, userId },
    select: {
      id: true, examSlug: true, testSlug: true, status: true, config: true,
      answers: true, marked: true, correct: true, gradable: true, total: true,
      completedAt: true, updatedAt: true,
    },
  });
  if (!full) return null;

  const test = await loadTest(full.testSlug);
  if (!test) return null;

  const n = fullTestNumber(full.testSlug);
  const entry = n ? getCatalogEntry(full.examSlug, n) : undefined;
  const exam = getExamSet(full.examSlug);
  const item: AttemptItem = {
    id: full.id,
    kind: "full",
    status: full.status === "in_progress" ? "in_progress" : "done",
    groupKey: `full-${full.examSlug}`,
    groupLabel: exam?.title ?? "Thi thử trọn đề",
    testTitle: shortTestTitle(entry?.title ?? full.testSlug, exam?.title),
    testHref: n ? `/skills/full-tests/${full.examSlug}/${n}` : "/skills/full-tests",
    modeLabel: modeLabel(full.config),
    correct: full.correct,
    gradable: full.gradable,
    total: full.total,
    answered: countAnswers(full.answers),
    at: full.completedAt ?? full.updatedAt,
  };

  return {
    item,
    test,
    // Dedupe: mỗi part có nhiều nhóm câu, mà scoreAttempt cộng theo từng part trong danh sách.
    config: toRunConfig(full.config, [...new Set(test.groups.map((g) => g.part))]),
    answers: toAnswerMap(full.answers),
    marked: toMarked(full.marked),
  };
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

// ── Mô tả dạng bài, cho phần gợi ý "nên luyện gì tiếp" ──────────────────────

/** Lối vào và tổng số đề của một dạng bài, suy từ `groupKey`. */
export interface AttemptGroupMeta {
  groupKey: string;
  /** Trang danh sách đề của dạng bài đó — trang này tự lo phần khoá/mở */
  href: string;
  /** Tổng số đề có trong dạng bài, để biết còn bao nhiêu đề chưa làm */
  totalTests: number;
}

/**
 * Giải mã `groupKey` thành lối vào + tổng số đề.
 * Thuần đọc catalog, không chạm DB — nhưng vẫn phải gọi ở server vì catalog là JSON.
 */
export function describeAttemptGroups(groupKeys: string[]): AttemptGroupMeta[] {
  return groupKeys.map((groupKey) => {
    const part = /^(listening|reading)-(\d+)$/.exec(groupKey);
    if (part) {
      const [, skill, nStr] = part;
      const n = Number(nStr);
      // Chỉ Part 1-2 có đề trong catalog luyện nghe; part khác đếm 0.
      const totalTests = n === 1 || n === 2
        ? listPracticeTests().filter((t) => countByPart(t, n) > 0).length
        : 0;
      return { groupKey, href: `/skills/${skill}/part${n}`, totalTests };
    }
    const full = /^full-(.+)$/.exec(groupKey);
    if (full) {
      return { groupKey, href: "/skills/full-tests", totalTests: listTests(full[1]).length };
    }
    return { groupKey, href: "/skills", totalTests: 0 };
  });
}
