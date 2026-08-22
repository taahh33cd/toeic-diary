import type { TransLevel } from "./types";

// Thang 6 level dùng chung cho mọi nhóm vấn đề dịch.
// Tách khỏi index.ts để data/*.ts import được mà không tạo vòng lặp.

export function buildLevelMeta(): Omit<TransLevel, "questions">[] {
  return [
    {
      level: 1,
      slug: "l1",
      name: "Nhận diện",
      nameEn: "Identify",
      description: "Bấm vào thành phần cốt lõi của câu tiếng Anh.",
      instruction:
        "Chưa dịch vội. Trước hết phải nhìn ra bộ khung của câu — bấm đúng thành phần được yêu cầu.",
      difficulty: "easy",
      passThreshold: 80,
    },
    {
      level: 2,
      slug: "l2",
      name: "Bản dịch nào đúng",
      nameEn: "Spot the Good Translation",
      description: "3 bản dịch, chỉ 1 bản đúng. Chọn và biết vì sao 2 bản kia sai.",
      instruction:
        "Đọc câu tiếng Anh rồi chọn bản dịch tiếng Việt đúng nhất. Hai bản còn lại là lỗi học sinh hay mắc.",
      difficulty: "easy",
      passThreshold: 80,
    },
    {
      level: 3,
      slug: "l3",
      name: "Xếp lại trật tự",
      nameEn: "Reorder",
      description: "Bấm các mảnh tiếng Việt theo đúng thứ tự.",
      instruction:
        "Bấm lần lượt các mảnh để ghép thành câu tiếng Việt tự nhiên. Bấm lại một mảnh đã chọn để bỏ ra.",
      difficulty: "medium",
      passThreshold: 80,
    },
    {
      level: 4,
      slug: "l4",
      name: "Vá bản dịch",
      nameEn: "Repair",
      description: "Bản dịch bị hỏng vài chỗ — chọn phương án đúng để vá.",
      instruction:
        "Bản dịch dưới đây gần đúng nhưng hỏng ở chỗ trống. Chọn phương án đúng cho từng chỗ.",
      difficulty: "medium",
      passThreshold: 80,
    },
    {
      level: 5,
      slug: "l5",
      name: "Dịch câu",
      nameEn: "Translate a Sentence",
      description: "Tự gõ bản dịch cả câu — AI chấm theo 4 tiêu chí.",
      instruction:
        "Gõ bản dịch tiếng Việt cho cả câu. AI chấm theo 4 tiêu chí: đủ ý, đúng quan hệ, tự nhiên, đúng sắc thái.",
      difficulty: "hard",
      passThreshold: 75,
    },
    {
      level: 6,
      slug: "l6",
      name: "Dịch đoạn Part 7",
      nameEn: "Translate a Part 7 Passage",
      description: "Dịch đoạn email/thông báo rồi trả lời câu hỏi hiểu ý.",
      instruction:
        "Dịch cả đoạn, sau đó trả lời câu hỏi hiểu ý. Dịch đúng chữ chưa đủ — phải nắm được người viết đang muốn gì.",
      difficulty: "hard",
      passThreshold: 75,
    },
  ];
}
