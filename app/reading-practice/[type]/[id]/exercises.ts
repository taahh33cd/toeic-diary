/**
 * Pure functions for generating post-reading exercises from rich explanation data.
 */

export type RichExplanation = {
  dan_chung: string;
  ham_y:     string;
  lien_he:   string;
  tu_vung:   { tu: string; nghia: string }[];
  dich_bai:  string;
};

export type ExerciseItem = {
  id:           string;
  question:     string;      // plain-text prompt shown above options
  contextHtml?: string;      // optional HTML block (blanked passage) shown as context
  options:      string[];
  correctIndex: number;
  feedback:     string;
};

export type ExerciseSet = {
  vocab:       ExerciseItem[];
  paraphrase:  ExerciseItem[];
  translation: ExerciseItem[];
};

export type ReadingQuestion = {
  text:    string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a 4-option question. Pads with repeated distractors if pool is small. */
function makeOptions(
  correct: string,
  pool: string[]
): { options: string[]; correctIndex: number } | null {
  const unique = [...new Set(pool.filter(s => s !== correct && s.trim().length > 0))];
  if (unique.length < 1) return null;
  const shuffled = shuffle(unique);
  const distractors: string[] = [];
  for (let i = 0; distractors.length < 3; i++) {
    distractors.push(shuffled[i % shuffled.length]);
  }
  const options = shuffle([correct, ...distractors]);
  return { options, correctIndex: options.indexOf(correct) };
}

// ─── vocab ───────────────────────────────────────────────────────────────────

export function generateVocab(rich: RichExplanation[]): ExerciseItem[] {
  const all    = rich.flatMap(e => e.tu_vung ?? []);
  const unique = [...new Map(all.map(v => [v.tu, v])).values()];
  if (unique.length < 2) return [];

  const nghiaPool = unique.map(v => v.nghia);
  const selected  = shuffle(unique).slice(0, 5);

  return selected.flatMap((v, i): ExerciseItem[] => {
    const result = makeOptions(v.nghia, nghiaPool.filter(n => n !== v.nghia));
    if (!result) return [];
    return [{
      id:           `vocab-${i}`,
      question:     `Từ "${v.tu}" có nghĩa là gì?`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `"${v.tu}" nghĩa là "${v.nghia}"`,
    }];
  });
}

// ─── paraphrase ──────────────────────────────────────────────────────────────

type PhrasePair = { original: string; paraphrase: string };

function extractPairs(hamY: string): PhrasePair[] {
  const RE = /↳\s*<i>'([^']+)'<\/i>[^=\n]*=\s*<i>'([^']+)'<\/i>/g;
  const pairs: PhrasePair[] = [];
  let m: RegExpExecArray | null;
  while ((m = RE.exec(hamY))) {
    pairs.push({ original: m[1].trim(), paraphrase: m[2].trim() });
  }
  return pairs;
}

export function generateParaphrase(rich: RichExplanation[]): ExerciseItem[] {
  const allPairs = rich.flatMap(e => extractPairs(e.ham_y));
  if (allPairs.length < 1) return [];

  // distractor pool = all paraphrase values + all original phrases
  const paraphrasePool = allPairs.map(p => p.paraphrase);
  const originalPool   = allPairs.map(p => p.original);
  const fullPool       = [...paraphrasePool, ...originalPool];

  return allPairs.slice(0, 4).flatMap((pair, i): ExerciseItem[] => {
    const result = makeOptions(pair.paraphrase, fullPool.filter(s => s !== pair.paraphrase));
    if (!result) return [];
    return [{
      id:           `para-${i}`,
      question:     `Cụm nào diễn đạt cùng ý nghĩa với:\n"${pair.original}"`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `"${pair.original}" = "${pair.paraphrase}"`,
    }];
  });
}

// ─── translation (Việt → Anh) ────────────────────────────────────────────────
//
// Genuine translation exercise:
//   - Show a Vietnamese sentence from dich_bai
//   - User picks the correct English equivalent (dan_chung)
//   - Distractors: the 3 WRONG answer options from the same reading question
//     (they describe the same topic but incorrectly → natural wrong translations)
//
// This tests translation ability, not passage memory.

/** Split a plain-text passage into sentences of min length. */
function splitSentences(text: string, minLen = 20): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= minLen);
}

export function generateTranslation(
  questions: ReadingQuestion[],
  rich: RichExplanation[]
): ExerciseItem[] {
  if (rich.length < 1 || questions.length < 1) return [];

  // dich_bai is the same full passage translation across questions — split into sentences
  const viSentences = splitSentences(stripHtml(rich[0].dich_bai));
  if (viSentences.length < 1) return [];

  const items: ExerciseItem[] = [];
  const limit = Math.min(questions.length, rich.length, viSentences.length, 3);

  for (let i = 0; i < limit; i++) {
    const q       = questions[i];
    const e       = rich[i];
    const correct = stripHtml(e.dan_chung);
    const viSent  = viSentences[i];

    if (!correct || correct.length < 5 || !viSent) continue;

    // Distractors: wrong answer options from this reading question
    const wrongOpts = (["A", "B", "C", "D"] as const)
      .filter(k => k !== q.correct)
      .map(k => q.options[k])
      .filter(s => s.trim().length > 0);

    const result = makeOptions(correct, wrongOpts);
    if (!result) continue;

    items.push({
      id:           `trans-${i}`,
      question:     `Câu tiếng Anh nào là bản dịch chính xác của câu sau?\n\n"${viSent}"`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `Bản dịch: "${correct}"`,
    });
  }

  return items;
}

// ─── main builder ─────────────────────────────────────────────────────────────

export function buildExercises(
  questions: ReadingQuestion[],
  rich: RichExplanation[]
): ExerciseSet {
  return {
    vocab:       generateVocab(rich),
    paraphrase:  generateParaphrase(rich),
    translation: generateTranslation(questions, rich),
  };
}

export function calcScore(
  items: ExerciseItem[],
  answers: Record<string, number>
): number {
  if (items.length === 0) return 0;
  const correct = items.filter(it => answers[it.id] === it.correctIndex).length;
  return Math.round((correct / items.length) * 100);
}
