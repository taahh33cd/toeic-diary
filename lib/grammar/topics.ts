import type { GrammarQuestion, TopicConfig } from "./types";

export const TOPICS: TopicConfig[] = [
  {
    id: "Cấu trúc câu",
    slug: "cau-truc-cau",
    name: "Cấu trúc câu",
    testSizes: [15, 15, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "🔤",
    color: "#6366f1",
  },
  {
    id: "12 thì",
    slug: "12-thi",
    name: "12 Thì",
    testSizes: [20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "⏱️",
    color: "#3b82f6",
  },
  {
    id: "Câu bị động",
    slug: "cau-bi-dong",
    name: "Câu bị động",
    testSizes: [25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "🔁",
    color: "#0891b2",
  },
  {
    id: "Hoà hợp S-V",
    slug: "hoa-hop-sv",
    name: "Hoà hợp S-V",
    testSizes: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "🔗",
    color: "#10b981",
  },
  {
    id: "Động từ khuyết thiếu",
    slug: "dong-tu-khuyet-thieu",
    name: "Động từ khuyết thiếu",
    testSizes: [10, 10, 10, 10, 10],
    emoji: "🛠️",
    color: "#a855f7",
  },
  {
    id: "Danh động từ & Nguyên thể",
    slug: "danh-dong-tu-nguyen-the",
    name: "Danh động từ & Nguyên thể",
    testSizes: [10, 10, 10, 10, 10],
    emoji: "🌱",
    color: "#22c55e",
  },
  {
    id: "Danh từ & Đại từ",
    slug: "danh-tu-dai-tu",
    name: "Danh từ & Đại từ",
    testSizes: [20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "📝",
    color: "#f59e0b",
  },
  {
    id: "Tính từ & Trạng từ",
    slug: "tinh-tu-trang-tu",
    name: "Tính từ & Trạng từ",
    testSizes: [20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "✨",
    color: "#ec4899",
  },
  {
    id: "Giới từ",
    slug: "gioi-tu",
    name: "Giới từ",
    testSizes: [20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "📍",
    color: "#8b5cf6",
  },
  {
    id: "Liên từ",
    slug: "lien-tu",
    name: "Liên từ",
    testSizes: [20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "🔄",
    color: "#14b8a6",
  },
  {
    id: "MĐQH",
    slug: "mdqh",
    name: "Mệnh đề quan hệ",
    testSizes: [20, 20, 20, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    emoji: "🔀",
    color: "#f97316",
  },
  {
    id: "Mệnh đề danh ngữ",
    slug: "menh-de-danh-ngu",
    name: "Mệnh đề danh ngữ",
    testSizes: [10, 10, 10, 10, 10],
    emoji: "🧩",
    color: "#d946ef",
  },
  {
    id: "Câu điều kiện",
    slug: "cau-dieu-kien",
    name: "Câu điều kiện",
    testSizes: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    emoji: "❓",
    color: "#ef4444",
  },
  {
    id: "So sánh",
    slug: "so-sanh",
    name: "So sánh",
    // 8 test bank cũ + 5 test từ thẻ "SO SÁNH" trong Docs.
    testSizes: [25, 25, 25, 25, 25, 25, 25, 25, 10, 10, 10, 10, 10],
    emoji: "⚖️",
    color: "#0ea5e9",
  },
  {
    id: "Nhận dạng hậu tố",
    slug: "nhan-dang-hau-to",
    name: "Nhận dạng hậu tố từ loại",
    testSizes: [30, 30, 30, 30, 30, 30, 30, 30],
    emoji: "🔍",
    color: "#84cc16",
  },
  {
    id: "Part 5 tổng hợp",
    slug: "part-5-tong-hop",
    name: "Part 5 tổng hợp",
    // Hai thẻ "PART 5 TỔNG HỢP" trong Docs: đề trộn nhiều chủ điểm, giữ đúng
    // số câu mỗi Test như bản gốc (xem scripts/data/grammar-docs/).
    testSizes: [
      10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 30,
      28, 29, 30, 29, 30, 30, 30, 30, 30, 20, 30, 30, 30, 30, 30, 30,
    ],
    emoji: "📚",
    color: "#64748b",
  },
];

export function getTopicBySlug(slug: string): TopicConfig | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

/** Extract questions for a specific test (0-based testIndex). */
export function getTestSlice(
  questions: GrammarQuestion[],
  topicId: string,
  testIndex: number,
  testSizes: number[]
): GrammarQuestion[] {
  const topicQs = questions.filter((q) => q.grammar_type === topicId);
  let cursor = 0;
  for (let i = 0; i < testSizes.length; i++) {
    const size = testSizes[i];
    const slice = topicQs.slice(cursor, cursor + size);
    if (slice.length === 0) break;
    if (i === testIndex) return slice;
    cursor += size;
  }
  return [];
}
