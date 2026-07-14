// ── Connectors (Liên từ / Giới từ / Trạng từ liên kết) — Part 5 & 6 ──────────

/**
 * Loại ngữ pháp của một từ nối. Đây là trục phân loại quan trọng nhất:
 * ETS thường ra 4 đáp án CÙNG NGHĨA nhưng KHÁC LOẠI — chỉ cần nhìn xem sau
 * chỗ trống là mệnh đề hay danh từ là loại được 2–3 đáp án.
 */
export type ConnKind = "conj" | "prep" | "adv";

export const CONN_KIND_LABEL: Record<ConnKind, string> = {
  conj: "Liên từ (+ mệnh đề S+V)",
  prep: "Giới từ (+ danh từ / V-ing)",
  adv: "Trạng từ liên kết (nối 2 câu)",
};

/** Một từ nối trong bảng lý thuyết của nhóm */
export type Connector = {
  word: string; // "although"
  kind: ConnKind;
  vi: string; // "mặc dù"
  /** Sắc thái / lưu ý dùng, ví dụ: "chỉ dùng khi đối lập trực tiếp 2 vế" */
  note?: string;
};

// ── Question kinds ───────────────────────────────────────────────────────────

/** L1 / L2: kéo từ nối vào đúng cột. Bấm chọn từ → bấm cột. */
export type MatchingQuestion = {
  kind: "matching";
  id: string;
  instruction: string;
  /** 2–4 cột */
  buckets: { id: string; label: string; hint?: string }[];
  /** Mỗi item thuộc đúng 1 bucket (theo bucket.id) */
  items: { text: string; bucket: string }[];
  explanation: string;
};

/**
 * Part 5 (câu đơn) và Part 6 (đoạn văn) dùng chung kiểu này.
 * Nếu có `passageId`, client sẽ render đoạn văn tương ứng phía trên và
 * làm nổi bật chỗ trống số `blankNo`.
 */
export type ConnMCQ = {
  kind: "mcq";
  id: string;
  /** Trỏ tới Passage.id trong level.passages — chỉ có ở câu Part 6 */
  passageId?: string;
  /** Chỗ trống thứ mấy trong đoạn văn (1-based) */
  blankNo?: number;
  /** Part 5: câu có chỗ trống. Part 6: có thể để "" vì câu nằm trong đoạn văn. */
  sentence: string;
  translation?: string;
  grammarHint?: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  explanationVi?: string;
};

export type ConnQuestion = MatchingQuestion | ConnMCQ;

/** Đoạn văn Part 6. Trong `text`, chỗ trống viết dạng (1) ___ , (2) ___ … */
export type Passage = {
  id: string;
  /** Ví dụ: "To: All Staff · Subject: Office Relocation" */
  title?: string;
  text: string;
  translation?: string;
};

// ── Level & Group ────────────────────────────────────────────────────────────

export type LevelSlug = "l1" | "l2" | "l3" | "l4" | "l5" | "l6";
export type LevelDifficulty = "easy" | "medium" | "hard";

export type ConnLevel = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  slug: LevelSlug;
  name: string;
  nameEn: string;
  description: string;
  instruction: string;
  difficulty: LevelDifficulty;
  passThreshold: number; // 80
  /** Chỉ dùng ở L5/L6 khi có câu Part 6 */
  passages?: Passage[];
  questions: ConnQuestion[];
};

export type GroupImportance = 1 | 2 | 3;

export type ConnGroupConfig = {
  slug: string; // "tuong-phan"
  name: string; // "Tương phản & Nhượng bộ"
  nameEn: string; // "Contrast & Concession"
  description: string;
  importance: GroupImportance;
  /** Bảng lý thuyết hiển thị ở trang nhóm */
  connectors: Connector[];
  levels: ConnLevel[];
};

// ── DB helpers ───────────────────────────────────────────────────────────────

/** Chuyển group slug → field `part` lưu trong subskill_attempts */
export function groupToPartKey(groupSlug: string): string {
  return `conn-${groupSlug}`;
}

export type BestScore = { score: number; passed: boolean };
