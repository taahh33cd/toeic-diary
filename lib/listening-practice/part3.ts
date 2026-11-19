// Bộ luyện Part 3 (hội thoại) — 15 đoạn chia 2 bộ, cùng audio với series dictation
// "part3-practice" (/practice/part-3). Data đã ở sẵn shape FullTest nên không cần
// adapter như bộ CA Part 1/2.
//
// Nguồn: TOEIC PART 3.docx (đề + 6 ảnh) + TOEIC PART 3 - ĐÁP ÁN.docx; transcript
// lấy từ bảng lessons của series dictation. Ảnh nằm ở public/listening-practice/part3.
import type { FullTest } from "@/lib/full-tests/types";

export interface Part3Set {
  slug: string;
  testNumber: number;
  title: string;
  conversations: number;
  questions: number;
  /** Mở cho mọi tài khoản */
  free: boolean;
}

export const PART3_SETS: Part3Set[] = [
  { slug: "part3-basic", testNumber: 1, title: "Luyện tập cơ bản", conversations: 10, questions: 23, free: true },
  { slug: "part3-advanced", testNumber: 2, title: "Luyện tập nâng cao", conversations: 5, questions: 15, free: false },
];

export function getPart3Set(testNumber: number): Part3Set | undefined {
  return PART3_SETS.find((s) => s.testNumber === testNumber);
}

export function getPart3SetBySlug(slug: string): Part3Set | undefined {
  return PART3_SETS.find((s) => s.slug === slug);
}

// Map tường minh thay vì import động theo biến: Turbopack cần đường dẫn tĩnh.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "part3-basic": () => import("./data/part3-basic.json"),
  "part3-advanced": () => import("./data/part3-advanced.json"),
};

export async function loadPart3Test(testNumber: number): Promise<FullTest | null> {
  const set = getPart3Set(testNumber);
  if (!set) return null;
  return (await LOADERS[set.slug]()).default as FullTest;
}
