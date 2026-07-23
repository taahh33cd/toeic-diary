// Speaking Part 2 — "Mô tả tranh theo 3 bước" (guided picture description).
// Different content model from the 5 grammar skills: one image = one guided
// 3-step exercise (auto-graded MCQ + fill-in-the-blank, plus a free-write with
// a model answer and a recording of the full description).

export type StepLevel = "Easy" | "Medium" | "Hard";
export type Difficulty = "easy" | "medium" | "hard";

export type StepMcq = {
  instruction: string;
  correct: string;
  distractors: string[];
  explanation: string;
};

export type StepBlank = {
  instruction: string;
  content: string;
  answers: string[];
  explanation: string;
};

export type StepQA = {
  mcq: StepMcq;
  blank: StepBlank;
  models: string[];
};

export type StepThree = {
  blank: StepBlank;
  freeWrite: { instruction: string; model: string };
};

export type StepItem = {
  id: string;
  level: StepLevel;
  test: number;
  image: string;
  title: string;
  step1: StepQA;
  step2: StepQA;
  step3: StepThree;
  fullModel: string;
};

// ─────────────────────────────────────
// Data
// ─────────────────────────────────────

import easyData from "./data.easy.json";
import mediumA from "./data.medium.a.json";
import mediumB from "./data.medium.b.json";
import mediumC from "./data.medium.c.json";
import hardA from "./data.hard.a.json";
import hardB from "./data.hard.b.json";

const ALL_ITEMS = [
  ...(easyData as StepItem[]),
  ...(mediumA as StepItem[]),
  ...(mediumB as StepItem[]),
  ...(mediumC as StepItem[]),
  ...(hardA as StepItem[]),
  ...(hardB as StepItem[]),
];

// ─────────────────────────────────────
// Skill metadata
// ─────────────────────────────────────

export const STEPS_SKILL = {
  id: "mo-ta-buoc",
  label: "Describe a Picture — 3 Steps",
  labelVi: "Mô tả tranh theo 3 bước",
  description:
    "Quy trình chuẩn để mô tả một bức ảnh: (1) địa điểm, (2) chủ thể nổi bật, (3) chi tiết trái/phải/nền — kèm ghi âm cả bài.",
  part: "sp2-mo-ta-buoc",
};

export const STEPS_PASS_THRESHOLD = 80;

/** Number of auto-graded questions per image: 2 MCQ + 3 fill-in-the-blank. */
export const GRADED_PER_IMAGE = 5;

// ─────────────────────────────────────
// Accessors
// ─────────────────────────────────────

export type StepTest = {
  testNum: number;
  easy: StepItem[];
  medium: StepItem[];
  hard: StepItem[];
};

const LEVEL_OF: Record<Difficulty, StepLevel> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** All tests, grouped by test number, each holding its Easy/Medium/Hard images. */
export function getStepTests(): StepTest[] {
  const nums = [...new Set(ALL_ITEMS.map((i) => i.test))].sort((a, b) => a - b);
  return nums.map((testNum) => ({
    testNum,
    easy: ALL_ITEMS.filter((i) => i.test === testNum && i.level === "Easy"),
    medium: ALL_ITEMS.filter((i) => i.test === testNum && i.level === "Medium"),
    hard: ALL_ITEMS.filter((i) => i.test === testNum && i.level === "Hard"),
  }));
}

export function getStepItems(test: StepTest, difficulty: Difficulty): StepItem[] {
  const level = LEVEL_OF[difficulty];
  return level === "Easy" ? test.easy : level === "Medium" ? test.medium : test.hard;
}

export const STEP_TESTS_COUNT = [...new Set(ALL_ITEMS.map((i) => i.test))].length;

/** Every image, ordered Easy → Medium → Hard. Shared with the /skills exam practice. */
export function getAllStepItems(): StepItem[] {
  const rank: Record<StepLevel, number> = { Easy: 0, Medium: 1, Hard: 2 };
  return [...ALL_ITEMS].sort((a, b) => rank[a.level] - rank[b.level] || a.id.localeCompare(b.id));
}

// ─────────────────────────────────────
// DB helper
// ─────────────────────────────────────

export function dbPartSteps(difficulty: Difficulty): string {
  return difficulty === "easy" ? STEPS_SKILL.part : `${STEPS_SKILL.part}-${difficulty}`;
}

// ─────────────────────────────────────
// Answer checking
// ─────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]/g, "");
}

export function checkBlank(blank: StepBlank, input: string): boolean {
  const norm = normalize(input);
  if (!norm) return false;
  return blank.answers.some((a) => normalize(a) === norm);
}

/** Options for an MCQ, in a stable order derived from the item id (no hydration mismatch). */
export function mcqOptions(mcq: StepMcq, seed: string): string[] {
  const all = [mcq.correct, ...mcq.distractors];
  // deterministic rotation based on the seed string
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const shift = h % all.length;
  return all.map((_, i) => all[(i + shift) % all.length]);
}
