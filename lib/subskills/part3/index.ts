// Subskill Listening Part 3 + Part 4.
//
// Dữ liệu sinh tự động từ 10 đề EST 2026 bằng:
//   scripts/part34/build-question-bank.mjs  → kho câu hỏi có nhãn
//   scripts/part34/build-drills.mjs         → 5 file cấp độ dưới data/
//
// Mọi dạng bài đều là trắc nghiệm, khác nhau ở phần hiển thị kèm theo
// (audio / khối ngữ cảnh / transcript), nên chỉ cần một trình chạy chung.

import l1 from "@/lib/subskills/part3/data/l1.json";
import l2 from "@/lib/subskills/part3/data/l2.json";
import l3 from "@/lib/subskills/part3/data/l3.json";
import l4 from "@/lib/subskills/part3/data/l4.json";
import l5 from "@/lib/subskills/part3/data/l5.json";

export type Part3LevelId = "l1" | "l2" | "l3" | "l4" | "l5";

export type DrillKind =
  | "classify"
  | "position"
  | "predict-set"
  | "listen-mcq"
  | "full-set"
  | "evidence"
  | "paraphrase"
  | "trap"
  | "fill-blank";

export type DrillItem = {
  id: string;
  /** Câu lệnh chính hiển thị phía trên phương án */
  question: string;
  /** Khối ngữ cảnh phụ (câu hỏi tiếng Anh, dòng transcript có chỗ trống…) */
  context?: string | null;
  options: string[];
  correct: number;
  explanation: string;
  audioUrl?: string | null;
  /** Chỉ cho nghe bấy nhiêu giây đầu — dùng cho bài đoán từ phần mở đầu */
  audioPreviewSeconds?: number | null;
  image?: string | null;
  transcript?: string | null;
  /** Các câu cùng groupId thuộc chung một đoạn nghe */
  groupId?: string;
  part?: 3 | 4;
  label?: string;
  labelVi?: string;
  position?: "first" | "middle" | "last";
};

export type Drill = {
  id: string;
  kind: DrillKind;
  title: string;
  instruction: string;
  /** Giấu phương án đến khi bấm nghe — mô phỏng thi trên máy, không đọc trước */
  hideOptionsUntilPlayed?: boolean;
  items: DrillItem[];
};

/** Khi nào được xem transcript */
export type TranscriptPolicy = "always" | "after-2" | "after-submit" | "never";

export type Part3Level = {
  level: Part3LevelId;
  band: string;
  title: string;
  goal: string;
  passThreshold: number;
  config: {
    playbackRate: number;
    transcriptPolicy: TranscriptPolicy;
    /** null = nghe lại thoải mái */
    replayLimit: number | null;
  };
  drills: Drill[];
};

export const PART3_LEVELS = [l1, l2, l3, l4, l5] as unknown as Part3Level[];

export function getPart3Level(level: string): Part3Level | undefined {
  return PART3_LEVELS.find((l) => l.level === level);
}

export function getPart3Drill(level: string, drillId: string): Drill | undefined {
  return getPart3Level(level)?.drills.find((d) => d.id === drillId);
}

/** Khoá `part` dùng khi ghi bảng subskill_attempts */
export function part3AttemptKey(level: Part3LevelId): string {
  return `part3-${level}`;
}

export const TRANSCRIPT_POLICY_VI: Record<TranscriptPolicy, string> = {
  always: "Transcript hiện sẵn",
  "after-2": "Transcript mở sau 2 lần nghe",
  "after-submit": "Transcript chỉ mở sau khi trả lời",
  never: "Không có transcript",
};
