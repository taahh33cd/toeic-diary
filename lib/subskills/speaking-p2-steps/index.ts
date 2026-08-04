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

/**
 * How many phrases/sentences the learner must produce, per step.
 * Rises with the step because a picture has one location, a couple of focal
 * points, and many details — asking for 4 different answers to "where was this
 * taken?" would have no honest answer.
 */
const PRODUCE_TARGETS: Record<Difficulty, [number, number, number]> = {
  easy: [1, 1, 1], // unused: Easy keeps the MCQ + blanks
  medium: [1, 2, 3],
  hard: [2, 3, 4],
};

export function produceTarget(difficulty: Difficulty, step: 1 | 2 | 3): number {
  return PRODUCE_TARGETS[difficulty][step - 1];
}

/** Hard asks for full sentences, so a bare phrase is rejected. */
export const HARD_MIN_WORDS = 6;

export function getProduceBank(itemId: string, step: 1 | 2 | 3): string[] {
  return PRODUCE[itemId]?.[String(step) as "1" | "2" | "3"] ?? [];
}

export type ProduceVerdict =
  | { ok: true; matched: string }
  | { ok: false; reason: "short" | "duplicate" | "unknown" | "close" };

/**
 * Words that carry no meaning for this exercise. Articles and prepositions are
 * dropped so "a blue shirt" can reach "a light blue shirt", and "office" can
 * reach "in an office" — the learner is producing vocabulary here, not grammar.
 */
const FILLER = new Set([
  "a", "an", "the",
  "in", "on", "at", "of", "to", "into", "from", "with", "for", "by",
  "next", "near", "beside", "behind", "under", "above", "over", "inside",
  "outside", "along", "around", "across", "through", "up", "down",
]);

function contentTokens(s: string): string[] {
  return normalize(s).split(" ").filter((t) => t && !FILLER.has(t));
}

/** Share of the bank entry's meaningful words that the learner also used. */
function overlapRatio(entryTokens: string[], inputTokens: string[]): number {
  if (entryTokens.length === 0) return 0;
  const set = new Set(inputTokens);
  return entryTokens.filter((t) => set.has(t)).length / entryTokens.length;
}

const MIN_OVERLAP = 0.6;

/**
 * Check one thing the learner typed against the bank.
 *
 * A bank entry matches when the learner used most of its meaningful words
 * *including its head word* (the last one). That accepts "a blue shirt" for
 * "a light blue shirt" and a whole Hard sentence that mentions it, while still
 * rejecting "a yellow shirt" — which shares only one word with either
 * "a yellow sweater" or "a light blue shirt".
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

  const inTok = contentTokens(input);
  if (inTok.length === 0) return { ok: false, reason: "unknown" };

  let partial = false;
  const hit = bank.find((phrase) => {
    if (norm.includes(normalize(phrase))) return true;
    const pTok = contentTokens(phrase);
    if (pTok.length === 0) return false;
    const head = pTok[pTok.length - 1];
    const ratio = overlapRatio(pTok, inTok);
    if (ratio >= MIN_OVERLAP && inTok.includes(head)) return true;
    if (ratio > 0) partial = true;
    return false;
  });

  if (!hit) return { ok: false, reason: partial ? "close" : "unknown" };
  if (alreadyMatched.includes(hit)) return { ok: false, reason: "duplicate" };
  return { ok: true, matched: hit };
}

/**
 * Split what the learner typed into separate answers. Medium brainstorms in
 * comma-separated phrases; Hard writes sentences, which may themselves contain
 * commas, so those split on sentence punctuation instead.
 */
export function splitProduceInput(input: string, difficulty: Difficulty): string[] {
  const parts = difficulty === "hard" ? input.split(/[.!?\n]+/) : input.split(/[,;\n]+/);
  return parts.map((s) => s.trim()).filter(Boolean);
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
