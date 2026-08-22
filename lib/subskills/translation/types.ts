// ── Exercise question types ──────────────────────────────────────────────────
// 5 dạng bài cho subskill Dịch Anh–Việt. L1–L4 tự chấm, L5–L6 do AI chấm.

/** L1 — Bấm vào thành phần cốt lõi trong câu tiếng Anh */
export type TransHighlight = {
  kind: "highlight";
  id: string;
  /** Câu tiếng Anh, hiển thị dạng chip bấm được */
  sentence: string;
  /** Yêu cầu cụ thể, vd "Bấm vào danh từ chính của cụm" */
  instruction: string;
  /** Các từ phải bấm (so khớp sau khi bỏ dấu câu) */
  correctWords: string[];
  explanation: string;
};

/** L2 — Chọn bản dịch đúng trong 3 bản; 2 bản sai là lỗi thật của học sinh */
export type TransCompare = {
  kind: "compare";
  id: string;
  sentence: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
  /** Ghi chú cho từng phương án, song song với options */
  optionNotes: [string, string, string];
  explanation: string;
};

/** L3 — Xếp các mảnh tiếng Việt xáo trộn về đúng trật tự */
export type TransOrder = {
  kind: "order";
  id: string;
  sentence: string;
  /** Các mảnh theo ĐÚNG thứ tự — client tự xáo trộn */
  chunks: string[];
  /** Mảnh mồi nhử (dịch sai) trộn chung vào pool — chọn phải là sai */
  distractors?: string[];
  hint?: string;
  explanation: string;
};

/** L4 — Vá bản dịch tiếng Việt bị hỏng ở 1–2 chỗ */
export type TransRepairBlank = {
  options: [string, string, string];
  correct: 0 | 1 | 2;
  /** Vì sao đáp án đúng / các phương án kia sai */
  note: string;
};

export type TransRepair = {
  kind: "repair";
  id: string;
  sentence: string;
  /** Bản dịch tiếng Việt, mỗi chỗ hỏng đánh dấu bằng "___" theo thứ tự blanks */
  draft: string;
  blanks: TransRepairBlank[];
  explanation: string;
};

/** Câu hỏi hiểu ý kèm theo bài dịch đoạn (L6) */
export type TransComprehension = {
  question: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
  explanation: string;
};

/** L5, L6 — Dịch tự do, AI chấm theo rubric */
export type TransFree = {
  kind: "free";
  id: string;
  /** Câu (L5) hoặc đoạn 3–5 câu (L6) tiếng Anh */
  source: string;
  /** Bản dịch mẫu, hiện sau khi chấm */
  model: string;
  /** Điểm cần chú ý của câu này — đưa vào prompt chấm */
  focus: string;
  /** Các ý bắt buộc phải có trong bản dịch */
  keyPoints: string[];
  /** Chỉ L6: câu hỏi hiểu ý, tự chấm, tính 30% điểm câu */
  comprehension?: TransComprehension;
};

export type TransQuestion =
  | TransHighlight
  | TransCompare
  | TransOrder
  | TransRepair
  | TransFree;

// ── Level config ─────────────────────────────────────────────────────────────

export type TransLevelSlug = "l1" | "l2" | "l3" | "l4" | "l5" | "l6";
export type TransDifficulty = "easy" | "medium" | "hard";

export type TransLevel = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  slug: TransLevelSlug;
  name: string;
  nameEn: string;
  description: string;
  instruction: string;
  difficulty: TransDifficulty;
  /** 80 cho L1–L4 (tự chấm), 75 cho L5–L6 (AI chấm) */
  passThreshold: number;
  questions: TransQuestion[];
};

// ── Topic config ─────────────────────────────────────────────────────────────

/** 3 = gặp nhiều nhất trong TOEIC */
export type TransImportance = 1 | 2 | 3;

export type TransTopicConfig = {
  slug: string;
  name: string;
  nameEn: string;
  /** 1 câu mô tả vấn đề học sinh đang mắc */
  problem: string;
  /** Nguyên tắc chữa, hiện ở đầu trang nhóm */
  principle: string;
  /** Ví dụ ngắn minh hoạ lỗi: [câu Anh, bản dịch sai, bản dịch đúng] */
  sample: { en: string; wrong: string; right: string };
  importance: TransImportance;
  /** true nếu nhóm này gắn trực tiếp với kỹ năng làm Part 7 */
  part7: boolean;
  levels: TransLevel[];
};

// ── DB helpers ───────────────────────────────────────────────────────────────

/** Chuyển slug nhóm thành `part` lưu trong subskill_attempts */
export function topicToPartKey(topicSlug: string): string {
  return `tr-${topicSlug}`;
}

export type BestScore = { score: number; passed: boolean };

// ── AI grading contract ──────────────────────────────────────────────────────

/** 11 nhóm vấn đề — AI gán nhãn lỗi theo đây để thống kê điểm yếu */
export const ERROR_TAGS = [
  "cum-danh-tu",
  "tu-da-nghia",
  "cum-dong-tu",
  "thi-va-thoi",
  "bi-dong",
  "menh-de-quan-he",
  "danh-tu-hoa",
  "tham-chieu",
  "tu-noi",
  "sac-thai",
  "ham-y",
] as const;

export type ErrorTag = (typeof ERROR_TAGS)[number];

export const ERROR_TAG_LABELS: Record<ErrorTag, string> = {
  "cum-danh-tu": "Cụm danh từ / trật tự",
  "tu-da-nghia": "Chọn sai nghĩa",
  "cum-dong-tu": "Phrasal verb / collocation",
  "thi-va-thoi": "Thì & thời gian",
  "bi-dong": "Bị động",
  "menh-de-quan-he": "Mệnh đề quan hệ",
  "danh-tu-hoa": "Danh từ hoá",
  "tham-chieu": "Tham chiếu (it/this/they)",
  "tu-noi": "Từ nối / quan hệ logic",
  "sac-thai": "Sắc thái & lịch sự",
  "ham-y": "Hàm ý",
};

export type TransAssessResult = {
  /** 0–100 = tổng 4 tiêu chí */
  score: number;
  criteria: {
    completeness: number; // đủ ý, 0–25
    accuracy: number;     // đúng quan hệ, 0–25
    naturalness: number;  // tự nhiên tiếng Việt, 0–25
    tone: number;         // sắc thái, 0–25
  };
  /** Bản dịch của học sinh đã được sửa lại cho đúng và tự nhiên */
  corrected: string;
  feedback: string;
  errors: { tag: ErrorTag | null; detail: string }[];
};
