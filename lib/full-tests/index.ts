// Chỉ dùng ở server: file này import JSON đề (~2.6MB tổng).
// Component client phải import từ ./parts, ./scoring, ./types.
import catalogJson from "./data/catalog.json";
import type { Catalog, CatalogEntry, FullTest } from "./types";

export * from "./types";
export * from "./parts";
export * from "./scoring";

// ── Bộ đề ────────────────────────────────────────────────────────────────────

export interface ExamSet {
  slug: string;
  /** Tên hiển thị — cố tình dùng "EST" thay vì "ETS" như quy ước sẵn có của dự án */
  title: string;
  subtitle: string;
  available: boolean;
}

export const EXAM_SETS: ExamSet[] = [
  { slug: "est-2026", title: "PRACTICE TEST EST 2026", subtitle: "10 đề · mới nhất", available: true },
  { slug: "est-2024", title: "PRACTICE TEST EST 2024", subtitle: "10 đề", available: false },
  { slug: "new-economy", title: "PRACTICE TEST NEW ECONOMY", subtitle: "10 đề", available: false },
];

export const catalog = catalogJson as Catalog;

export function getExamSet(slug: string): ExamSet | undefined {
  return EXAM_SETS.find((e) => e.slug === slug);
}

export function listTests(examSlug: string): CatalogEntry[] {
  return examSlug === catalog.examSlug ? catalog.tests : [];
}

export function getCatalogEntry(examSlug: string, testNumber: number): CatalogEntry | undefined {
  return listTests(examSlug).find((t) => t.testNumber === testNumber);
}

// ── Nạp đề ───────────────────────────────────────────────────────────────────

// Map tường minh thay vì import động theo biến: Turbopack cần đường dẫn tĩnh
// để tách chunk, và cách này giữ được type-safety.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "est-2026-test-1": () => import("./data/est-2026-test-1.json"),
  "est-2026-test-2": () => import("./data/est-2026-test-2.json"),
  "est-2026-test-3": () => import("./data/est-2026-test-3.json"),
  "est-2026-test-4": () => import("./data/est-2026-test-4.json"),
  "est-2026-test-5": () => import("./data/est-2026-test-5.json"),
  "est-2026-test-6": () => import("./data/est-2026-test-6.json"),
  "est-2026-test-7": () => import("./data/est-2026-test-7.json"),
  "est-2026-test-8": () => import("./data/est-2026-test-8.json"),
  "est-2026-test-9": () => import("./data/est-2026-test-9.json"),
  "est-2026-test-10": () => import("./data/est-2026-test-10.json"),
};

export async function loadTest(slug: string): Promise<FullTest | null> {
  const load = LOADERS[slug];
  if (!load) return null;
  return (await load()).default as FullTest;
}
