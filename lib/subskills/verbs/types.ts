// ── Động từ bất quy tắc (Irregular Verbs) ────────────────────────────────────

/** Hình dạng biến đổi của động từ — trục phân loại cốt lõi để ghi nhớ */
export type VerbShape = "AAA" | "ABB" | "ABA" | "ABC";

export const SHAPE_LABEL: Record<VerbShape, string> = {
  AAA: "Không đổi (V1 = V2 = V3)",
  ABB: "V2 = V3",
  ABA: "V1 = V3",
  ABC: "Cả 3 khác nhau",
};

export const SHAPE_HINT: Record<VerbShape, string> = {
  AAA: "cut – cut – cut",
  ABB: "buy – bought – bought",
  ABA: "come – came – come",
  ABC: "go – went – gone",
};

export type Verb = {
  v1: string;
  /** Dạng chuẩn hiển thị khi chấm (biến thể khác nằm ở acceptV2) */
  v2: string;
  v3: string;
  /** Biến thể được chấp nhận khi gõ, ví dụ learnt / learned */
  acceptV2?: string[];
  acceptV3?: string[];
  vi: string;
  /** 3 = rất hay gặp trong TOEIC, 1 = ít gặp */
  freq: 1 | 2 | 3;
  shape: VerbShape;
  /** Nhóm quy luật (group slug) */
  group: string;
  /** Lưu ý đặc biệt: phát âm, dễ nhầm… */
  note?: string;
};

// ── Question kinds ───────────────────────────────────────────────────────────

/** L1: xếp động từ vào đúng dạng biến đổi */
export type VerbMatching = {
  kind: "matching";
  id: string;
  instruction: string;
  buckets: { id: string; label: string; hint?: string }[];
  items: { text: string; bucket: string }[];
  explanation: string;
};

/** L2 / L3 / L4: gõ V2 và/hoặc V3 */
export type VerbTyping = {
  kind: "typing";
  id: string;
  v1: string;
  vi: string;
  /** Ô nào cần gõ */
  fields: ("v2" | "v3")[];
  /** Đáp án được chấp nhận cho từng ô (đã gồm biến thể) */
  accepted: { v2?: string[]; v3?: string[] };
  /** Dạng chuẩn để hiển thị khi chấm */
  display: { v2: string; v3: string };
  note?: string;
};

/** L5: điền dạng đúng của động từ vào câu */
export type VerbBlank = {
  kind: "blank";
  id: string;
  /** Câu có chỗ trống, viết bằng ___ */
  sentence: string;
  translation?: string;
  /** Động từ nguyên mẫu cho sẵn trong ngoặc */
  prompt: string;
  accepted: string[];
  display: string;
  explanation: string;
};

/** L6: TOEIC Part 5 */
export type VerbMCQ = {
  kind: "mcq";
  id: string;
  sentence: string;
  translation?: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  explanation: string;
};

export type VerbQuestion = VerbMatching | VerbTyping | VerbBlank | VerbMCQ;

// ── Level & Group ────────────────────────────────────────────────────────────

export type LevelSlug = "l1" | "l2" | "l3" | "l4" | "l5" | "l6";
export type LevelDifficulty = "easy" | "medium" | "hard";

export type VerbLevel = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  slug: LevelSlug;
  name: string;
  nameEn: string;
  description: string;
  instruction: string;
  difficulty: LevelDifficulty;
  passThreshold: number;
  questions: VerbQuestion[];
};

export type VerbGroupConfig = {
  slug: string;
  name: string;
  nameEn: string;
  /** Mô tả quy luật của nhóm */
  description: string;
  /** Ví dụ mẫu hiển thị trên thẻ nhóm, ví dụ "buy – bought – bought" */
  sample: string;
  importance: 1 | 2 | 3;
  verbs: Verb[];
  levels: VerbLevel[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Chuẩn hoá chuỗi người học gõ vào trước khi so sánh */
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isTypedAnswerCorrect(input: string, accepted: string[]): boolean {
  const n = normalizeAnswer(input);
  if (!n) return false;
  return accepted.some((a) => normalizeAnswer(a) === n);
}

/** Chuyển group slug → field `part` lưu trong subskill_attempts */
export function groupToPartKey(groupSlug: string): string {
  return `verb-${groupSlug}`;
}

export type BestScore = { score: number; passed: boolean };
