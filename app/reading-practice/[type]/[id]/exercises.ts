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
  question:     string;
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
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

/**
 * Build a 4-option question from a correct answer and a distractor pool.
 * Picks up to 3 unique distractors; if fewer than 1 unique distractor exists, returns null.
 */
function makeOptions(
  correct: string,
  pool: string[]
): { options: string[]; correctIndex: number } | null {
  const unique = [...new Set(pool.filter(s => s !== correct && s.trim().length > 0))];
  if (unique.length < 1) return null;

  // Take up to 3 distractors; if pool small, repeat to reach 3
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
  // Matches: ↳ <i>'X'</i> (optional Vietnamese gloss) = <i>'Y'</i>
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

  // Distractor pool: paraphrase values (Y) + original phrases (X)
  // Using originals as distractors is valid: students shouldn't confuse "the phrase itself"
  // with "what the phrase means".
  const paraphrasePool = allPairs.map(p => p.paraphrase);
  const originalPool   = allPairs.map(p => p.original);
  const fullPool       = [...paraphrasePool, ...originalPool];

  return allPairs.slice(0, 4).flatMap((pair, i): ExerciseItem[] => {
    const distractorPool = fullPool.filter(s => s !== pair.paraphrase);
    const result = makeOptions(pair.paraphrase, distractorPool);
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

// ─── translation ─────────────────────────────────────────────────────────────

export function generateTranslation(
  questions: ReadingQuestion[],
  rich: RichExplanation[]
): ExerciseItem[] {
  if (rich.length < 1) return [];

  const danChungPool = rich
    .map(e => stripHtml(e.dan_chung))
    .filter(s => s.length > 0);

  // Fallback distractor pool: wrong answer options from reading questions
  const wrongOptionsPool = questions.flatMap(q =>
    (["A", "B", "C", "D"] as const)
      .filter(k => k !== q.correct)
      .map(k => q.options[k])
  );

  return rich.slice(0, 3).flatMap((e, i): ExerciseItem[] => {
    const correct = stripHtml(e.dan_chung);
    if (!correct || correct.length < 5) return [];

    // Take first meaningful sentence from Vietnamese translation
    const viRaw   = stripHtml(e.dich_bai);
    const viFirst = viRaw.split(/[.!?](?=\s|$)/).find(s => s.trim().length > 20)
      ?? viRaw.slice(0, 130);

    // Build distractor pool: other dan_chung + wrong reading options
    const distractorPool = [
      ...danChungPool.filter(d => d !== correct),
      ...wrongOptionsPool,
    ];

    const result = makeOptions(correct, distractorPool);
    if (!result) return [];

    return [{
      id:           `trans-${i}`,
      question:     `Đoạn dịch tiếng Việt sau tương ứng với nội dung tiếng Anh nào?\n\n"${viFirst.trim()}"`,
      options:      result.options,
      correctIndex: result.correctIndex,
      feedback:     `Bằng chứng trong bài: "${correct}"`,
    }];
  });
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
