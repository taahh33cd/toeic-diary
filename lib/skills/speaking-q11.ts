// Speaking · Question 11 — Express an opinion.
//
// Câu cuối và câu nặng điểm nhất của bài thi Speaking: 45 giây chuẩn bị,
// 60 giây nói. Thi thật hiện đề bài bằng CHỮ trên màn hình đồng thời đọc lên,
// nên ở đây transcript luôn hiện — khác Q5-7 và Q8-10.
//
// Data do `scripts/import-speaking-q11.ts` sinh ra sau khi upload audio lên Supabase.

import RAW from "./data/speaking-q11.json";

export const Q11_PREP_SECONDS = 45;
export const Q11_RESPONSE_SECONDS = 60;

/** Số bộ đề mở miễn phí ở đầu mỗi dạng đề. */
export const Q11_FREE_PER_FORM = 2;

/** Directions nguyên văn trên màn hình thi thật */
export const Q11_DIRECTIONS =
  "In this part of the test, you will give your opinion about a specific topic. Be sure to say as much " +
  "as you can in the time allowed. You will have 45 seconds to prepare. Then you will have 60 seconds to speak.";

export type Q11Form = "agree_disagree" | "choice_2" | "open_q" | "policy";

export interface Q11Test {
  slug: string;
  form: Q11Form;
  /** Số thứ tự trong dạng đề, bắt đầu từ 1 */
  index: number;
  topicVi: string;
  question: string;
  audioUrl: string;
  audioDuration: number;
  free: boolean;
}

export const Q11_FORMS: { id: Q11Form; label: string; labelEn: string; hint: string }[] = [
  {
    id: "agree_disagree",
    label: "Đồng ý hay không đồng ý",
    labelEn: "Agree / disagree",
    hint: "Đề nêu một phát biểu. Câu đầu tiên phải chốt phe ngay — 60 giây không đủ để phân vân.",
  },
  {
    id: "choice_2",
    label: "Chọn một trong hai",
    labelEn: "Choose between two",
    hint: "Dạng ra nhiều nhất. Khuôn an toàn: chọn phe → 2 lý do → 1 ví dụ cá nhân → nhắc lại lựa chọn.",
  },
  {
    id: "open_q",
    label: "Câu hỏi mở",
    labelEn: "Open question",
    hint: "Không có sẵn lựa chọn để bám. Dùng 45 giây chuẩn bị để chốt đúng 2 ý, đừng cố nghĩ 3.",
  },
  {
    id: "policy",
    label: "Nên hay không nên",
    labelEn: "Should / should not",
    hint: "Bàn một đề xuất hoặc quy định. Nói rõ ai được lợi, ai chịu thiệt thì bài mới có chiều sâu.",
  },
];

type RawTest = {
  slug: string;
  form: string;
  index: number;
  topicVi: string;
  question: string;
  audioUrl: string;
  audioDuration: number;
};

export const Q11_TESTS: Q11Test[] = (RAW as RawTest[]).map((t) => ({
  slug: t.slug,
  form: t.form as Q11Form,
  index: t.index,
  topicVi: t.topicVi,
  question: t.question,
  audioUrl: t.audioUrl,
  audioDuration: t.audioDuration,
  free: t.index <= Q11_FREE_PER_FORM,
}));

export function getQ11Test(slug: string): Q11Test | undefined {
  return Q11_TESTS.find((t) => t.slug === slug);
}

export function q11FormMeta(id: Q11Form) {
  return Q11_FORMS.find((f) => f.id === id)!;
}
