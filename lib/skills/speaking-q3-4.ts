// Speaking · Questions 3–4 — Describe a picture.
//
// The 47 photos and their model answers are shared with the subskill
// "Mô tả tranh theo 3 bước" (lib/subskills/speaking-p2-steps) so there is a
// single source of truth: the subskill teaches the 3-step method, this unit
// drills it under real exam timing.
//
// Official ETS timing for Q3-4: 45s preparation, 30s response.

import type { SpeakingItem } from "./sample";
import { SPEAKING_Q3_4 as SAMPLE_EXTRA } from "./sample";
import { getAllStepItems, type StepItem, type StepLevel } from "@/lib/subskills/speaking-p2-steps";

export const Q34_PREP_SECONDS = 45;
export const Q34_RESPONSE_SECONDS = 30;

const LEVEL_VI: Record<StepLevel, string> = { Easy: "Dễ", Medium: "Trung bình", Hard: "Khó" };

const LEVEL_TIP: Record<StepLevel, string> = {
  Easy: "Ảnh ít chi tiết — hãy nói chậm, đủ ý, và thêm nhận xét chung ở cuối để dùng hết 30 giây.",
  Medium:
    "Ảnh có vài nhân vật/đồ vật — tả 2–3 đối tượng chính thật rõ thay vì liệt kê tất cả.",
  Hard: "Ảnh rất nhiều chi tiết — chọn 2–3 điểm nổi bật nhất, đừng cố kể hết kẻo hết giờ giữa chừng.",
};

function toExamItem(it: StepItem): SpeakingItem {
  return {
    id: `s34-${it.id}`,
    imageUrl: it.image,
    imageAlt: it.title,
    credit: `Bộ ảnh luyện tập · ${LEVEL_VI[it.level]}`,
    prepSeconds: Q34_PREP_SECONDS,
    responseSeconds: Q34_RESPONSE_SECONDS,
    sampleResponse: it.fullModel,
    tips: [
      `Bước 1 — nêu nơi chốn: "This picture was taken ${it.step1.mcq.correct}."`,
      `Bước 2 — nêu chủ thể chính: "What I can see first is ${it.step2.mcq.correct}."`,
      "Bước 3 — tả theo vị trí: on the left / on the right / in the middle, rồi in the background và in the foreground.",
      LEVEL_TIP[it.level],
    ],
  };
}

// ─────────────────────────────────────
// Chia thành các bộ đề 2 ảnh, theo 3 mức độ
// ─────────────────────────────────────

/** Mỗi lượt thi Q3-4 thật gồm 2 bức ảnh. */
export const Q34_IMAGES_PER_TEST = 2;

export type Q34Level = "easy" | "medium" | "hard";

export type Q34Test = {
  /** Slug trên URL, vd "easy-1" */
  slug: string;
  level: Q34Level;
  /** Số thứ tự trong mức độ, bắt đầu từ 1 */
  index: number;
  items: SpeakingItem[];
};

export const Q34_LEVELS: { level: Q34Level; label: string; labelEn: string; hint: string }[] = [
  { level: "easy", label: "Dễ", labelEn: "Easy", hint: "Ảnh ít chi tiết — tập nói đủ 30 giây mà không bí từ." },
  { level: "medium", label: "Trung bình", labelEn: "Medium", hint: "Vài nhân vật/đồ vật — tập chọn 2–3 đối tượng chính để tả kỹ." },
  { level: "hard", label: "Khó", labelEn: "Hard", hint: "Rất nhiều chi tiết — tập chọn lọc và phân bổ thời gian." },
];

function chunk(items: SpeakingItem[], level: Q34Level): Q34Test[] {
  const out: Q34Test[] = [];
  for (let i = 0; i < items.length; i += Q34_IMAGES_PER_TEST) {
    const index = out.length + 1;
    out.push({ slug: `${level}-${index}`, level, index, items: items.slice(i, i + Q34_IMAGES_PER_TEST) });
  }
  return out;
}

const STEP_ITEMS = getAllStepItems();
const byLevel = (lv: StepLevel) => STEP_ITEMS.filter((i) => i.level === lv).map(toExamItem);

/**
 * 25 bộ đề: Dễ 6 · Trung bình 12 · Khó 7.
 * 2 ảnh mẫu Unsplash ban đầu xếp cuối nhóm Dễ.
 */
export const SPEAKING_Q34_TESTS: Q34Test[] = [
  ...chunk(
    [
      ...byLevel("Easy"),
      ...SAMPLE_EXTRA.map((s) => ({ ...s, prepSeconds: Q34_PREP_SECONDS, responseSeconds: Q34_RESPONSE_SECONDS })),
    ],
    "easy",
  ),
  ...chunk(byLevel("Medium"), "medium"),
  ...chunk(byLevel("Hard"), "hard"),
];

export function getQ34Test(slug: string): Q34Test | undefined {
  return SPEAKING_Q34_TESTS.find((t) => t.slug === slug);
}

export function getQ34Tests(level: Q34Level): Q34Test[] {
  return SPEAKING_Q34_TESTS.filter((t) => t.level === level);
}
