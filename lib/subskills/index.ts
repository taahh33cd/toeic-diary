// ─────────────────────────────────────
// Types
// ─────────────────────────────────────

export type WordbankItem = {
  prompt: string;
  chunks: string[];
};

export type FillItem = {
  template: string;
  hint: string | null;
  wordBank?: string[];
  blanks: string[][];
};

export type KeywordItem = {
  prompt: string;
  minRequired: number;
  keywords: string[][];
};

export type McqItem = {
  prompt: string;
  options: [string, string, string] | [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  answerChunks: string[];
  answerChunkDistractors?: string[]; // Extra wrong chips mixed into translate pool (Hard)
};

export type MatchItem = {
  question: string;
  options: [string, string, string, string, string];
  correct: 0 | 1 | 2 | 3 | 4;
  explanation: string;
};

export type FreetypeItem = {
  prompt: string;           // Vietnamese hint shown to user
  answer: string;           // Primary correct English sentence
  acceptedAnswers?: string[]; // Alternative acceptable forms
};

export type WordbankExercise = {
  kind: "wordbank";
  title: string;
  instruction: string;
  items: WordbankItem[];
};

export type FillExercise = {
  kind: "fill";
  title: string;
  instruction: string;
  items: FillItem[];
};

export type KeywordExercise = {
  kind: "keyword";
  title: string;
  instruction: string;
  items: KeywordItem[];
};

export type McqExercise = {
  kind: "mcq";
  title: string;
  instruction: string;
  translateMode: "always";
  scoring: { mcqWeight: number; translateWeight: number };
  items: McqItem[];
};

export type MatchExercise = {
  kind: "match";
  title: string;
  instruction: string;
  items: MatchItem[];
};

export type FreetypeExercise = {
  kind: "freewrite";
  title: string;
  instruction: string;
  items: FreetypeItem[];
};

export type AnyExercise =
  | WordbankExercise
  | FillExercise
  | KeywordExercise
  | McqExercise
  | MatchExercise
  | FreetypeExercise;

export type SubskillSet = {
  part: string;
  questionWord: string;
  difficulty?: string;
  label: string;
  labelVi: string;
  passThreshold: number;
  intro: string;
  exercises: [AnyExercise, AnyExercise, AnyExercise, AnyExercise];
};

// ─────────────────────────────────────
// Data — import JSON files directly
// ─────────────────────────────────────

import whoData   from "@/lib/subskills/data/who.json";
import whatData  from "@/lib/subskills/data/what.json";
import whichData from "@/lib/subskills/data/which.json";
import whereData from "@/lib/subskills/data/where.json";
import whenData  from "@/lib/subskills/data/when.json";
import whyData   from "@/lib/subskills/data/why.json";
import howData   from "@/lib/subskills/data/how.json";
import yesNoData from "@/lib/subskills/data/yes-no.json";
import tagData   from "@/lib/subskills/data/tag.json";
import choiceData from "@/lib/subskills/data/choice.json";

import whoMediumData    from "@/lib/subskills/data/who.medium.json";
import whatMediumData   from "@/lib/subskills/data/what.medium.json";
import whichMediumData  from "@/lib/subskills/data/which.medium.json";
import whereMediumData  from "@/lib/subskills/data/where.medium.json";
import whenMediumData   from "@/lib/subskills/data/when.medium.json";
import whyMediumData    from "@/lib/subskills/data/why.medium.json";
import howMediumData    from "@/lib/subskills/data/how.medium.json";
import yesNoMediumData  from "@/lib/subskills/data/yes-no.medium.json";
import tagMediumData    from "@/lib/subskills/data/tag.medium.json";
import choiceMediumData from "@/lib/subskills/data/choice.medium.json";

import whoHardData    from "@/lib/subskills/data/who.hard.json";
import whatHardData   from "@/lib/subskills/data/what.hard.json";
import whichHardData  from "@/lib/subskills/data/which.hard.json";
import whereHardData  from "@/lib/subskills/data/where.hard.json";
import whenHardData   from "@/lib/subskills/data/when.hard.json";
import whyHardData    from "@/lib/subskills/data/why.hard.json";
import howHardData    from "@/lib/subskills/data/how.hard.json";
import yesNoHardData  from "@/lib/subskills/data/yes-no.hard.json";
import tagHardData    from "@/lib/subskills/data/tag.hard.json";
import choiceHardData from "@/lib/subskills/data/choice.hard.json";

export const PART2_SETS: SubskillSet[] = [
  whoData,
  whatData,
  whichData,
  whereData,
  whenData,
  whyData,
  howData,
  yesNoData,
  tagData,
  choiceData,
] as SubskillSet[];

export const PART2_MEDIUM_SETS: SubskillSet[] = [
  whoMediumData,
  whatMediumData,
  whichMediumData,
  whereMediumData,
  whenMediumData,
  whyMediumData,
  howMediumData,
  yesNoMediumData,
  tagMediumData,
  choiceMediumData,
] as SubskillSet[];

export function getPart2Set(questionWord: string): SubskillSet | undefined {
  return PART2_SETS.find((s) => s.questionWord === questionWord);
}

export function getPart2MediumSet(questionWord: string): SubskillSet | undefined {
  return PART2_MEDIUM_SETS.find((s) => s.questionWord === questionWord);
}

export const PART2_HARD_SETS: SubskillSet[] = [
  whoHardData,
  whatHardData,
  whichHardData,
  whereHardData,
  whenHardData,
  whyHardData,
  howHardData,
  yesNoHardData,
  tagHardData,
  choiceHardData,
] as SubskillSet[];

export function getPart2HardSet(questionWord: string): SubskillSet | undefined {
  return PART2_HARD_SETS.find((s) => s.questionWord === questionWord);
}

// ─────────────────────────────────────
// Grading utilities (pure, no AI)
// ─────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[.,!?;:'"]/g, "");
}

/** Wordbank: score = % items where user's chunk order exactly matches correct order */
export function scoreWordbank(
  items: WordbankItem[],
  userOrders: string[][]   // userOrders[i] = arranged chunks for item i
): number {
  if (items.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < items.length; i++) {
    const expected = items[i].chunks;
    const actual   = userOrders[i] ?? [];
    if (
      expected.length === actual.length &&
      expected.every((c, j) => c === actual[j])
    ) {
      correct++;
    }
  }
  return Math.round((correct / items.length) * 100);
}

/** Fill: score = % blanks filled correctly (any accepted answer) */
export function scoreFill(
  items: FillItem[],
  userAnswers: string[][]  // userAnswers[i][j] = user input for item i, blank j
): number {
  let totalBlanks = 0;
  let correctBlanks = 0;
  for (let i = 0; i < items.length; i++) {
    const blanks = items[i].blanks;
    for (let j = 0; j < blanks.length; j++) {
      totalBlanks++;
      const userVal = normalize(userAnswers[i]?.[j] ?? "");
      if (blanks[j].some((accepted) => normalize(accepted) === userVal)) {
        correctBlanks++;
      }
    }
  }
  return totalBlanks === 0 ? 0 : Math.round((correctBlanks / totalBlanks) * 100);
}

/** Keyword: score = % keyword groups matched (≥1 variant hit per group) */
export function scoreKeyword(
  items: KeywordItem[],
  userInputs: string[]   // userInputs[i] = comma-separated typed text for item i
): number {
  if (items.length === 0) return 0;
  let totalGroups = 0;
  let matchedGroups = 0;
  for (let i = 0; i < items.length; i++) {
    const typed = (userInputs[i] ?? "")
      .split(",")
      .map((t) => normalize(t))
      .filter(Boolean);
    for (const group of items[i].keywords) {
      totalGroups++;
      if (group.some((variant) => typed.includes(normalize(variant)))) {
        matchedGroups++;
      }
    }
  }
  return totalGroups === 0 ? 0 : Math.round((matchedGroups / totalGroups) * 100);
}

/** MCQ: 50% correct choice + 50% translation chunks in correct positions */
export function scoreMcq(
  items: McqItem[],
  userChoices: (number | null)[],    // userChoices[i] = selected index
  userTranslations: string[][]       // userTranslations[i] = arranged answerChunks
): number {
  if (items.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    const mcqScore = userChoices[i] === items[i].correct ? 1 : 0;
    const expected = items[i].answerChunks;
    const actual   = userTranslations[i] ?? [];
    const chunkCorrect = expected.length > 0
      ? expected.filter((c, j) => c === actual[j]).length / expected.length
      : 0;
    total += 0.5 * mcqScore + 0.5 * chunkCorrect;
  }
  return Math.round((total / items.length) * 100);
}

/** Per-item correctness helpers (for feedback display) */

export function wordbankItemCorrect(item: WordbankItem, arranged: string[]): boolean {
  return item.chunks.length === arranged.length &&
    item.chunks.every((c, i) => c === arranged[i]);
}

export function fillItemBlanksCorrect(item: FillItem, userBlanks: string[]): boolean[] {
  return item.blanks.map((group, j) =>
    group.some((accepted) => normalize(accepted) === normalize(userBlanks[j] ?? ""))
  );
}

export function keywordItemGroupsMatched(
  item: KeywordItem,
  userInput: string
): boolean[] {
  const typed = userInput.split(",").map(normalize).filter(Boolean);
  return item.keywords.map((group) =>
    group.some((variant) => typed.includes(normalize(variant)))
  );
}

/** Freewrite: normalize both sides, also strip articles (a/an/the) for leniency */
function normalizeFreewrite(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/\b(a|an|the)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function freetypeItemCorrect(item: FreetypeItem, userInput: string): boolean {
  const userNorm = normalizeFreewrite(userInput);
  if (!userNorm) return false;
  const allAnswers = [item.answer, ...(item.acceptedAnswers ?? [])];
  return allAnswers.some((a) => normalizeFreewrite(a) === userNorm);
}
