// Chỉ dùng ở server: file này nạp JSON đề luyện nghe.
// Component client import kiểu từ ./types.
import catalogJson from "./data/catalog.json";
import type { ListeningPart, PracticeCatalog, PracticeCatalogEntry, PracticeTest } from "./types";

export * from "./types";

export const catalog = catalogJson as PracticeCatalog;

export function listPracticeTests(): PracticeCatalogEntry[] {
  return catalog.tests;
}

export function getPracticeEntry(testNumber: number): PracticeCatalogEntry | undefined {
  return catalog.tests.find((t) => t.testNumber === testNumber);
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
