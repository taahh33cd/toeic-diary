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

/** 47 ảnh (Easy → Medium → Hard) + 2 ảnh mẫu Unsplash ban đầu. */
export const SPEAKING_Q3_4_ITEMS: SpeakingItem[] = [
  ...getAllStepItems().map(toExamItem),
  ...SAMPLE_EXTRA.map((s) => ({
    ...s,
    prepSeconds: Q34_PREP_SECONDS,
    responseSeconds: Q34_RESPONSE_SECONDS,
  })),
];
