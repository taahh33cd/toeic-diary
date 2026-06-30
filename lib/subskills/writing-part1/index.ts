// ─────────────────────────────────────
// Normalized exercise types
// ─────────────────────────────────────

export type W1Exercise = {
  type: "word_ordering";
  id: string;
  difficulty: "easy" | "medium" | "hard";
  tokens: string[];
  answer: string;
  explanation: string;
};

export type W2Exercise = {
  type: "verb_fill";
  id: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  answer: string;
  explanation: string;
  imagePath?: string;
  imageUrl?: string;
  imageContext?: string;
};

export type W3Exercise = {
  type: "blank_fill";
  id: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  answer: string;
  explanation: string;
  blanks: string[];
};

export type W45Exercise = {
  type: "multiple_choice";
  id: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  imageContext: string;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  explanation: string;
  imagePath?: string;
  imageUrl?: string;
};

export type WExercise = W1Exercise | W2Exercise | W3Exercise | W45Exercise;

export type WLevel = {
  difficulty: "easy" | "medium" | "hard";
  exercises: WExercise[];
};

export type WTestData = {
  skillId: string;
  testNum: number;
  levels: WLevel[];
};

// ─────────────────────────────────────
// Skill metadata
// ─────────────────────────────────────

export type WSkillMeta = {
  id: string;
  labelVi: string;
  label: string;
  description: string;
  exerciseType: WExercise["type"];
  dbPartPrefix: string;
};

export const WRITING_P1_SKILLS: WSkillMeta[] = [
  {
    id: "tang1",
    labelVi: "Tầng 1: Cấu trúc câu cơ bản",
    label: "Basic Sentence Structure",
    description: "Sắp xếp các từ xáo trộn thành câu đúng. Luyện nhận biết S + V + O/C.",
    exerciseType: "word_ordering",
    dbPartPrefix: "wp1-tang1",
  },
  {
    id: "tang2",
    labelVi: "Tầng 2: Thì động từ",
    label: "Verb Tenses",
    description: "Chia động từ đúng dạng: hiện tại tiếp diễn, bị động hiện tại, bị động tiếp diễn.",
    exerciseType: "verb_fill",
    dbPartPrefix: "wp1-tang2",
  },
  {
    id: "tang3",
    labelVi: "Tầng 3: Giới từ & Mạo từ",
    label: "Prepositions & Articles",
    description: "Điền đúng giới từ vị trí (in/on/at/near...) và mạo từ (a/an/the).",
    exerciseType: "blank_fill",
    dbPartPrefix: "wp1-tang3",
  },
  {
    id: "tang4",
    labelVi: "Tầng 4: Từ vựng theo chủ đề ảnh",
    label: "Photo Vocabulary",
    description: "Chọn từ đúng để hoàn thành câu mô tả ảnh. 6 đáp án lựa chọn.",
    exerciseType: "multiple_choice",
    dbPartPrefix: "wp1-tang4",
  },
  {
    id: "tang5",
    labelVi: "Tầng 5: Kỹ năng đọc ảnh",
    label: "Photo Description",
    description: "Chọn câu tiếng Anh mô tả đúng nhất về bức ảnh (3 bước phân tích).",
    exerciseType: "multiple_choice",
    dbPartPrefix: "wp1-tang5",
  },
];

export const PASS_THRESHOLD = 80;

export function getSkillMeta(skillId: string): WSkillMeta | undefined {
  return WRITING_P1_SKILLS.find((s) => s.id === skillId);
}

export function dbPartW1(skillId: string, difficulty: "easy" | "medium" | "hard"): string {
  const skill = WRITING_P1_SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return difficulty === "easy" ? skill.dbPartPrefix : `${skill.dbPartPrefix}-${difficulty}`;
}

// ─────────────────────────────────────
// Blank extraction helper for Tang 3
// ─────────────────────────────────────

export function extractBlanks(question: string, answer: string): string[] {
  const parts = question.split("___");
  if (parts.length < 2) return [];
  const blanks: string[] = [];
  let pos = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    pos += parts[i].length;
    if (pos > answer.length) { blanks.push(""); continue; }
    const nextPart = parts[i + 1];
    const nextTrimmed = nextPart.trimStart();
    let blankEnd = answer.indexOf(nextPart, pos);
    if (blankEnd === -1) blankEnd = answer.indexOf(nextTrimmed, pos);
    if (blankEnd === -1) { blanks.push(answer.slice(pos).trim()); break; }
    blanks.push(answer.slice(pos, blankEnd).trim());
    pos = blankEnd;
  }
  return blanks;
}

// ─────────────────────────────────────
// Answer checking
// ─────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ").replace(/[.,!?;:]/g, "");
}

export function checkWordOrdering(tokens: string[], answer: string): boolean {
  return norm(tokens.join(" ")) === norm(answer);
}

export function checkVerbFill(input: string, answer: string): boolean {
  return norm(input) === norm(answer);
}

export function checkBlankFill(inputs: string[], blanks: string[]): boolean[] {
  return inputs.map((inp, i) => norm(inp) === norm(blanks[i] ?? ""));
}

export function checkMcq(selected: string, correctAnswers: string[]): boolean {
  return correctAnswers.includes(selected);
}

// ─────────────────────────────────────
// Raw JSON type stubs (minimal)
// ─────────────────────────────────────

type Tang1Raw = { questions: { id: number; difficulty: string; prompt: string; answer: string; explanation: string }[] };
type Tang2Raw = { levels: { level: string; exercises: { id: string; question: string; correct_answer: string; explanation: string; image_path?: string; image_url?: string; image_context?: string; instruction?: string }[] }[] };
type Tang3Raw = { exercises: { id: number; difficulty: string; question: string; answer: string; explanation: string }[] };
type Tang4Raw = { levels: { level: string; exercises: { id: string; content: string; image_context?: string; context?: string; options: { id: string; text: string }[]; correct_answers: string[]; explanation: string; image_path?: string; image_url?: string }[] }[] };
type Tang5Raw = { levels: { level: string; exercises: { id: string; instruction?: string; image_context: string; options: { id: string; text: string }[]; correct_answers: string[]; explanation: string; image_path?: string; image_url?: string }[] }[] };

const DIFF_MAP: Record<string, "easy" | "medium" | "hard"> = { Easy: "easy", Medium: "medium", Hard: "hard", Dễ: "easy", "Trung bình": "medium", Khó: "hard" };

function normDiff(d: string): "easy" | "medium" | "hard" {
  return DIFF_MAP[d] ?? (d.toLowerCase() as "easy" | "medium" | "hard");
}

function normTang1(raw: Tang1Raw, skillId: string, testNum: number): WTestData {
  const groups: Record<"easy" | "medium" | "hard", W1Exercise[]> = { easy: [], medium: [], hard: [] };
  for (const q of raw.questions) {
    const diff = normDiff(q.difficulty);
    groups[diff].push({ type: "word_ordering", id: String(q.id), difficulty: diff, tokens: q.prompt.split(" / "), answer: q.answer, explanation: q.explanation });
  }
  return { skillId, testNum, levels: [{ difficulty: "easy", exercises: groups.easy }, { difficulty: "medium", exercises: groups.medium }, { difficulty: "hard", exercises: groups.hard }] };
}

function normTang2(raw: Tang2Raw, skillId: string, testNum: number): WTestData {
  return {
    skillId, testNum,
    levels: raw.levels.map((lev) => ({
      difficulty: normDiff(lev.level),
      exercises: lev.exercises.map((ex) => ({
        type: "verb_fill" as const,
        id: ex.id,
        difficulty: normDiff(lev.level),
        question: ex.question,
        answer: ex.correct_answer,
        explanation: ex.explanation,
        imagePath: ex.image_path ? `/${ex.image_path}` : undefined,
        imageUrl: ex.image_url,
        imageContext: ex.instruction ?? ex.image_context,
      })),
    })),
  };
}

function normTang3(raw: Tang3Raw, skillId: string, testNum: number): WTestData {
  const groups: Record<"easy" | "medium" | "hard", W3Exercise[]> = { easy: [], medium: [], hard: [] };
  for (const q of raw.exercises) {
    const diff = normDiff(q.difficulty);
    groups[diff].push({ type: "blank_fill", id: String(q.id), difficulty: diff, question: q.question, answer: q.answer, explanation: q.explanation, blanks: extractBlanks(q.question, q.answer) });
  }
  return { skillId, testNum, levels: [{ difficulty: "easy", exercises: groups.easy }, { difficulty: "medium", exercises: groups.medium }, { difficulty: "hard", exercises: groups.hard }] };
}

function normTang4(raw: Tang4Raw, skillId: string, testNum: number): WTestData {
  return {
    skillId, testNum,
    levels: raw.levels.map((lev) => ({
      difficulty: normDiff(lev.level),
      exercises: lev.exercises.map((ex) => ({
        type: "multiple_choice" as const,
        id: ex.id,
        difficulty: normDiff(lev.level),
        question: ex.content,
        imageContext: ex.image_context ?? ex.context ?? "",
        options: ex.options,
        correctAnswers: ex.correct_answers,
        explanation: ex.explanation,
        imagePath: ex.image_path ? `/${ex.image_path}` : undefined,
        imageUrl: ex.image_url,
      })),
    })),
  };
}

function normTang5(raw: Tang5Raw, skillId: string, testNum: number): WTestData {
  return {
    skillId, testNum,
    levels: raw.levels.map((lev) => ({
      difficulty: normDiff(lev.level),
      exercises: lev.exercises.map((ex) => ({
        type: "multiple_choice" as const,
        id: ex.id,
        difficulty: normDiff(lev.level),
        question: ex.instruction ?? "Chọn câu mô tả đúng nhất về bức ảnh.",
        imageContext: ex.image_context,
        options: ex.options,
        correctAnswers: ex.correct_answers,
        explanation: ex.explanation,
        imagePath: ex.image_path ? `/${ex.image_path}` : undefined,
        imageUrl: ex.image_url,
      })),
    })),
  };
}

// ─────────────────────────────────────
// Static data imports
// ─────────────────────────────────────

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

const DATA: Record<string, WTestData[]> = {
  tang1: [
    normTang1(t1_1 as Tang1Raw, "tang1", 1),
    normTang1(t1_2 as Tang1Raw, "tang1", 2),
    normTang1(t1_3 as Tang1Raw, "tang1", 3),
    normTang1(t1_4 as Tang1Raw, "tang1", 4),
    normTang1(t1_5 as Tang1Raw, "tang1", 5),
  ],
  tang2: [
    normTang2(t2_1 as Tang2Raw, "tang2", 1),
    normTang2(t2_2 as Tang2Raw, "tang2", 2),
    normTang2(t2_3 as Tang2Raw, "tang2", 3),
    normTang2(t2_4 as Tang2Raw, "tang2", 4),
    normTang2(t2_5 as Tang2Raw, "tang2", 5),
  ],
  tang3: [
    normTang3(t3_1 as Tang3Raw, "tang3", 1),
    normTang3(t3_2 as Tang3Raw, "tang3", 2),
    normTang3(t3_3 as Tang3Raw, "tang3", 3),
    normTang3(t3_4 as Tang3Raw, "tang3", 4),
    normTang3(t3_5 as Tang3Raw, "tang3", 5),
  ],
  tang4: [
    normTang4(t4_1 as Tang4Raw, "tang4", 1),
    normTang4(t4_2 as Tang4Raw, "tang4", 2),
    normTang4(t4_3 as Tang4Raw, "tang4", 3),
    normTang4(t4_4 as Tang4Raw, "tang4", 4),
    normTang4(t4_5 as Tang4Raw, "tang4", 5),
  ],
  tang5: [
    normTang5(t5_1 as Tang5Raw, "tang5", 1),
    normTang5(t5_2 as Tang5Raw, "tang5", 2),
    normTang5(t5_3 as Tang5Raw, "tang5", 3),
    normTang5(t5_4 as Tang5Raw, "tang5", 4),
    normTang5(t5_5 as Tang5Raw, "tang5", 5),
  ],
};

export function getSkillTests(skillId: string): WTestData[] | undefined {
  return DATA[skillId];
}

export function getSkillTest(skillId: string, testNum: number): WTestData | undefined {
  return DATA[skillId]?.[testNum - 1];
}
