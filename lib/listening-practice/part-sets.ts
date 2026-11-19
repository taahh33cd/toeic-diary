// Bộ luyện Part 3 (hội thoại) và Part 4 (bài nói) — mỗi part 2 bộ "cơ bản"/"nâng cao",
// cùng audio với series dictation "part3-practice" / "part4-practice" (/practice/part-N).
// Data đã ở sẵn shape FullTest nên không cần adapter như bộ CA Part 1/2.
//
// Nguồn: "TOEIC PART N.docx" (đề + ảnh biểu đồ) + "TOEIC PART N - ĐÁP ÁN.docx";
// transcript lấy từ bảng lessons của series dictation. Ảnh ở public/listening-practice/partN.
import type { FullTest } from "@/lib/full-tests/types";

export type SetPart = 3 | 4;

export interface PartSet {
  part: SetPart;
  slug: string;
  testNumber: number;
  title: string;
  /** Số hội thoại (Part 3) / bài nói (Part 4) */
  items: number;
  questions: number;
  /** Mở cho mọi tài khoản */
  free: boolean;
}

export const PART_SETS: Record<SetPart, PartSet[]> = {
  3: [
    { part: 3, slug: "part3-basic", testNumber: 1, title: "Luyện tập cơ bản", items: 10, questions: 23, free: true },
    { part: 3, slug: "part3-advanced", testNumber: 2, title: "Luyện tập nâng cao", items: 5, questions: 15, free: false },
  ],
  4: [
    { part: 4, slug: "part4-basic", testNumber: 1, title: "Luyện tập cơ bản", items: 10, questions: 21, free: true },
    { part: 4, slug: "part4-advanced", testNumber: 2, title: "Luyện tập nâng cao", items: 10, questions: 30, free: false },
  ],
};

/** Danh từ cho một "bài" của part — dùng ở thẻ đề và lời giới thiệu */
export const SET_ITEM_NOUN: Record<SetPart, string> = { 3: "hội thoại", 4: "bài nói" };

export function isSetPart(part: number): part is SetPart {
  return part === 3 || part === 4;
}

export function getPartSet(part: SetPart, testNumber: number): PartSet | undefined {
  return PART_SETS[part].find((s) => s.testNumber === testNumber);
}

export function getPartSetBySlug(slug: string): PartSet | undefined {
  return [...PART_SETS[3], ...PART_SETS[4]].find((s) => s.slug === slug);
}

// Map tường minh thay vì import động theo biến: Turbopack cần đường dẫn tĩnh.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "part3-basic": () => import("./data/part3-basic.json"),
  "part3-advanced": () => import("./data/part3-advanced.json"),
  "part4-basic": () => import("./data/part4-basic.json"),
  "part4-advanced": () => import("./data/part4-advanced.json"),
};

export async function loadPartSetTest(part: SetPart, testNumber: number): Promise<FullTest | null> {
  const set = getPartSet(part, testNumber);
  if (!set) return null;
  return (await LOADERS[set.slug]()).default as FullTest;
}
