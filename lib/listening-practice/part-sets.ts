// Bộ luyện Part 1 (ảnh), Part 3 (hội thoại) và Part 4 (bài nói), xếp trong 2 thư mục "Luyện tập cơ bản" /
// "Luyện tập nâng cao", mỗi thư mục gồm các Test 1, 2, … Data đã ở sẵn shape FullTest.
//
// Nguồn:
//   - Cơ bản/Nâng cao Test 1: "TOEIC PART N.docx" + đáp án; audio của series dictation
//     "partN-practice" (/practice/part-N); ảnh ở public/listening-practice/partN.
//   - Part 1 Cơ bản Test 1–5: thư mục Drive "PART 1 BAI TAP CO BAN" (50 câu); audio + ảnh
//     nằm ở public/listening-practice/part1/basic (không có bài chép chính tả tương ứng).
//   - Part 3 Cơ bản Test 2–6: câu 32–61 của EST 2026 Test 1–5 (lib/full-tests), transcript
//     theo bộ đề Drive 2026-11-19; audio + giải thích dùng chung với full test.
//
// testNumber chỉ là khoá trong URL/lượt làm (không đổi khi đổi tên hiển thị) — giữ nguyên số
// đã cấp để không mất lịch sử làm bài.
import type { FullTest } from "@/lib/full-tests/types";

export type SetPart = 1 | 3 | 4;
export type SetLevel = "basic" | "advanced";

export interface PartSet {
  part: SetPart;
  level: SetLevel;
  slug: string;
  testNumber: number;
  /** Nhãn trên thẻ trong thư mục, vd "Test 2" */
  label: string;
  /** Tên đầy đủ (sổ học tập, tiêu đề màn làm bài) */
  title: string;
  /** Số hội thoại (Part 3) / bài nói (Part 4) */
  items: number;
  questions: number;
  /** Mở cho mọi tài khoản */
  free: boolean;
}

export const SET_LEVELS: { level: SetLevel; title: string }[] = [
  { level: "basic", title: "Luyện tập cơ bản" },
  { level: "advanced", title: "Luyện tập nâng cao" },
];

function set(
  part: SetPart, level: SetLevel, index: number, slug: string, testNumber: number,
  items: number, questions: number, free: boolean,
): PartSet {
  const folder = SET_LEVELS.find((l) => l.level === level)!.title;
  return { part, level, slug, testNumber, label: `Test ${index}`, title: `${folder} · Test ${index}`, items, questions, free };
}

export const PART_SETS: Record<SetPart, PartSet[]> = {
  // Part 1 còn có 9 đề CA (testNumber 1–9, lib/listening-practice/data/test-N.json) ⇒ bộ ở đây đánh số từ 101.
  1: [
    set(1, "basic", 1, "part1-basic-1", 101, 10, 10, true),
    set(1, "basic", 2, "part1-basic-2", 102, 10, 10, true),
    set(1, "basic", 3, "part1-basic-3", 103, 10, 10, false),
    set(1, "basic", 4, "part1-basic-4", 104, 10, 10, false),
    set(1, "basic", 5, "part1-basic-5", 105, 10, 10, false),
  ],
  3: [
    set(3, "basic", 1, "part3-basic", 1, 10, 23, true),
    set(3, "basic", 2, "part3-basic-2", 3, 10, 30, true),
    set(3, "basic", 3, "part3-basic-3", 4, 10, 30, false),
    set(3, "basic", 4, "part3-basic-4", 5, 10, 30, false),
    set(3, "basic", 5, "part3-basic-5", 6, 10, 30, false),
    set(3, "basic", 6, "part3-basic-6", 7, 10, 30, false),
    set(3, "advanced", 1, "part3-advanced", 2, 5, 15, false),
  ],
  4: [
    set(4, "basic", 1, "part4-basic", 1, 10, 21, true),
    set(4, "advanced", 1, "part4-advanced", 2, 10, 30, false),
  ],
};

/** Danh từ cho một "bài" của part — dùng ở thẻ đề và lời giới thiệu */
export const SET_ITEM_NOUN: Record<SetPart, string> = { 1: "câu", 3: "hội thoại", 4: "bài nói" };

export function isSetPart(part: number): part is SetPart {
  return part === 1 || part === 3 || part === 4;
}

export function getPartSet(part: SetPart, testNumber: number): PartSet | undefined {
  return PART_SETS[part].find((s) => s.testNumber === testNumber);
}

export function getPartSetBySlug(slug: string): PartSet | undefined {
  return [...PART_SETS[1], ...PART_SETS[3], ...PART_SETS[4]].find((s) => s.slug === slug);
}

// Map tường minh thay vì import động theo biến: Turbopack cần đường dẫn tĩnh.
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "part1-basic-1": () => import("./data/part1-basic-1.json"),
  "part1-basic-2": () => import("./data/part1-basic-2.json"),
  "part1-basic-3": () => import("./data/part1-basic-3.json"),
  "part1-basic-4": () => import("./data/part1-basic-4.json"),
  "part1-basic-5": () => import("./data/part1-basic-5.json"),
  "part3-basic": () => import("./data/part3-basic.json"),
  "part3-basic-2": () => import("./data/part3-basic-2.json"),
  "part3-basic-3": () => import("./data/part3-basic-3.json"),
  "part3-basic-4": () => import("./data/part3-basic-4.json"),
  "part3-basic-5": () => import("./data/part3-basic-5.json"),
  "part3-basic-6": () => import("./data/part3-basic-6.json"),
  "part3-advanced": () => import("./data/part3-advanced.json"),
  "part4-basic": () => import("./data/part4-basic.json"),
  "part4-advanced": () => import("./data/part4-advanced.json"),
};

export async function loadPartSetTest(part: SetPart, testNumber: number): Promise<FullTest | null> {
  const s = getPartSet(part, testNumber);
  if (!s) return null;
  const test = (await LOADERS[s.slug]()).default as FullTest;
  // Tên hiển thị lấy từ đây (data cũ còn ghi "Luyện tập cơ bản") ⇒ đổi tên không cần sửa JSON.
  return { ...test, title: s.title };
}
