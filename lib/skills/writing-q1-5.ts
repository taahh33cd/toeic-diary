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

/** Khóa `part` khi lưu vào subskill_attempts + ngưỡng pass */
export const Q15_PART_KEY = "skills-writing-q1-5";
export const Q15_PASS = 60;

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
  {
    id: "q15-04",
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
    imageUrl: U("photo-1555955208-94f6fafea771"),
    imageAlt: "Một người phụ nữ cầm chiếc chĩa làm vườn ngoài vườn.",
    credit: { author: "Quilia / Unsplash" },
    keywords: ["woman", "garden"],
    modelAnswers: [
      "The woman is working in the garden.",
      "A woman is holding a fork in the garden.",
    ],
    tip: "\"in the garden\" — địa điểm dùng giới từ in.",
  },
  {
    id: "q15-06",
    imageUrl: U("photo-1562793440-5e60349d130d"),
    imageAlt: "Nhiều người đang đi bộ trên đường phố vào ban ngày.",
    credit: { author: "Rich Smith / Unsplash" },
    keywords: ["people", "walk"],
    modelAnswers: [
      "The people are walking along the street.",
      "Some people are walking on the street during the day.",
    ],
    tip: "\"people\" là số nhiều → dùng are walking.",
  },
  {
    id: "q15-07",
    imageUrl: U("photo-1526152505827-d2f3b5b4a52a"),
    imageAlt: "Một người phụ nữ đang xem sản phẩm khi mua sắm trong cửa hàng.",
    credit: { author: "Bernard Hermant / Unsplash" },
    keywords: ["woman", "shop"],
    modelAnswers: [
      "The woman is shopping in the supermarket.",
      "A woman is looking at a product while she is shopping.",
    ],
    tip: "\"shop\" (v) = đi mua sắm → is shopping.",
  },
  {
    id: "q15-08",
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
    imageUrl: U("photo-1758691461935-202e2ef6b69f"),
    imageAlt: "Một bác sĩ đang trò chuyện với bệnh nhân trong phòng khám.",
    credit: { author: "Vitaly Gariev / Unsplash" },
    keywords: ["doctor", "patient"],
    modelAnswers: [
      "The doctor is talking to the patient.",
      "A doctor is examining a patient in the office.",
    ],
    tip: "Hai danh từ đều phải xuất hiện: doctor (chủ ngữ) + patient (tân ngữ).",
  },
  {
    id: "q15-10",
    imageUrl: U("photo-1722550428229-d5be1e371ba7"),
    imageAlt: "Một nhóm người đang băng qua đường vào buổi tối.",
    credit: { author: "Mariia Yesionova / Unsplash" },
    keywords: ["people", "cross"],
    modelAnswers: [
      "The people are crossing the street.",
      "A group of people is crossing the road at night.",
    ],
    tip: "\"cross the street\" = băng qua đường (không cần giới từ sau cross).",
  },
  {
    id: "q15-11",
    imageUrl: U("photo-1641029956071-272caab5857a"),
    imageAlt: "Một người phụ nữ đang đứng ở quầy thu ngân trong cửa hàng.",
    credit: { author: "sq lim / Unsplash" },
    keywords: ["woman", "stand"],
    modelAnswers: [
      "The woman is standing at the cash register.",
      "A woman is standing behind the counter in a store.",
    ],
    tip: "\"stand at/behind\" — chọn giới từ chỉ vị trí phù hợp.",
  },
  {
    id: "q15-12",
    imageUrl: U("photo-1577219492769-b63a779fac28"),
    imageAlt: "Một đầu bếp đang chuẩn bị nhiều món ăn trên bàn bếp.",
    credit: { author: "Louis Hansel / Unsplash" },
    keywords: ["food", "prepare"],
    modelAnswers: [
      "The chef is preparing food on the table.",
      "Some food is being prepared in the kitchen.",
    ],
    tip: "\"prepare food\" = chuẩn bị món ăn. Có thể dùng bị động: food is being prepared.",
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
