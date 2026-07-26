import { calcEtsScore, type EtsResult } from "@/lib/ets-scale";
import catalogJson from "./data/catalog.json";
import type { Catalog, CatalogEntry, FullTest, PartNumber } from "./types";

export * from "./types";

// ── Bộ đề ────────────────────────────────────────────────────────────────────

export interface ExamSet {
  slug: string;
  /** Tên hiển thị — cố tình dùng "EST" thay vì "ETS" như quy ước sẵn có của dự án */
  title: string;
  subtitle: string;
  /** Số đề có data; 0 = chưa có, hiện "Sắp có" */
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

// ── Cấu hình part ────────────────────────────────────────────────────────────

export type Section = "listening" | "reading";

export interface PartMeta {
  part: PartNumber;
  label: string;
  labelVi: string;
  first: number;
  last: number;
  count: number;
  section: Section;
  hasAudio: boolean;
  /** Phút gợi ý khi luyện lẻ part — tổng 7 part = 120 phút */
  minutes: number;
  /** Giây nghỉ sau mỗi câu ở chế độ thi thật (chỉ Listening) */
  gapSeconds: number;
}

export const PARTS: PartMeta[] = [
  { part: 1, label: "Part 1", labelVi: "Hình ảnh",        first: 1,   last: 6,   count: 6,  section: "listening", hasAudio: true,  minutes: 3,  gapSeconds: 5 },
  { part: 2, label: "Part 2", labelVi: "Hỏi – đáp",       first: 7,   last: 31,  count: 25, section: "listening", hasAudio: true,  minutes: 10, gapSeconds: 5 },
  { part: 3, label: "Part 3", labelVi: "Hội thoại",       first: 32,  last: 70,  count: 39, section: "listening", hasAudio: true,  minutes: 18, gapSeconds: 8 },
  { part: 4, label: "Part 4", labelVi: "Bài nói ngắn",    first: 71,  last: 100, count: 30, section: "listening", hasAudio: true,  minutes: 14, gapSeconds: 8 },
  { part: 5, label: "Part 5", labelVi: "Điền câu",        first: 101, last: 130, count: 30, section: "reading",   hasAudio: false, minutes: 11, gapSeconds: 0 },
  { part: 6, label: "Part 6", labelVi: "Điền đoạn văn",   first: 131, last: 146, count: 16, section: "reading",   hasAudio: false, minutes: 9,  gapSeconds: 0 },
  { part: 7, label: "Part 7", labelVi: "Đọc hiểu",        first: 147, last: 200, count: 54, section: "reading",   hasAudio: false, minutes: 55, gapSeconds: 0 },
];

export const ALL_PARTS: PartNumber[] = [1, 2, 3, 4, 5, 6, 7];

export function partMeta(part: PartNumber): PartMeta {
  const m = PARTS.find((p) => p.part === part);
  if (!m) throw new Error(`part không hợp lệ: ${part}`);
  return m;
}

export function partOf(question: number): PartNumber {
  const m = PARTS.find((p) => question >= p.first && question <= p.last);
  if (!m) throw new Error(`câu ngoài phạm vi 1-200: ${question}`);
  return m.part;
}

// ── Chế độ & thời gian ───────────────────────────────────────────────────────

export type ExamMode = "real" | "practice";

/** Thời gian gợi ý (phút) cho tập part đã chọn. Chọn đủ 7 part = 120 phút. */
export function suggestedMinutes(parts: PartNumber[]): number {
  return parts.reduce((sum, p) => sum + partMeta(p).minutes, 0);
}

/** Chế độ thi thật tách 2 đồng hồ: Listening theo audio, Reading 75 phút. */
export const REAL_READING_MINUTES = 75;

export const TIME_PRESETS = [
  { label: "Chuẩn thi thật", minutes: 120 },
  { label: "60 phút", minutes: 60 },
  { label: "30 phút", minutes: 30 },
  { label: "Không giới hạn", minutes: 0 },
] as const;

export function hasSection(parts: PartNumber[], section: Section): boolean {
  return parts.some((p) => partMeta(p).section === section);
}

// ── Chấm điểm ────────────────────────────────────────────────────────────────

export interface PartScore {
  part: PartNumber;
  correct: number;
  answered: number;
  /** Số câu được tính điểm (đã loại câu thiếu đáp án / câu lỗi) */
  gradable: number;
  accuracy: number;
}

export interface ScoreResult {
  parts: PartScore[];
  correct: number;
  gradable: number;
  answered: number;
  accuracy: number;
  /** Chỉ quy đổi khi làm đủ 7 part và đề đủ đáp án */
  scaled: EtsResult | null;
}

/**
 * Chấm bài. `answers` là map số câu → chữ cái đã chọn.
 * Câu không có đáp án gốc hoặc câu lỗi bị loại khỏi mẫu số.
 */
export function scoreAttempt(
  test: FullTest,
  answers: Record<number, string>,
  parts: PartNumber[],
): ScoreResult {
  const chosen = new Set(parts);
  const byPart = new Map<PartNumber, PartScore>();
  for (const p of parts) {
    byPart.set(p, { part: p, correct: 0, answered: 0, gradable: 0, accuracy: 0 });
  }

  for (const group of test.groups) {
    if (!chosen.has(group.part)) continue;
    const acc = byPart.get(group.part)!;
    for (const q of group.questions) {
      if (q.broken || !q.answer) continue;
      acc.gradable++;
      const picked = answers[q.number];
      if (picked) acc.answered++;
      if (picked === q.answer) acc.correct++;
    }
  }

  const list = parts.map((p) => {
    const s = byPart.get(p)!;
    s.accuracy = s.gradable ? s.correct / s.gradable : 0;
    return s;
  });

  const correct = list.reduce((a, s) => a + s.correct, 0);
  const gradable = list.reduce((a, s) => a + s.gradable, 0);
  const answered = list.reduce((a, s) => a + s.answered, 0);

  const full = ALL_PARTS.every((p) => chosen.has(p));
  const complete = full && gradable === 200;
  const at = (p: PartNumber) => byPart.get(p)?.correct ?? 0;

  return {
    parts: list,
    correct,
    gradable,
    answered,
    accuracy: gradable ? correct / gradable : 0,
    scaled: complete ? calcEtsScore(at(1), at(2), at(3), at(4), at(5), at(6), at(7)) : null,
  };
}
