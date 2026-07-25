// Dữ liệu luyện đề TOEIC Writing Questions 1-5:
// "Write a sentence based on a picture" — viết 1 câu mô tả ảnh, bắt buộc dùng 2 từ cho trước.
//
// Ảnh: Unsplash (Unsplash License — miễn phí dùng thương mại, không bắt buộc ghi nguồn
// nhưng vẫn hiển thị credit tác giả cho đúng tinh thần).

/**
 * Mức độ khó. Chấm theo ảnh trước (ảnh gate mức), rồi sinh cặp từ khớp mức:
 * - easy: ảnh 1 chủ thể + 1 hành động rõ → cặp từ = danh từ + động từ hành động
 * - medium: 2-3 chủ thể hoặc có quan hệ vị trí → cặp từ = danh từ + giới từ
 * - hard: cảnh đông / 2 hành động song song / trọng tâm là vật thể
 *   → cặp từ có liên từ (while, because) hoặc động từ buộc dùng bị động
 *
 * Ảnh 1 chủ thể không được gán hard: cặp từ liên từ sẽ ép học viên bịa mệnh đề.
 */
export type Q15Difficulty = "easy" | "medium" | "hard";

export interface WritingQ15Exercise {
  id: string;
  difficulty: Q15Difficulty;
  imageUrl: string;
  imageAlt: string;
  /** Chỉ có với ảnh Unsplash; ảnh tư liệu giáo viên để trống */
  credit?: { author: string };
  /** Hai từ bắt buộc phải dùng trong câu */
  keywords: [string, string];
  /** 1–2 câu mẫu để học viên tự đối chiếu */
  modelAnswers: string[];
  /** Gợi ý ngữ pháp/cách dùng */
  tip: string;
}

/** Khóa `part` khi lưu vào subskill_attempts + ngưỡng pass */
export const Q15_PART_KEY = "skills-writing-q1-5";
export const Q15_PASS = 60;

import { WRITING_Q1_5_BANK } from "./writing-q1-5-bank";

const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

/** 15 ảnh Unsplash gốc — đã gán mức độ và chỉnh cặp từ về đúng khuôn từng mức. */
const WRITING_Q1_5_UNSPLASH: WritingQ15Exercise[] = [
  {
    id: "q15-01",
    difficulty: "medium",
    imageUrl: U("photo-1517048676732-d65bc937f952"),
    imageAlt: "Một nhóm đồng nghiệp ngồi quanh bàn, cầm bút và trao đổi trong cuộc họp.",
    credit: { author: "Dylan Gillis / Unsplash" },
    keywords: ["colleagues", "around"],
    modelAnswers: [
      "The colleagues are sitting around a table.",
      "Some colleagues are talking around the table in a meeting.",
    ],
    tip: "around = xung quanh (bao quanh một vật). Rất hay dùng: sit around a table.",
  },
  {
    id: "q15-02",
    difficulty: "easy",
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
    difficulty: "easy",
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
  {
    id: "q15-04",
    difficulty: "easy",
    imageUrl: U("photo-1600565193348-f74bd3c7ccdf"),
    imageAlt: "Một đầu bếp mặc đồng phục trắng đang nấu ăn trong bếp.",
    credit: { author: "Johnathan Macedo / Unsplash" },
    keywords: ["chef", "cook"],
    modelAnswers: [
      "The chef is cooking in the kitchen.",
      "A chef is preparing food in a restaurant kitchen.",
    ],
    tip: "\"in the kitchen\" — dùng giới từ in với không gian bên trong.",
  },
  {
    id: "q15-05",
    difficulty: "medium",
    imageUrl: U("photo-1555955208-94f6fafea771"),
    imageAlt: "Một người phụ nữ cầm chiếc chĩa làm vườn ngoài vườn.",
    credit: { author: "Quilia / Unsplash" },
    keywords: ["woman", "in"],
    modelAnswers: [
      "The woman is working in the garden.",
      "A woman is holding a garden fork in the garden.",
    ],
    tip: "in + không gian có ranh giới: in the garden, in the yard, in the park.",
  },
  {
    id: "q15-06",
    difficulty: "medium",
    imageUrl: U("photo-1562793440-5e60349d130d"),
    imageAlt: "Nhiều người đang đi bộ trên đường phố vào ban ngày.",
    credit: { author: "Rich Smith / Unsplash" },
    keywords: ["people", "along"],
    modelAnswers: [
      "People are walking along the street.",
      "Some people are walking along the road during the day.",
    ],
    tip: "along = dọc theo (đường, bờ sông). \"people\" là số nhiều → are walking.",
  },
  {
    id: "q15-07",
    difficulty: "medium",
    imageUrl: U("photo-1526152505827-d2f3b5b4a52a"),
    imageAlt: "Một người phụ nữ đang xem sản phẩm khi mua sắm trong cửa hàng.",
    credit: { author: "Bernard Hermant / Unsplash" },
    keywords: ["woman", "at"],
    modelAnswers: [
      "The woman is looking at a product in a store.",
      "A woman is looking at the items on the shelf.",
    ],
    tip: "look at + vật được nhìn. Nhớ at, không nói \"look a product\".",
  },
  {
    id: "q15-08",
    difficulty: "easy",
    imageUrl: U("photo-1528629297340-d1d466945dc5"),
    imageAlt: "Một người đàn ông đang đạp xe trên đường vào ban ngày.",
    credit: { author: "Jonny Kennaugh / Unsplash" },
    keywords: ["man", "ride"],
    modelAnswers: [
      "The man is riding a bicycle on the road.",
      "A man is riding his bike down the street.",
    ],
    tip: "\"ride a bicycle/bike\" — nhớ mạo từ a trước bicycle.",
  },
  {
    id: "q15-09",
    difficulty: "medium",
    imageUrl: U("photo-1758691461935-202e2ef6b69f"),
    imageAlt: "Một bác sĩ đang trò chuyện với bệnh nhân trong phòng khám.",
    credit: { author: "Vitaly Gariev / Unsplash" },
    keywords: ["patient", "to"],
    modelAnswers: [
      "The doctor is talking to the patient.",
      "A doctor is explaining something to a patient in the office.",
    ],
    tip: "talk/speak/explain + to + người nghe. Không nói \"talk the patient\".",
  },
  {
    id: "q15-10",
    difficulty: "hard",
    imageUrl: U("photo-1722550428229-d5be1e371ba7"),
    imageAlt: "Một nhóm người đang băng qua đường vào buổi tối.",
    credit: { author: "Mariia Yesionova / Unsplash" },
    keywords: ["people", "while"],
    modelAnswers: [
      "People are crossing the street while the cars are waiting.",
      "While the traffic has stopped, people are crossing the road.",
    ],
    tip: "while nối hai hành động cùng lúc → mỗi mệnh đề phải đủ S + V.",
  },
  {
    id: "q15-11",
    difficulty: "medium",
    imageUrl: U("photo-1641029956071-272caab5857a"),
    imageAlt: "Một người phụ nữ đang đứng ở quầy thu ngân trong cửa hàng.",
    credit: { author: "sq lim / Unsplash" },
    keywords: ["woman", "behind"],
    modelAnswers: [
      "The woman is standing behind the counter.",
      "A woman is working behind the cash register in a store.",
    ],
    tip: "behind = phía sau. Người bán đứng behind the counter, khách đứng in front of it.",
  },
  {
    id: "q15-12",
    difficulty: "hard",
    imageUrl: U("photo-1577219492769-b63a779fac28"),
    imageAlt: "Một đầu bếp đang chuẩn bị nhiều món ăn trên bàn bếp.",
    credit: { author: "Louis Hansel / Unsplash" },
    keywords: ["food", "arrange"],
    modelAnswers: [
      "The food is arranged on the counter.",
      "Several dishes are being arranged on the kitchen table.",
    ],
    tip: "Trọng tâm là món ăn, không phải người → bị động: is arranged / is being arranged.",
  },
  {
    id: "q15-13",
    difficulty: "easy",
    imageUrl: U("photo-1664382953518-4a664ab8a8c9"),
    imageAlt: "Một người đang viết lên bảng trắng.",
    credit: { author: "Centre for Ageing Better / Unsplash" },
    keywords: ["teacher", "write"],
    modelAnswers: [
      "The teacher is writing on the whiteboard.",
      "A teacher is writing something on the board.",
    ],
    tip: "\"write on the whiteboard/board\" — giới từ on chỉ bề mặt.",
  },
  {
    id: "q15-14",
    difficulty: "easy",
    imageUrl: U("photo-1717281234297-3def5ae3eee1"),
    imageAlt: "Một người đàn ông đang lăn sơn lên tường.",
    credit: { author: "Ernys / Unsplash" },
    keywords: ["man", "paint"],
    modelAnswers: [
      "The man is painting the wall.",
      "A man is painting the wall with a roller.",
    ],
    tip: "\"paint the wall\" — paint đi thẳng với tân ngữ, không cần giới từ.",
  },
  {
    id: "q15-15",
    difficulty: "medium",
    imageUrl: U("photo-1728706613021-e447801e1ea6"),
    imageAlt: "Một người phụ nữ đội mũ, mặc tạp dề đang chăm sóc hoa.",
    credit: { author: "Amie Roussel / Unsplash" },
    keywords: ["woman", "with"],
    modelAnswers: [
      "The woman with a hat is taking care of the flowers.",
      "A woman with an apron is arranging some flowers.",
    ],
    tip: "with = có/mang theo, dùng để tả đặc điểm: the woman with a hat.",
  },
];

/** Toàn bộ đề: 15 ảnh Unsplash + bộ ảnh tư liệu giáo viên. */
export const WRITING_Q1_5: WritingQ15Exercise[] = [...WRITING_Q1_5_UNSPLASH, ...WRITING_Q1_5_BANK];

/** Lọc đề theo mức độ — dùng cho bộ chọn Easy/Medium/Hard ở UI. */
export function exercisesByLevel(level: Q15Difficulty): WritingQ15Exercise[] {
  return WRITING_Q1_5.filter((e) => e.difficulty === level);
}

export const Q15_LEVELS: { value: Q15Difficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "1 người, 1 hành động · danh từ + động từ" },
  { value: "medium", label: "Medium", hint: "Nhiều người, có vị trí · danh từ + giới từ" },
  { value: "hard", label: "Hard", hint: "Cảnh phức tạp · liên từ hoặc bị động" },
];

/** Số câu mỗi test (đúng format thật: Q1-5 = 5 câu / test) */
export const Q15_TEST_SIZE = 5;

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
