// Kho đoạn nghe cho chế độ Nghe sâu.
//
// File dữ liệu ~830KB nên chỉ được import từ server component. Trang chi tiết
// lấy đúng một đoạn rồi truyền xuống client, không đẩy cả kho sang trình duyệt.

import data from "@/lib/subskills/part3/data/passages.json";

export type TranscriptLine = {
  /** "W" / "M" ở Part 3; null ở Part 4 vì chỉ có một người nói */
  speaker: string | null;
  text: string;
};

export type PassageKeyword = {
  term: string;
  ipa: string;
  pos: string;
  meaning: string;
};

export type PassageQuestion = {
  number: number;
  position: "first" | "middle" | "last";
  labelVi: string;
  prompt: string;
  options: Record<string, string>;
  answer: string;
  reasoning: string;
};

export type Passage = {
  groupId: string;
  testNumber: number;
  part: 3 | 4;
  questionStart: number;
  questionEnd: number;
  audioUrl: string;
  image: string | null;
  lines: TranscriptLine[];
  keywords: PassageKeyword[];
  questions: PassageQuestion[];
};

const PASSAGES = (data as unknown as { passages: Passage[] }).passages;

export function listPassages(part?: 3 | 4): Passage[] {
  return part ? PASSAGES.filter((p) => p.part === part) : PASSAGES;
}

export function getPassage(groupId: string): Passage | undefined {
  return PASSAGES.find((p) => p.groupId === groupId);
}

export function passageCount(): number {
  return PASSAGES.length;
}

/** Nhãn ngắn hiển thị trong danh sách: "Đề 3 · Part 4 · câu 71-73" */
export function passageLabel(p: Passage): string {
  return `Đề ${p.testNumber} · Part ${p.part} · câu ${p.questionStart}-${p.questionEnd}`;
}

/** 5 bước nghe chủ động — thứ tự cố định, dùng chung giữa trang và client */
export const DEEP_STEPS = [
  {
    id: "quiz",
    title: "Làm 3 câu hỏi",
    hint: "Nghe rồi trả lời như đi thi. Chưa mở transcript. Ghi lại số câu đúng để lát nữa so.",
  },
  {
    id: "vocab",
    title: "Đọc transcript, tra từ mới",
    hint: "Đọc kỹ lời thoại và bảng từ mới. Chỗ nào nghe hụt lúc nãy, giờ phải hiểu vì sao.",
  },
  {
    id: "shadow",
    title: "Nghe theo transcript và đọc theo",
    hint: "Nghe từng lượt nói kèm chữ, đọc nhại theo. Mục tiêu 10-20 lượt cho cả đoạn.",
  },
  {
    id: "blind",
    title: "Nghe chay, không transcript",
    hint: "Tắt chữ, nghe lại. Còn chỗ nào không hiểu thì quay về bước 3.",
  },
  {
    id: "done",
    title: "Nghe đến khi thuộc",
    hint: "Hiểu trọn đoạn và gần như thuộc lời thì đánh dấu xong, chuyển đoạn khác.",
  },
] as const;

export type DeepStepId = (typeof DEEP_STEPS)[number]["id"];
