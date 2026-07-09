// Dữ liệu luyện đề TOEIC Writing Questions 1-5:
// "Write a sentence based on a picture" — viết 1 câu mô tả ảnh, bắt buộc dùng 2 từ cho trước.
//
// Ảnh: Unsplash (Unsplash License — miễn phí dùng thương mại, không bắt buộc ghi nguồn
// nhưng vẫn hiển thị credit tác giả cho đúng tinh thần).

export interface WritingQ15Exercise {
  id: string;
  imageUrl: string;
  imageAlt: string;
  credit: { author: string };
  /** Hai từ bắt buộc phải dùng trong câu */
  keywords: [string, string];
  /** 1–2 câu mẫu để học viên tự đối chiếu */
  modelAnswers: string[];
  /** Gợi ý ngữ pháp/cách dùng */
  tip: string;
}

const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

export const WRITING_Q1_5: WritingQ15Exercise[] = [
  {
    id: "q15-01",
    imageUrl: U("photo-1517048676732-d65bc937f952"),
    imageAlt: "Một nhóm đồng nghiệp ngồi quanh bàn, cầm bút và trao đổi trong cuộc họp.",
    credit: { author: "Dylan Gillis / Unsplash" },
    keywords: ["colleagues", "discuss"],
    modelAnswers: [
      "The colleagues are discussing a project at the table.",
      "Some colleagues are sitting around the table and discussing their work.",
    ],
    tip: "Dùng thì hiện tại tiếp diễn (are + V-ing) để mô tả hành động đang diễn ra trong ảnh.",
  },
  {
    id: "q15-02",
    imageUrl: U("photo-1553877522-43269d4ea984"),
    imageAlt: "Một người đàn ông đang làm việc, gõ phím trên chiếc laptop.",
    credit: { author: "charlesdeluvio / Unsplash" },
    keywords: ["man", "type"],
    modelAnswers: [
      "The man is typing on his laptop.",
      "A man is typing something on a laptop computer.",
    ],
    tip: "\"type on\" đi với bàn phím/máy tính. Nhớ thêm mạo từ (a/the) trước danh từ số ít.",
  },
  {
    id: "q15-03",
    imageUrl: U("photo-1710082936223-9f60e6842a3e"),
    imageAlt: "Một người phục vụ đang bưng một chiếc đĩa đựng thức ăn.",
    credit: { author: "Sebastian Rurarz / Unsplash" },
    keywords: ["waiter", "serve"],
    modelAnswers: [
      "The waiter is serving a plate of food.",
      "A waiter is holding a plate and serving a dish.",
    ],
    tip: "\"serve\" = phục vụ/bưng đồ ăn. Chủ ngữ số ít + is + serving.",
  },
];

// ─────────────────────────────────────
// Kiểm tra học viên đã dùng đủ 2 từ khóa chưa (chỉ là gợi ý, không phải chấm ngữ pháp).
// Khớp theo gốc từ để chấp nhận biến thể: discuss → discussing, serve → serving.
// ─────────────────────────────────────

function stem(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.endsWith("e")) w = w.slice(0, -1);
  return w.slice(0, 5);
}

export function keywordUsed(answer: string, keyword: string): boolean {
  const s = stem(keyword);
  if (!s) return false;
  const words = answer.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return words.some((w) => w.startsWith(s));
}

export function countWords(answer: string): number {
  return answer.trim().split(/\s+/).filter(Boolean).length;
}
