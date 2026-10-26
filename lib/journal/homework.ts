/**
 * Một nguồn chân lý cho "bài tập về nhà đã xong hay chưa".
 *
 * Trạng thái nộp nằm ở RTDB `submissions/{studentCode}/{hwId}_{section}_{index}`
 * — mỗi đầu việc một khoá, không phải một khoá cho cả buổi. Trước đây dashboard
 * tra bằng `submissions[hw.date]` nên không bao giờ khớp: BTVN luôn hiện chưa
 * nộp và số "bài quá hạn" đếm cả bài đã làm xong. Badge trên nav lại tính đúng
 * theo khoá từng việc, nên hai nơi nói hai kiểu.
 */

import type { Homework, HwItem } from "@/lib/firebase/types";

export const HW_SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;
export type HwSection = (typeof HW_SECTIONS)[number];

export const HW_SECTION_LABELS: Record<HwSection, string> = {
  vocab: "Từ vựng",
  listening: "Nghe",
  reading: "Đọc",
  practice: "Đề luyện",
  other: "Khác",
};

export type SubmissionLike = { ticked?: boolean; url?: string };
export type SubmissionsLike = Record<string, SubmissionLike>;
export type DayLinksLike = Record<string, { link?: string }>;

/** Khoá RTDB của một đầu việc — phải khớp với trang Nhiệm vụ. */
export function hwItemKey(hwId: string, section: HwSection, index: number): string {
  return `${hwId}_${section}_${index}`;
}

export type HwTask = {
  /** Khoá RTDB để ghi trạng thái tick. */
  fbKey: string;
  section: HwSection;
  label: string;
  done: boolean;
};

/** Danh sách đầu việc của một buổi, kèm trạng thái đã tick. */
export function hwTasks(hw: Homework, submissions: SubmissionsLike): HwTask[] {
  const tasks: HwTask[] = [];
  for (const sec of HW_SECTIONS) {
    const items = (hw[sec] ?? []) as HwItem[];
    items.forEach((item, i) => {
      const fbKey = hwItemKey(hw.id, sec, i);
      const sub = submissions[fbKey];
      tasks.push({
        fbKey,
        section: sec,
        label: item?.text?.trim() || `${HW_SECTION_LABELS[sec]} ${i + 1}`,
        done: !!(sub?.ticked || sub?.url),
      });
    });
  }
  return tasks;
}

/**
 * Buổi coi như xong khi mọi đầu việc đã tick, hoặc học viên đã nộp link cả buổi.
 * Buổi không có đầu việc nào thì không tính là xong.
 */
export function hwIsDone(
  hw: Homework,
  submissions: SubmissionsLike,
  dayLinks: DayLinksLike
): boolean {
  if (dayLinks[hw.id]?.link) return true;
  const tasks = hwTasks(hw, submissions);
  if (tasks.length === 0) return false;
  return tasks.every((t) => t.done);
}

/** Bài đã qua hạn mà chưa xong. */
export function overdueHomework(
  homework: Homework[],
  submissions: SubmissionsLike,
  dayLinks: DayLinksLike,
  today: string
): Homework[] {
  return homework.filter((hw) => {
    const deadline = hw.endDate ?? hw.date;
    if (deadline >= today) return false;
    return !hwIsDone(hw, submissions, dayLinks);
  });
}
