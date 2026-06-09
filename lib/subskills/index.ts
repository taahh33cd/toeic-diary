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

// ── Keyword-based grading helpers ──────────────────────────────────────────

/**
 * Structural words excluded from content keyword extraction.
 * We want to keep only content/vocabulary words.
 */
const FREEWRITE_STOPWORDS = new Set([
  // Articles (already stripped in normalizeFreewrite, kept here for safety)
  "a", "an", "the",
  // Forms of "to be"
  "is", "are", "was", "were", "be", "been", "being", "am",
  // Auxiliaries
  "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "must", "shall", "can",
  // Pronouns
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their", "this", "that", "these", "those",
  // Prepositions & conjunctions
  "to", "of", "in", "on", "at", "by", "for", "with", "from", "into", "about",
  "through", "during", "before", "after", "over", "under", "between", "and",
  "but", "or", "nor", "so", "yet", "both", "also", "just", "very", "more",
  "most", "not", "no", "if", "as", "than", "then", "still", "up", "out",
  // Question words themselves (checked separately via questionWordPresent)
  "what", "when", "where", "who", "which", "how", "why",
]);

/** Extract content keywords from a normalized answer string */
function extractKeywords(normalized: string): string[] {
  const words = normalized.split(/\s+/);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of words) {
    // Keep words ≥ 4 chars that are not stopwords
    if (w.length >= 4 && !FREEWRITE_STOPWORDS.has(w) && !seen.has(w)) {
      seen.add(w);
      result.push(w);
    }
  }
  return result;
}

/** Levenshtein edit distance */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/**
 * Fuzzy-match a user word against a keyword.
 * Tolerance: 1 typo for words < 8 chars, 2 typos for words ≥ 8 chars.
 */
function fuzzyWordMatch(userWord: string, keyword: string): boolean {
  if (userWord === keyword) return true;
  const maxDist = keyword.length >= 8 ? 2 : 1;
  return levenshtein(userWord, keyword) <= maxDist;
}

/**
 * Auxiliaries used as "question word" in yes-no and tag questions.
 */
const YES_NO_AUXILIARIES = [
  "do", "does", "did", "is", "are", "was", "were",
  "have", "has", "had", "can", "could", "will", "would",
  "should", "must", "might", "shall",
];

/**
 * Check whether the user's normalized answer contains the required question word
 * (or question structure) for the given question type.
 */
function questionWordPresent(userNorm: string, questionWord: string): boolean {
  const words = userNorm.split(/\s+/);
  const wordSet = new Set(words);
  switch (questionWord) {
    case "yes-no":
      // Must start with (or contain early) an auxiliary verb
      return YES_NO_AUXILIARIES.some((aux) => wordSet.has(aux));
    case "tag":
      // Must contain a negative contraction ("hasnt", "didnt", "wont", etc.)
      // OR a positive tag auxiliary in the last 3 words
      if (words.some((w) => w.endsWith("nt") && w.length >= 4)) return true;
      const lastThree = new Set(words.slice(-3));
      return YES_NO_AUXILIARIES.some((aux) => lastThree.has(aux));
    case "choice":
      return wordSet.has("or");
    default:
      // who, what, which, where, when, why, how
      return wordSet.has(questionWord);
  }
}

/**
 * Freewrite grading:
 *
 * 1. Exact match (after normalization) → true immediately.
 * 2. Keyword + fuzzy approach:
 *    a. Question word / structure must be present.
 *    b. Extract content keywords from correct answers (union across all accepted answers).
 *    c. User must fuzzy-match ≥ 70% of those keywords.
 *
 * `questionWord` = set.questionWord (e.g. "who", "what", "yes-no", "tag", "choice").
 * Passing undefined falls back to exact-match only.
 */
export function freetypeItemCorrect(
  item: FreetypeItem,
  userInput: string,
  questionWord?: string,
): boolean {
  const userNorm = normalizeFreewrite(userInput);
  if (!userNorm) return false;

  const allAnswers = [item.answer, ...(item.acceptedAnswers ?? [])];

  // 1. Exact match
  if (allAnswers.some((a) => normalizeFreewrite(a) === userNorm)) return true;

  // 2. Keyword + fuzzy approach (requires questionWord)
  if (!questionWord) return false;

  // 2a. Question word / structure must be present
  if (!questionWordPresent(userNorm, questionWord)) return false;

  // 2b. Extract content keywords from all accepted answers (union)
  const allKeywords = [
    ...new Set(allAnswers.flatMap((a) => extractKeywords(normalizeFreewrite(a)))),
  ];
  if (allKeywords.length === 0) return true; // no content keywords — question word alone is enough

  // 2c. Count matched keywords (at least one user word fuzzy-matches each keyword)
  const userWords = userNorm.split(/\s+/);
  const matchedCount = allKeywords.filter((kw) =>
    userWords.some((uw) => fuzzyWordMatch(uw, kw))
  ).length;

  return matchedCount / allKeywords.length >= 0.7;
}

// ── Freewrite hint feedback ────────────────────────────────────────────────

export type FreetypeKeywordHint = {
  /** Whether the required question word / structure was found. null = no questionWord given. */
  questionWordOk: boolean | null;
  /** Correct-answer keywords the user successfully matched (normalized form). */
  matchedKeywords: string[];
  /** Correct-answer keywords the user missed (normalized form). */
  missingKeywords: string[];
  /**
   * The user's own word tokens (normalized) that fuzzy-matched a keyword.
   * Used so the UI can color the user's typo-word as green even though it
   * doesn't exactly equal the canonical keyword string.
   */
  userMatchedWords: string[];
};

/**
 * Returns keyword-level feedback for a wrong freewrite attempt.
 * Drives the hint panel shown after the 1st and 2nd wrong attempts.
 */
export function getFreetypeKeywordHint(
  item: FreetypeItem,
  userInput: string,
  questionWord?: string,
): FreetypeKeywordHint {
  const userNorm = normalizeFreewrite(userInput);
  const allAnswers = [item.answer, ...(item.acceptedAnswers ?? [])];
  const allKws = [
    ...new Set(allAnswers.flatMap((a) => extractKeywords(normalizeFreewrite(a)))),
  ];
  const userWords = userNorm.split(/\s+/).filter(Boolean);

  const matched: string[] = [];
  const missing: string[] = [];
  const userMatchedWords: string[] = [];

  for (const kw of allKws) {
    const matchingUserWord = userWords.find((uw) => fuzzyWordMatch(uw, kw));
    if (matchingUserWord) {
      matched.push(kw);
      if (!userMatchedWords.includes(matchingUserWord)) {
        userMatchedWords.push(matchingUserWord);
      }
    } else {
      missing.push(kw);
    }
  }

  return {
    questionWordOk: questionWord ? questionWordPresent(userNorm, questionWord) : null,
    matchedKeywords: matched,
    missingKeywords: missing,
    userMatchedWords,
  };
}
