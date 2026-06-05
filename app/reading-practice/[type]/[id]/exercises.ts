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
  feedback:     string;  // shown after answering
};

export type ExerciseSet = {
  vocab:       ExerciseItem[];
  paraphrase:  ExerciseItem[];
  translation: ExerciseItem[];
  summary:     ExerciseItem[];
};

// ─── helpers ────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOptions(correct: string, pool: string[]): { options: string[]; correctIndex: number } | null {
  const distractors = shuffle(pool.filter(s => s !== correct && s.trim())).slice(0, 3);
  if (distractors.length < 2) return null;  // need at least 3 options total
  // pad to 3 distractors if short
  const needed = 3 - distractors.length;
  const padded = distractors.concat(distractors.slice(0, needed));
  const options = shuffle([correct, ...padded.slice(0, 3)]);
  return { options, correctIndex: options.indexOf(correct) };
}

// ─── vocab ──────────────────────────────────────────────────

export function generateVocab(rich: RichExplanation[]): ExerciseItem[] {
  const all = rich.flatMap(e => e.tu_vung ?? []);
  const unique = [...new Map(all.map(v => [v.tu, v])).values()];
  if (unique.length < 3) return [];

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

// ─── paraphrase ─────────────────────────────────────────────

type PhrasePair = { original: string; paraphrase: string };

function extractPairs(hamY: string): PhrasePair[] {
  // matches: ↳ <i>'X'</i> (...optional...) = <i>'Y'</i>
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
  if (allPairs.length < 2) return [];

  const paraphrasePool = allPairs.map(p => p.paraphrase);

  return allPairs.slice(0, 4).flatMap((pair, i): ExerciseItem[] => {
    const result = makeOptions(pair.paraphrase, paraphrasePool.filter(p => p !== pair.paraphrase));
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

// ─── translation ────────────────────────────────────────────

export function generateTranslation(rich: RichExplanation[]): ExerciseItem[] {
  if (rich.length < 2) return [];

  const danChungPool = rich.map(e => stripHtml(e.dan_chung)).filter(s => s.length > 0);

  return rich.slice(0, 3).flatMap((e, i): ExerciseItem[] => {
    const correct = stripHtml(e.dan_chung);
    if (!correct) return [];

    // Take the first meaningful sentence of the Vietnamese translation
    const viRaw   = stripHtml(e.dich_bai);
    const viFirst = viRaw.split(/[.!?]/).find(s => s.trim().length > 20) ?? viRaw.slice(0, 120);

    const result = makeOptions(correct, danChungPool.filter(d => d !== correct));
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

// ─── summary ────────────────────────────────────────────────

type ReadingQuestion = {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
};

export function generateSummary(
  questions: ReadingQuestion[],
  rich: RichExplanation[]
): ExerciseItem[] {
  if (questions.length === 0) return [];

  return questions.slice(0, 3).flatMap((q, i): ExerciseItem[] => {
    const e = rich[i];
    const hint = e ? stripHtml(e.lien_he).split(".")[0].trim() : "";
    const opts  = [q.options.A, q.options.B, q.options.C, q.options.D];
    const ci    = ["A", "B", "C", "D"].indexOf(q.correct);
    if (ci < 0) return [];

    const danChung = e ? `Bài đọc nêu rõ: "${stripHtml(e.dan_chung)}"` : "";

    return [{
      id:           `sum-${i}`,
      question:     `${q.text}${hint ? `\n\n(Gợi ý: ${hint})` : ""}`,
      options:      opts,
      correctIndex: ci,
      feedback:     danChung,
    }];
  });
}

// ─── main builder ────────────────────────────────────────────

export function buildExercises(
  questions: ReadingQuestion[],
  rich: RichExplanation[]
): ExerciseSet {
  return {
    vocab:       generateVocab(rich),
    paraphrase:  generateParaphrase(rich),
    translation: generateTranslation(rich),
    summary:     generateSummary(questions, rich),
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
