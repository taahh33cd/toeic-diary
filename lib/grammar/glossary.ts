import type { GrammarQuestion } from "./types";

export interface GlossaryEntry {
  word: string;
  type: string;
  meaning: string;
}

/** Số từ trọng điểm đưa vào flashcard / trắc nghiệm / điền từ. */
const FOCUS_LIMIT = 12;

interface Ranked {
  entry: GlossaryEntry;
  freq: number;
}

/**
 * Ưu tiên từ lặp lại nhiều lần trong đề, rồi tới cụm từ, rồi tới từ dài
 * (độ dài là proxy thô cho độ khó: "subsidiary" đáng học hơn "grow").
 */
function score({ entry, freq }: Ranked): number {
  const isPhrase = entry.word.includes(" ");
  return freq * 100 + (isPhrase ? 30 : 0) + Math.min(entry.word.length, 20);
}

/**
 * Gom core_vocabulary của mọi câu trong một test, khử trùng lặp và xếp hạng.
 * `focus` là bộ từ trọng điểm để luyện, `extra` là phần còn lại chỉ để tra cứu.
 */
export function buildGlossary(questions: GrammarQuestion[]): {
  focus: GlossaryEntry[];
  extra: GlossaryEntry[];
} {
  const seen = new Map<string, Ranked>();

  for (const q of questions) {
    for (const v of q.core_vocabulary ?? []) {
      const word = (v?.word ?? "").trim();
      const meaning = (v?.meaning ?? "").trim();
      if (!word || !meaning) continue;

      const key = word.toLowerCase();
      const hit = seen.get(key);
      if (hit) {
        hit.freq++;
      } else {
        seen.set(key, {
          entry: { word, type: (v.type ?? "").trim(), meaning },
          freq: 1,
        });
      }
    }
  }

  const ranked = [...seen.values()]
    .sort((a, b) => score(b) - score(a) || a.entry.word.localeCompare(b.entry.word))
    .map((r) => r.entry);

  return { focus: ranked.slice(0, FOCUS_LIMIT), extra: ranked.slice(FOCUS_LIMIT) };
}
