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

// ─── translation (cloze / fill-in-the-blank) ─────────────────────────────────
//
// Shows the full Vietnamese translation (dich_bai) with one key Vietnamese word
// blanked out. User selects the correct English equivalent (tu_vung.tu).
// Each question blanks a DIFFERENT vocabulary word → no duplicate prompts.

/** Escape a string for use in a RegExp */
function reEscape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace first occurrence of `phrase` in `html` with a highlighted blank. */
function blankInHtml(html: string, phrase: string): string {
  const re = new RegExp(reEscape(phrase), "i");
  return html.replace(
    re,
    `<mark style="background:#fde68a;padding:0 3px;border-radius:3px;font-weight:700">____</mark>`
  );
}

type VocabMatch = {
  tu:    string;   // English word
  nghia: string;   // Vietnamese meaning
  found: string;   // the actual substring found in the plain text
};

/** Find vocabulary words whose meanings appear verbatim in the Vietnamese text. */
function findVocabInText(
  tuVung: { tu: string; nghia: string }[],
  plainText: string
): VocabMatch[] {
  const results: VocabMatch[] = [];
  const lowerText = plainText.toLowerCase();

  for (const v of tuVung) {
    // Try the full nghia first, then each part split by comma/semicolon
    const candidates = [
      v.nghia,
      ...v.nghia.split(/[,;\/]/).map(s => s.trim()),
    ].filter(s => s.length >= 4); // ignore very short fragments

    for (const candidate of candidates) {
      if (lowerText.includes(candidate.toLowerCase())) {
        results.push({ tu: v.tu, nghia: v.nghia, found: candidate });
        break; // take first match per vocabulary word
      }
    }
  }

  return results;
}

export function generateTranslation(
  questions: ReadingQuestion[],
  rich: RichExplanation[]
): ExerciseItem[] {
  if (rich.length < 1) return [];

  // Collect ALL vocabulary matches across all questions (using the FIRST dich_bai,
  // since dich_bai is the same full passage translation for every question).
  const dich_bai  = rich[0].dich_bai;
  const plainText = stripHtml(dich_bai);

  // Gather all unique tu_vung entries
  const allVocab = rich.flatMap(e => e.tu_vung ?? []);
  const uniqueVocab = [...new Map(allVocab.map(v => [v.tu, v])).values()];

  const matches = findVocabInText(uniqueVocab, plainText);
  if (matches.length < 1) return [];

  // English words pool for distractors
  const tuPool = uniqueVocab.map(v => v.tu);

  // Generate one question per matched vocabulary word (up to 4)
  const items: ExerciseItem[] = [];
  for (let i = 0; i < Math.min(matches.length, 4); i++) {
    const match = matches[i];
    const result = makeOptions(match.tu, tuPool.filter(t => t !== match.tu));
    if (!result) continue;

    // Build blanked HTML (replace the found Vietnamese phrase with _____)
    const blankedHtml = blankInHtml(dich_bai, match.found);

    items.push({
      id:          `trans-${i}`,
      question:    "Chọn từ tiếng Anh tương ứng với phần được đánh dấu trong bản dịch:",
      contextHtml: blankedHtml,
      options:     result.options,
      correctIndex: result.correctIndex,
      feedback:    `"${match.found}" (tiếng Việt) = "${match.tu}" (tiếng Anh)`,
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
