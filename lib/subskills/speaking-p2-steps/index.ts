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

/** Accepted phrases for the "produce it yourself" exercise, keyed by item id then step. */
export type ProduceBank = Record<string, Record<"1" | "2" | "3", string[]>>;

// ─────────────────────────────────────
// Data
// ─────────────────────────────────────

import easyData from "./data.easy.json";
import mediumA from "./data.medium.a.json";
import mediumB from "./data.medium.b.json";
import mediumC from "./data.medium.c.json";
import hardA from "./data.hard.a.json";
import hardB from "./data.hard.b.json";
import produceMedium from "./produce.medium.json";
import produceHard from "./produce.hard.json";

const PRODUCE: ProduceBank = { ...(produceMedium as ProduceBank), ...(produceHard as ProduceBank) };

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

/** Easy keeps the guided drill: 2 MCQ + 3 fill-in-the-blank. Medium/Hard score 1 point per step. */
export const GRADED_PER_IMAGE = 5;

export function gradedPerImage(difficulty: Difficulty): number {
  return difficulty === "easy" ? GRADED_PER_IMAGE : 3;
}

/** Medium/Hard replace the MCQ + blanks with free production. */
export function isProduceMode(difficulty: Difficulty): boolean {
  return difficulty !== "easy";
}

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

// ─────────────────────────────────────
// Free production (Medium / Hard)
// ─────────────────────────────────────

/** How many phrases/sentences the learner must produce per step. */
export function produceTarget(difficulty: Difficulty): number {
  return difficulty === "hard" ? 4 : 2;
}

/** Hard asks for full sentences, so a bare phrase is rejected. */
export const HARD_MIN_WORDS = 6;

export function getProduceBank(itemId: string, step: 1 | 2 | 3): string[] {
  return PRODUCE[itemId]?.[String(step) as "1" | "2" | "3"] ?? [];
}

export type ProduceVerdict =
  | { ok: true; matched: string }
  | { ok: false; reason: "short" | "duplicate" | "unknown" };

/**
 * Check one thing the learner typed against the bank.
 * Accepts either direction: a sentence that *contains* a bank phrase (Hard), or a
 * shorter phrase that the bank entry contains (Medium typing "office" for "in an office").
 */
export function checkProduce(
  bank: string[],
  input: string,
  difficulty: Difficulty,
  alreadyMatched: string[],
): ProduceVerdict {
  const norm = normalize(input);
  if (!norm) return { ok: false, reason: "unknown" };

  if (difficulty === "hard" && norm.split(" ").length < HARD_MIN_WORDS) {
    return { ok: false, reason: "short" };
  }

  const hit = bank.find((phrase) => {
    const p = normalize(phrase);
    if (norm.includes(p)) return true;
    // partial: only when the learner typed something substantial enough to be unambiguous
    return p.includes(norm) && (norm.split(" ").length >= 2 || norm.length >= 5);
  });

  if (!hit) return { ok: false, reason: "unknown" };
  if (alreadyMatched.includes(hit)) return { ok: false, reason: "duplicate" };
  return { ok: true, matched: hit };
}

/** Slim shape for the free-practice page: everything it shows, nothing it doesn't. */
export type FreeItem = {
  id: string;
  level: StepLevel;
  test: number;
  image: string;
  title: string;
  fullModel: string;
  /** Vocabulary the learner can check themselves against, per step. */
  hints: [string[], string[], string[]];
  /** Model sentences for steps 1 and 2, plus the step-3 paragraph. */
  models: [string[], string[], string];
};

export function getFreeItems(): FreeItem[] {
  return getAllStepItems().map((it) => ({
    id: it.id,
    level: it.level,
    test: it.test,
    image: it.image,
    title: it.title,
    fullModel: it.fullModel,
    hints: [1, 2, 3].map((s) => {
      const bank = getProduceBank(it.id, s as 1 | 2 | 3);
      if (bank.length > 0) return bank;
      // Easy images have no bank — fall back to the MCQ answer so there is still something to check against.
      return s === 1 ? [it.step1.mcq.correct] : s === 2 ? [it.step2.mcq.correct] : [];
    }) as [string[], string[], string[]],
    models: [it.step1.models, it.step2.models, it.step3.freeWrite.model],
  }));
}

/** Masked hint for Medium: "in an office" → "i· a· o·····". */
export function maskPhrase(phrase: string): string {
  return phrase
    .split(" ")
    .map((w) => (w.length <= 1 ? w : w[0] + "·".repeat(w.length - 1)))
    .join(" ");
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
