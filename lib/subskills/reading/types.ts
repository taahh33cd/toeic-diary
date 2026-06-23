// ── Exercise question types ──────────────────────────────────────────────────

/** Standard 4-option multiple choice (used for L1, L3, L4, L5, L6) */
export type GrammarMCQ = {
  kind: "mcq";
  id: string;
  /** English sentence shown to user. For L4, contains "___" blank. */
  sentence: string;
  /** Vietnamese translation — shown for L1–L5, hidden for L6 */
  translation?: string;
  /** Grammar hint e.g. "Công thức: has/have + V3" — shown for L1–L2 only */
  grammarHint?: string;
  /** The question text displayed above the options */
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  /** English explanation (shown after answering) */
  explanation: string;
  /** Optional Vietnamese gloss for the explanation */
  explanationVi?: string;
};

/** Click-to-highlight time markers (used for L2) */
export type GrammarHighlight = {
  kind: "highlight";
  id: string;
  /** Full sentence displayed as clickable word-chips */
  sentence: string;
  translation: string;
  instruction: string; // e.g. "Bấm vào từ/cụm là dấu hiệu thì trong câu:"
  /** Exact surface forms of words the user must click (case-sensitive match) */
  correctWords: string[];
  explanation: string;
};

export type GrammarQuestion = GrammarMCQ | GrammarHighlight;

// ── Level config ─────────────────────────────────────────────────────────────

export type LevelSlug = "l1" | "l2" | "l3" | "l4" | "l5" | "l6";
export type LevelDifficulty = "easy" | "medium" | "hard";

export type Part5Level = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  slug: LevelSlug;
  name: string;           // e.g. "Nhận diện thì"
  nameEn: string;         // e.g. "Tense Recognition"
  description: string;    // short description shown on card
  instruction: string;    // shown at the top of the quiz screen
  difficulty: LevelDifficulty;
  passThreshold: number;  // 80
  questions: GrammarQuestion[];
};

// ── Tense config ──────────────────────────────────────────────────────────────

export type TenseImportance = 1 | 2 | 3; // 3 = very common in TOEIC

export type Part5TenseConfig = {
  slug: string;           // URL slug, e.g. "hien-tai-don"
  name: string;           // Vietnamese name, e.g. "Hiện tại đơn"
  nameEn: string;         // English name, e.g. "Simple Present"
  formula: string;        // Active formula, e.g. "V / V-s/es"
  formulaPassive?: string; // Passive formula, e.g. "am/is/are + V3"
  description: string;    // 1 sentence Vietnamese description
  timeMarkers: string[];  // Key time markers
  contrastWith: string;   // Slug of most-confused tense
  importance: TenseImportance;
  levels: Part5Level[];
};

// ── DB helpers ────────────────────────────────────────────────────────────────

/** Converts a tense slug to the `part` field stored in subskill_attempts */
export function tenseToPartKey(tenseSlug: string): string {
  return `r5-${tenseSlug}`;
}

/** Best score record for one (part, questionWord, exerciseIndex) */
export type BestScore = { score: number; passed: boolean };
