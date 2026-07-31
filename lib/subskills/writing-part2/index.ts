// ─────────────────────────────────────
// Writing Part 2 — Email
// Data JSON được viết thẳng ở dạng chuẩn hoá (không cần normalizer như Part 1)
// ─────────────────────────────────────

export type P2Difficulty = "easy" | "medium" | "hard";

/** Khối email hiển thị phía trên đề (đề bài gốc hoặc bài mẫu) */
export type EmailBlock = {
  from?: string;
  to?: string;
  subject?: string;
  sent?: string;
  body: string[];
  directions?: string;
};

/** Tầng 0 easy — ghép nửa câu */
export type MatchingEx = {
  type: "matching";
  id: string;
  prompt: string;
  pairs: { left: string; right: string }[];
  explanation: string;
};

/** Tầng 0 medium — điền chỗ trống bằng ngân hàng từ cho sẵn */
export type WordBankEx = {
  type: "word_bank";
  id: string;
  prompt?: string;
  sentence: string; // dùng ___ cho mỗi chỗ trống
  bank: string[];
  answers: string[];
  explanation: string;
};

/** Tầng 0 hard — xem câu mẫu rồi gõ lại */
export type RecallEx = {
  type: "recall";
  id: string;
  hintVi: string;
  answer: string;
  accepted?: string[];
  explanation: string;
};

/** Tầng 1 — trắc nghiệm trên email đề (một hoặc nhiều đáp án) */
export type McqEx = {
  type: "mcq";
  id: string;
  /** khoá tra trong P2TestData.emails — nhiều câu hỏi dùng chung một email */
  emailRef?: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  multi?: boolean;
  explanation: string;
};

/** Tầng 2 — gắn nhãn chức năng cho từng câu trong email mẫu */
export type LabelingEx = {
  type: "labeling";
  id: string;
  emailRef?: string;
  intro?: string;
  labels: string[];
  sentences: { text: string; label: string }[];
  explanation: string;
};

/** Tầng 2 hard — dựng lại email từ các câu xáo trộn */
export type OrderingEx = {
  type: "ordering";
  id: string;
  prompt: string;
  items: string[]; // theo đúng thứ tự đúng
  explanation: string;
};

/** Tầng 3/4 — gõ từ vào chỗ trống (không có ngân hàng từ như Tầng 0) */
export type TypeBlankEx = {
  type: "type_blank";
  id: string;
  prompt?: string;
  sentence: string; // dùng ___ cho mỗi chỗ trống
  answers: string[];
  /** biến thể chấp nhận được, chỉ số khớp với answers */
  accepted?: string[][];
  vi?: string;
  explanation: string;
};

/** Tầng 4 hard — sắp xếp từ xáo trộn thành câu chức năng hoàn chỉnh */
export type WordOrderEx = {
  type: "word_order";
  id: string;
  tokens: string[];
  answer: string;
  accepted?: string[];
  vi?: string;
  explanation: string;
};

/** Tầng 5 — dịch Việt sang Anh */
export type TranslateEx = {
  type: "translate";
  id: string;
  vi: string;
  answer: string;
  accepted?: string[];
  /** từ khoá gợi ý — chỉ dùng ở cấp easy cho người mới */
  hintWords?: string[];
  explanation: string;
};

export type P2Exercise =
  | MatchingEx
  | WordBankEx
  | RecallEx
  | McqEx
  | LabelingEx
  | OrderingEx
  | TypeBlankEx
  | WordOrderEx
  | TranslateEx;

export type P2Level = { difficulty: P2Difficulty; exercises: P2Exercise[] };
export type P2TestData = {
  skillId: string;
  testNum: number;
  /** Ngân hàng email dùng chung cho cả bộ test, tra bằng exercise.emailRef */
  emails: Record<string, EmailBlock>;
  levels: P2Level[];
};

// ─────────────────────────────────────
// Skill metadata — 7 tầng
// ─────────────────────────────────────

export type P2SkillMeta = {
  id: string;
  labelVi: string;
  label: string;
  description: string;
  dbPartPrefix: string;
  active: boolean;
};

export const WRITING_P2_SKILLS: P2SkillMeta[] = [
  {
    id: "tang0",
    labelVi: "Tầng 0: Câu email nền",
    label: "First Bricks",
    description: "Dành cho người chưa viết được câu nào. Ghép nửa câu, chọn từ có sẵn, gõ lại câu ngắn.",
    dbPartPrefix: "wp2-tang0",
    active: true,
  },
  {
    id: "tang1",
    labelVi: "Tầng 1: Bóc tách đề bài",
    label: "Reading the Prompt",
    description: "Đọc email đề + Directions để xác định vai, quan hệ và đếm đủ mission phải làm.",
    dbPartPrefix: "wp2-tang1",
    active: true,
  },
  {
    id: "tang2",
    labelVi: "Tầng 2: Bố cục email",
    label: "Email Structure",
    description: "Gắn nhãn chức năng cho từng câu trong email mẫu, rồi tự dựng lại bố cục.",
    dbPartPrefix: "wp2-tang2",
    active: true,
  },
  {
    id: "tang3",
    labelVi: "Tầng 3: Xưng hô, câu mở & lời chào kết",
    label: "Salutations & Closings",
    description: "Chọn xưng hô đúng, điền câu mở đầu, ghép cặp mở–kết đúng mức trang trọng.",
    dbPartPrefix: "wp2-tang3",
    active: true,
  },
  {
    id: "tang4",
    labelVi: "Tầng 4: Kho diễn đạt theo mission",
    label: "Functional Phrases",
    description: "Cung cấp thông tin · Đề nghị · Xin lỗi · Hỏi thông tin · Câu kết.",
    dbPartPrefix: "wp2-tang4",
    active: true,
  },
  {
    id: "tang5",
    labelVi: "Tầng 5: Dịch Việt → Anh",
    label: "VI → EN Translation",
    description: "Dịch câu email sang tiếng Anh. Chấp nhận nhiều cách viết đúng.",
    dbPartPrefix: "wp2-tang5",
    active: true,
  },
  {
    id: "tang6",
    labelVi: "Tầng 6: Chữa lỗi & so sánh",
    label: "Error Correction",
    description: "Tìm lỗi trong email trả lời, đối chiếu với Directions, so sánh 2 bản.",
    dbPartPrefix: "wp2-tang6",
    active: false,
  },
];

export const PASS_THRESHOLD = 80;

export function getSkillMetaP2(skillId: string): P2SkillMeta | undefined {
  return WRITING_P2_SKILLS.find((s) => s.id === skillId);
}

export function dbPartW2(skillId: string, difficulty: P2Difficulty): string {
  const skill = WRITING_P2_SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return difficulty === "easy" ? skill.dbPartPrefix : `${skill.dbPartPrefix}-${difficulty}`;
}

// ─────────────────────────────────────
// Chuẩn hoá & so khớp
// ─────────────────────────────────────

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, "i am"],
  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bcan't\b/g, "cannot"],
  [/\bcouldn't\b/g, "could not"],
  [/\bwon't\b/g, "will not"],
  [/\bwouldn't\b/g, "would not"],
  [/\bhaven't\b/g, "have not"],
  [/\bhasn't\b/g, "has not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwe've\b/g, "we have"],
  [/\bi've\b/g, "i have"],
  [/\bwe'd\b/g, "we would"],
  [/\bi'd\b/g, "i would"],
  [/\bwe'll\b/g, "we will"],
  [/\bi'll\b/g, "i will"],
  [/\be-mail\b/g, "email"],
  [/\be mail\b/g, "email"],
];

/** Bỏ hoa/thường, dấu câu, khoảng trắng thừa, viết tắt, dấu nháy cong */
export function normP2(s: string): string {
  let out = s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Đúng nếu khớp đáp án chính hoặc bất kỳ biến thể nào được chấp nhận */
export function matchesAccepted(input: string, answer: string, accepted?: string[]): boolean {
  const n = normP2(input);
  if (n === normP2(answer)) return true;
  return (accepted ?? []).some((a) => normP2(a) === n);
}

/**
 * Trả về true nếu chỉ sai đúng 1 từ so với đáp án gần nhất
 * (dùng để báo "Gần đúng" thay vì "Sai" — đỡ nản cho người mới).
 */
export function isNearMiss(input: string, answer: string, accepted?: string[]): { near: boolean; wrongIdx: number; target: string } {
  const inWords = normP2(input).split(" ").filter(Boolean);
  const candidates = [answer, ...(accepted ?? [])];
  for (const cand of candidates) {
    const cw = normP2(cand).split(" ").filter(Boolean);
    if (cw.length !== inWords.length) continue;
    const diffs: number[] = [];
    for (let i = 0; i < cw.length; i++) if (cw[i] !== inWords[i]) diffs.push(i);
    if (diffs.length === 1) return { near: true, wrongIdx: diffs[0], target: cand };
  }
  return { near: false, wrongIdx: -1, target: answer };
}

// ─────────────────────────────────────
// Static data
// ─────────────────────────────────────

import t0_1 from "./tang0.1.json";
import t0_2 from "./tang0.2.json";
import t0_3 from "./tang0.3.json";
import t0_4 from "./tang0.4.json";
import t0_5 from "./tang0.5.json";

import t1_1 from "./tang1.1.json";
import t1_2 from "./tang1.2.json";
import t1_3 from "./tang1.3.json";
import t1_4 from "./tang1.4.json";
import t1_5 from "./tang1.5.json";

import t2_1 from "./tang2.1.json";
import t2_2 from "./tang2.2.json";
import t2_3 from "./tang2.3.json";
import t2_4 from "./tang2.4.json";
import t2_5 from "./tang2.5.json";

import t3_1 from "./tang3.1.json";
import t3_2 from "./tang3.2.json";
import t3_3 from "./tang3.3.json";
import t3_4 from "./tang3.4.json";
import t3_5 from "./tang3.5.json";

import t4_1 from "./tang4.1.json";
import t4_2 from "./tang4.2.json";
import t4_3 from "./tang4.3.json";
import t4_4 from "./tang4.4.json";
import t4_5 from "./tang4.5.json";

import t5_1 from "./tang5.1.json";
import t5_2 from "./tang5.2.json";
import t5_3 from "./tang5.3.json";
import t5_4 from "./tang5.4.json";
import t5_5 from "./tang5.5.json";

type RawTest = {
  emails?: Record<string, EmailBlock>;
  levels: { difficulty: string; exercises: unknown[] }[];
};

function load(raw: unknown, skillId: string, testNum: number): P2TestData {
  const r = raw as RawTest;
  return {
    skillId,
    testNum,
    emails: r.emails ?? {},
    levels: r.levels.map((lev) => ({
      difficulty: lev.difficulty as P2Difficulty,
      exercises: lev.exercises as P2Exercise[],
    })),
  };
}

const DATA: Record<string, P2TestData[]> = {
  tang0: [t0_1, t0_2, t0_3, t0_4, t0_5].map((r, i) => load(r, "tang0", i + 1)),
  tang1: [t1_1, t1_2, t1_3, t1_4, t1_5].map((r, i) => load(r, "tang1", i + 1)),
  tang2: [t2_1, t2_2, t2_3, t2_4, t2_5].map((r, i) => load(r, "tang2", i + 1)),
  tang3: [t3_1, t3_2, t3_3, t3_4, t3_5].map((r, i) => load(r, "tang3", i + 1)),
  tang4: [t4_1, t4_2, t4_3, t4_4, t4_5].map((r, i) => load(r, "tang4", i + 1)),
  tang5: [t5_1, t5_2, t5_3, t5_4, t5_5].map((r, i) => load(r, "tang5", i + 1)),
};

export function getSkillTestsP2(skillId: string): P2TestData[] | undefined {
  return DATA[skillId];
}
