// Metadata part + cấu hình thời gian. Tách riêng khỏi index.ts vì các component
// client cần phần này, còn index.ts có loader import() 10 file JSON đề (~2.6MB)
// — không nên để chúng dính vào graph của client bundle.
import type { PartNumber } from "./types";

export type Section = "listening" | "reading";
export type ExamMode = "real" | "practice";

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
  { part: 1, label: "Part 1", labelVi: "Hình ảnh",      first: 1,   last: 6,   count: 6,  section: "listening", hasAudio: true,  minutes: 3,  gapSeconds: 5 },
  { part: 2, label: "Part 2", labelVi: "Hỏi – đáp",     first: 7,   last: 31,  count: 25, section: "listening", hasAudio: true,  minutes: 10, gapSeconds: 5 },
  { part: 3, label: "Part 3", labelVi: "Hội thoại",     first: 32,  last: 70,  count: 39, section: "listening", hasAudio: true,  minutes: 18, gapSeconds: 8 },
  { part: 4, label: "Part 4", labelVi: "Bài nói ngắn",  first: 71,  last: 100, count: 30, section: "listening", hasAudio: true,  minutes: 14, gapSeconds: 8 },
  { part: 5, label: "Part 5", labelVi: "Điền câu",      first: 101, last: 130, count: 30, section: "reading",   hasAudio: false, minutes: 11, gapSeconds: 0 },
  { part: 6, label: "Part 6", labelVi: "Điền đoạn văn", first: 131, last: 146, count: 16, section: "reading",   hasAudio: false, minutes: 9,  gapSeconds: 0 },
  { part: 7, label: "Part 7", labelVi: "Đọc hiểu",      first: 147, last: 200, count: 54, section: "reading",   hasAudio: false, minutes: 55, gapSeconds: 0 },
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

// ── Phân quyền ───────────────────────────────────────────────────────────────

/** Đề mở cho mọi tài khoản, làm bản dùng thử. Còn lại cần đã đăng ký khoá học. */
export const FREE_TEST_NUMBERS = [1];

export function isTestFree(testNumber: number): boolean {
  return FREE_TEST_NUMBERS.includes(testNumber);
}
