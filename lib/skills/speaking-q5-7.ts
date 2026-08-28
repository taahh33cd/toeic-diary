// Speaking · Questions 5–7 — Respond to questions.
//
// Mỗi bộ đề gồm lời dẫn tình huống (phỏng vấn qua điện thoại về một chủ đề
// quen thuộc) và ba câu hỏi có audio. Data do `scripts/import-speaking-q5-7.ts`
// sinh ra sau khi upload audio lên Supabase.
//
// Thời gian chuẩn ETS: 3 giây chuẩn bị cho mỗi câu; trả lời 15 giây cho câu 5-6
// và 30 giây cho câu 7. KHÔNG có thời gian đọc trước như Q8-10.

import RAW from "./data/speaking-q5-7.json";
// Bản dịch để riêng: script import sinh lại speaking-q5-7.json nên không nhét vào đó được.
import VI from "./data/speaking-q5-7-vi.json";

export const Q57_PREP_SECONDS = 3;
export const Q57_RESPONSE_SECONDS: Record<number, number> = { 5: 15, 6: 15, 7: 30 };

/** Số bộ đề mở miễn phí ở đầu mỗi chủ đề. */
export const Q57_FREE_PER_CATEGORY = 2;

/** Directions nguyên văn trên màn hình thi thật */
export const Q57_DIRECTIONS =
  "In this part of the test, you will answer three questions. You will have three seconds to prepare " +
  "after you hear each question. You will have 15 seconds to respond to Questions 5 and 6, and " +
  "30 seconds to respond to Question 7.";

export type Q57Category = "life" | "media" | "shopping" | "tech" | "travel" | "living";

export interface Q57Question {
  n: 5 | 6 | 7;
  audioUrl: string;
  audioDuration: number;
  /** Lời câu hỏi — thi thật chỉ được nghe, chế độ luyện tập mới hiện chữ. */
  transcript: string;
  transcriptVi?: string;
  prepSeconds: number;
  responseSeconds: number;
}

export interface Q57Test {
  slug: string;
  category: Q57Category;
  /** Số thứ tự trong chủ đề, bắt đầu từ 1 */
  index: number;
  topic: string;
  topicVi: string;
  /** Lời dẫn tình huống — thi thật đọc lên kèm audio câu 5 */
  situation: string;
  situationVi?: string;
  questions: Q57Question[];
  free: boolean;
}

export const Q57_CATEGORIES: { id: Q57Category; label: string; labelEn: string; hint: string }[] = [
  {
    id: "life",
    label: "Thói quen & đời sống",
    labelEn: "Daily habits",
    hint: "Thể thao, ăn uống, thú cưng, trò chuyện. Câu 5-6 gần như luôn hỏi tần suất — thủ sẵn cụm chỉ tần suất.",
  },
  {
    id: "media",
    label: "Giải trí & truyền thông",
    labelEn: "Entertainment & media",
    hint: "Phim, truyền hình, sách. Câu 7 hay hỏi quan điểm (nên/không nên) chứ không chỉ kể việc mình làm.",
  },
  {
    id: "shopping",
    label: "Mua sắm & ăn uống",
    labelEn: "Shopping & dining",
    hint: "Quần áo, nhà hàng, tạp hoá. Chú ý câu hỏi kép (\"how often… and who with?\") — thiếu một vế là mất điểm.",
  },
  {
    id: "tech",
    label: "Công nghệ & liên lạc",
    labelEn: "Technology",
    hint: "Điện thoại, ứng dụng. Cần vài từ vựng về tính năng (battery, screen, app store) để nói đủ 15 giây.",
  },
  {
    id: "travel",
    label: "Du lịch & đi lại",
    labelEn: "Travel & transport",
    hint: "Kỳ nghỉ, phương tiện công cộng, điểm tham quan. Câu 7 thường hỏi ưu điểm hoặc cách cải thiện.",
  },
  {
    id: "living",
    label: "Nơi ở & công việc",
    labelEn: "Where you live & work",
    hint: "Chỗ ở, tìm việc. Câu 7 hỏi tiêu chí lựa chọn — trả lời theo khuôn \"yếu tố + vì sao\".",
  },
];

type RawTest = {
  slug: string;
  category: string;
  index: number;
  topic: string;
  topicVi: string;
  situation: string;
  questions: { n: number; audioUrl: string; audioDuration: number; transcript: string }[];
};

type ViEntry = { situation?: string; "5"?: string; "6"?: string; "7"?: string };
const VI_MAP = VI as Record<string, ViEntry>;

export const Q57_TESTS: Q57Test[] = (RAW as RawTest[]).map((t) => ({
  slug: t.slug,
  category: t.category as Q57Category,
  index: t.index,
  topic: t.topic,
  topicVi: t.topicVi,
  situation: t.situation,
  situationVi: VI_MAP[t.slug]?.situation,
  free: t.index <= Q57_FREE_PER_CATEGORY,
  questions: t.questions.map((q) => ({
    n: q.n as 5 | 6 | 7,
    audioUrl: q.audioUrl,
    audioDuration: q.audioDuration,
    transcript: q.transcript,
    transcriptVi: VI_MAP[t.slug]?.[String(q.n) as "5" | "6" | "7"],
    prepSeconds: Q57_PREP_SECONDS,
    responseSeconds: Q57_RESPONSE_SECONDS[q.n] ?? 15,
  })),
}));

export function getQ57Test(slug: string): Q57Test | undefined {
  return Q57_TESTS.find((t) => t.slug === slug);
}

export function q57CategoryMeta(id: Q57Category) {
  return Q57_CATEGORIES.find((c) => c.id === id)!;
}
