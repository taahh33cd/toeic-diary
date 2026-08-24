// Speaking · Questions 8–10 — Respond to questions using information provided.
//
// Mỗi bộ đề gồm một bảng thông tin (lịch hội thảo, lịch phỏng vấn, CV, đơn hàng…)
// và 4 file audio: lời dẫn tình huống + 3 câu hỏi. Data do
// `scripts/import-speaking-q8-10.ts` sinh ra sau khi upload media lên Supabase.
//
// Thời gian chuẩn ETS: 45 giây đọc bảng thông tin, mỗi câu 3 giây chuẩn bị,
// câu 8-9 trả lời 15 giây, câu 10 trả lời 30 giây (câu 10 được đọc 2 lần).

import RAW from "./data/speaking-q8-10.json";
// Bài mẫu để riêng file: script import sinh lại speaking-q8-10.json nên không được
// nhét bài mẫu vào đó, kẻo chạy lại script là mất trắng.
import SAMPLES from "./data/speaking-q8-10-samples.json";

export const Q810_READ_SECONDS = 45;
export const Q810_PREP_SECONDS = 3;
export const Q810_RESPONSE_SECONDS: Record<number, number> = { 8: 15, 9: 15, 10: 30 };

/** Số bộ đề mở miễn phí ở đầu mỗi thể loại. */
export const Q810_FREE_PER_CATEGORY = 2;

export type Q810Category =
  | "conference"
  | "class"
  | "meeting"
  | "event"
  | "travel"
  | "interview"
  | "resume"
  | "order"
  | "mini";

/** Bài nói mẫu cho một câu — chỉ hiện ở màn xem lại, sau khi học viên đã nói. */
export interface Q810Sample {
  answer: string;
  translation: string;
  /** Thông tin này lấy từ dòng nào của bảng. */
  source: string;
  phrases: { en: string; vi: string }[];
}

export interface Q810Question {
  /** Số câu trong đề thi thật: 8, 9 hoặc 10. */
  n: number;
  audioUrl: string;
  audioDuration: number;
  /** Lời câu hỏi (máy bóc băng) — chỉ hiện ở màn xem lại, lúc làm bài thì chỉ nghe. */
  transcript: string;
  prepSeconds: number;
  responseSeconds: number;
  sample?: Q810Sample;
}

export interface Q810Test {
  /** Bộ đề đã được soạn bài mẫu cho cả ba câu hay chưa. */
  hasSamples: boolean;
  slug: string;
  category: Q810Category;
  /** Số thứ tự trong thể loại, bắt đầu từ 1. */
  index: number;
  title: string;
  imageUrl: string;
  introAudioUrl: string;
  introDuration: number;
  introTranscript: string;
  questions: Q810Question[];
  /** Mở cho mọi người, không cần đăng ký khoá học. */
  free: boolean;
}

export const Q810_CATEGORIES: {
  id: Q810Category;
  label: string;
  labelEn: string;
  hint: string;
}[] = [
  {
    id: "conference",
    label: "Lịch hội thảo · hội nghị",
    labelEn: "Conference & seminar schedule",
    hint: "Dạng ra nhiều nhất: bảng Time – Session – Speaker. Chú ý phiên bị đổi giờ và phí tham dự.",
  },
  {
    id: "class",
    label: "Lịch lớp học · khoá học",
    labelEn: "Class schedule",
    hint: "Bảng lớp học theo thứ/giờ kèm giảng viên. Hay hỏi hạn đăng ký và học phí.",
  },
  {
    id: "meeting",
    label: "Lịch họp · lịch làm việc",
    labelEn: "Meeting agenda",
    hint: "Chương trình họp nội bộ hoặc lịch một ngày làm việc. Chú ý ai phụ trách phần nào.",
  },
  {
    id: "event",
    label: "Lịch sự kiện",
    labelEn: "Event schedule",
    hint: "Sự kiện theo ngày kèm địa điểm. Hay hỏi sự kiện nào diễn ra ở đâu, ngày nào.",
  },
  {
    id: "travel",
    label: "Lịch trình du lịch · công tác",
    labelEn: "Travel itinerary",
    hint: "Chuyến bay, khách sạn, hoạt động theo ngày. Chú ý giờ bay và tên khách sạn.",
  },
  {
    id: "interview",
    label: "Lịch phỏng vấn",
    labelEn: "Interview schedule",
    hint: "Bảng ứng viên – vị trí – công ty. Luôn có một dòng bị gạch/huỷ — câu 9 thường hỏi đúng dòng đó.",
  },
  {
    id: "resume",
    label: "Hồ sơ ứng viên (CV)",
    labelEn: "Résumé",
    hint: "Học vấn, kinh nghiệm, kỹ năng. Câu 10 thường yêu cầu kể lại toàn bộ kinh nghiệm làm việc.",
  },
  {
    id: "order",
    label: "Đơn hàng · đặt chỗ",
    labelEn: "Order & reservation",
    hint: "Đơn hàng, phiếu đặt phòng/xe. Chú ý số lượng, đơn giá, tổng tiền và điều kiện đổi/huỷ.",
  },
  {
    id: "mini",
    label: "Mini Test",
    labelEn: "Mixed practice",
    hint: "Trộn đủ dạng — dùng để kiểm tra lại sau khi đã luyện xong các thể loại trên.",
  },
];

type RawTest = {
  slug: string;
  category: string;
  title: string;
  imageUrl: string;
  introAudioUrl: string;
  introDuration: number;
  introTranscript: string;
  questions: { n: number; audioUrl: string; audioDuration: number; transcript: string }[];
};

const ORDER = new Map(Q810_CATEGORIES.map((c, i) => [c.id, i]));

export const SPEAKING_Q810_TESTS: Q810Test[] = (RAW as RawTest[])
  .map((t) => {
    const index = Number(t.slug.split("-").pop()) || 1;
    const samples = (SAMPLES as Record<string, Record<string, Q810Sample>>)[t.slug];
    return {
      hasSamples: t.questions.every((q) => Boolean(samples?.[String(q.n)])),
      slug: t.slug,
      category: t.category as Q810Category,
      index,
      title: t.title,
      imageUrl: t.imageUrl,
      introAudioUrl: t.introAudioUrl,
      introDuration: t.introDuration,
      introTranscript: t.introTranscript,
      questions: t.questions.map((q) => ({
        ...q,
        prepSeconds: Q810_PREP_SECONDS,
        responseSeconds: Q810_RESPONSE_SECONDS[q.n] ?? 15,
        sample: samples?.[String(q.n)],
      })),
      free: index <= Q810_FREE_PER_CATEGORY,
    };
  })
  .sort((a, b) => (ORDER.get(a.category)! - ORDER.get(b.category)!) || a.index - b.index);

export function getQ810Test(slug: string): Q810Test | undefined {
  return SPEAKING_Q810_TESTS.find((t) => t.slug === slug);
}

export function getQ810Tests(category: Q810Category): Q810Test[] {
  return SPEAKING_Q810_TESTS.filter((t) => t.category === category);
}

export function q810CategoryMeta(id: Q810Category) {
  return Q810_CATEGORIES.find((c) => c.id === id) ?? Q810_CATEGORIES[0];
}
