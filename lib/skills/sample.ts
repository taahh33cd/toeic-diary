// Data mẫu cho khung màn thi 4 kỹ năng (Listening/Reading/Speaking).
// Writing Q1-5 dùng data riêng ở writing-q1-5.ts.

export type McqOption = { id: "A" | "B" | "C" | "D"; text: string };
export type McqItem = {
  id: string;
  /** Câu dẫn: với Listening là lời thoại được đọc (TTS); với Reading là câu có chỗ trống */
  prompt: string;
  options: McqOption[];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};

// ── Reading · Part 5 — Incomplete Sentences ──
export const READING_PART5: McqItem[] = [
  {
    id: "r5-1",
    prompt: "The marketing team will _____ the new campaign at next week's conference.",
    options: [
      { id: "A", text: "present" },
      { id: "B", text: "presentation" },
      { id: "C", text: "presented" },
      { id: "D", text: "presenting" },
    ],
    answer: "A",
    explanation: "Sau trợ động từ \"will\" cần động từ nguyên mẫu → present.",
  },
  {
    id: "r5-2",
    prompt: "All employees must submit their reports _____ Friday afternoon.",
    options: [
      { id: "A", text: "on" },
      { id: "B", text: "by" },
      { id: "C", text: "until" },
      { id: "D", text: "during" },
    ],
    answer: "B",
    explanation: "\"by\" = hạn chót (trước hoặc đúng lúc đó); phù hợp với deadline nộp báo cáo.",
  },
  {
    id: "r5-3",
    prompt: "The manager was very _____ with the quarterly sales results.",
    options: [
      { id: "A", text: "please" },
      { id: "B", text: "pleasing" },
      { id: "C", text: "pleased" },
      { id: "D", text: "pleasure" },
    ],
    answer: "C",
    explanation: "Người có cảm xúc → tính từ đuôi -ed: pleased (hài lòng).",
  },
  {
    id: "r5-4",
    prompt: "_____ the heavy rain, the outdoor event was held as scheduled.",
    options: [
      { id: "A", text: "Although" },
      { id: "B", text: "Despite" },
      { id: "C", text: "Because" },
      { id: "D", text: "However" },
    ],
    answer: "B",
    explanation: "\"Despite\" + cụm danh từ (the heavy rain). \"Although\" phải đi với mệnh đề.",
  },
  {
    id: "r5-5",
    prompt: "Ms. Tanaka has worked at the firm _____ more than ten years.",
    options: [
      { id: "A", text: "since" },
      { id: "B", text: "during" },
      { id: "C", text: "for" },
      { id: "D", text: "by" },
    ],
    answer: "C",
    explanation: "\"for\" + khoảng thời gian (ten years). \"since\" đi với mốc thời gian.",
  },
  {
    id: "r5-6",
    prompt: "The new software allows users to complete tasks more _____ than before.",
    options: [
      { id: "A", text: "efficient" },
      { id: "B", text: "efficiently" },
      { id: "C", text: "efficiency" },
      { id: "D", text: "efficiencies" },
    ],
    answer: "B",
    explanation: "Bổ nghĩa cho động từ \"complete\" → trạng từ efficiently.",
  },
];

// ── Listening · Part 2 — Question-Response (spoken via TTS) ──
export const LISTENING_PART2: McqItem[] = [
  {
    id: "l2-1",
    prompt: "Where is the nearest train station?",
    options: [
      { id: "A", text: "It's two blocks north of here." },
      { id: "B", text: "The train was on time." },
      { id: "C", text: "I bought a return ticket." },
    ],
    answer: "A",
    explanation: "Câu hỏi \"Where\" → trả lời địa điểm: two blocks north.",
  },
  {
    id: "l2-2",
    prompt: "Who's giving the presentation this afternoon?",
    options: [
      { id: "A", text: "In the main conference room." },
      { id: "B", text: "Ms. Rivera from marketing." },
      { id: "C", text: "About the new product line." },
    ],
    answer: "B",
    explanation: "Câu hỏi \"Who\" → trả lời người: Ms. Rivera.",
  },
  {
    id: "l2-3",
    prompt: "Would you like some coffee or tea?",
    options: [
      { id: "A", text: "Tea would be great, thanks." },
      { id: "B", text: "Yes, I like it." },
      { id: "C", text: "The café is closed." },
    ],
    answer: "A",
    explanation: "Câu hỏi lựa chọn (or) → chọn một: Tea would be great.",
  },
  {
    id: "l2-4",
    prompt: "You've already sent the invoice, haven't you?",
    options: [
      { id: "A", text: "A new printer." },
      { id: "B", text: "Yes, this morning." },
      { id: "C", text: "On the top shelf." },
    ],
    answer: "B",
    explanation: "Câu hỏi đuôi xác nhận → Yes, this morning (đã gửi rồi).",
  },
  {
    id: "l2-5",
    prompt: "Why was the shipment delayed?",
    options: [
      { id: "A", text: "By express delivery." },
      { id: "B", text: "There was a problem at customs." },
      { id: "C", text: "About fifty boxes." },
    ],
    answer: "B",
    explanation: "Câu hỏi \"Why\" → trả lời lý do: a problem at customs.",
  },
];

// ── Speaking · Q3-4 — Describe a picture ──
export type SpeakingItem = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  credit: string;
  prepSeconds: number;
  responseSeconds: number;
  sampleResponse: string;
  tips: string[];
};

const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

export const SPEAKING_Q3_4: SpeakingItem[] = [
  {
    id: "s34-1",
    imageUrl: U("photo-1517048676732-d65bc937f952"),
    imageAlt: "Nhóm người trong một cuộc họp quanh bàn.",
    credit: "Dylan Gillis / Unsplash",
    prepSeconds: 45,
    responseSeconds: 30,
    sampleResponse:
      "This picture was taken in an office. In the center, a group of people are having a meeting around a table. They are looking at some documents and seem to be discussing a project. On the right, a woman is taking notes. The atmosphere looks professional and focused.",
    tips: [
      "Mở đầu bằng nơi chốn: \"This picture was taken in…\".",
      "Tả tổng thể trước, rồi chi tiết theo vị trí (center, on the left/right).",
      "Dùng hiện tại tiếp diễn cho hành động đang diễn ra.",
    ],
  },
  {
    id: "s34-2",
    imageUrl: U("photo-1553877522-43269d4ea984"),
    imageAlt: "Một người đàn ông đang làm việc bên laptop.",
    credit: "charlesdeluvio / Unsplash",
    prepSeconds: 45,
    responseSeconds: 30,
    sampleResponse:
      "This is a photo of a workplace. In the foreground, a man is sitting at a desk and working on his laptop. There are some papers and a cup of coffee next to him. In the background, I can see large windows with natural light. Overall, it looks like a busy but comfortable working environment.",
    tips: [
      "Nêu foreground / background để bố cục câu trả lời rõ ràng.",
      "Thêm chi tiết nhỏ (papers, a cup of coffee) để kéo dài đủ thời gian.",
      "Kết bằng một nhận xét chung về không khí bức ảnh.",
    ],
  },
];
