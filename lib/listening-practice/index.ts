// Chỉ dùng ở server: file này nạp JSON đề luyện nghe.
// Component client import kiểu từ ./types.
import catalogJson from "./data/catalog.json";
import type { FullTest } from "@/lib/full-tests/types";
import type { ListeningPart, PracticeCatalog, PracticeCatalogEntry, PracticePart, PracticeTest } from "./types";
import { toFullTest } from "./adapt";
import { getPartSet, isSetPart, loadPartSetTest } from "./part-sets";

export * from "./types";

export const catalog = catalogJson as PracticeCatalog;

export function listPracticeTests(): PracticeCatalogEntry[] {
  return catalog.tests;
}

export function getPracticeEntry(testNumber: number): PracticeCatalogEntry | undefined {
  return catalog.tests.find((t) => t.testNumber === testNumber);
}

// ── Phân quyền ───────────────────────────────────────────────────────────────

/**
 * Đề mở cho mọi tài khoản. Luyện lẻ một part nhẹ hơn thi trọn đề nhiều nên mở
 * rộng hơn /skills/full-tests (chỉ đề 1) để người mới thử được thật sự.
 */
export const FREE_PRACTICE_TESTS = [1, 2];

export function isPracticeTestFree(testNumber: number): boolean {
  return FREE_PRACTICE_TESTS.includes(testNumber);
}

/** Số câu của một test theo part */
export function countByPart(entry: PracticeCatalogEntry, part: ListeningPart): number {
  return part === 1 ? entry.part1 : entry.part2;
}

// Map tường minh thay vì import động theo biến: Turbopack cần đường dẫn tĩnh.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "test-1": () => import("./data/test-1.json"),
  "test-2": () => import("./data/test-2.json"),
  "test-3": () => import("./data/test-3.json"),
  "test-4": () => import("./data/test-4.json"),
  "test-5": () => import("./data/test-5.json"),
  "test-6": () => import("./data/test-6.json"),
  "test-7": () => import("./data/test-7.json"),
  "test-8": () => import("./data/test-8.json"),
  "test-9": () => import("./data/test-9.json"),
};

export async function loadPracticeTest(slug: string): Promise<PracticeTest | null> {
  const load = LOADERS[slug];
  if (!load) return null;
  return (await load()).default as PracticeTest;
}

/** Nạp riêng phần câu hỏi của một part — đúng thứ tự số câu */
export async function loadPracticePart(
  testNumber: number,
  part: ListeningPart,
): Promise<{ test: PracticeTest; questions: PracticeTest["questions"] } | null> {
  const test = await loadPracticeTest(`test-${testNumber}`);
  if (!test) return null;
  return { test, questions: test.questions.filter((q) => q.part === part) };
}

// ── Gộp mọi part về một cửa: route lượt làm, sổ học tập và trang đề gọi qua đây ──

export function practiceTestTitle(testNumber: number, part: PracticePart): string | undefined {
  return isSetPart(part) ? getPartSet(part, testNumber)?.title : getPracticeEntry(testNumber)?.title;
}

export function practiceTestExists(testNumber: number, part: PracticePart): boolean {
  return practiceTestTitle(testNumber, part) !== undefined;
}

export function isPracticeFree(testNumber: number, part: PracticePart): boolean {
  return isSetPart(part) ? Boolean(getPartSet(part, testNumber)?.free) : isPracticeTestFree(testNumber);
}

/** Đề ở shape FullTest để chạy bằng bộ máy làm bài/chấm điểm chung */
export async function loadPracticeFullTest(testNumber: number, part: PracticePart): Promise<FullTest | null> {
  if (isSetPart(part)) return loadPartSetTest(part, testNumber);
  const test = await loadPracticeTest(`test-${testNumber}`);
  return test ? toFullTest(test, part) : null;
}
