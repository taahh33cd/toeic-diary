// Chọn câu ⭐ để học viên shadow trước.
// Thứ tự ưu tiên (docs/shadow-spec.md): câu vừa chép sai nhiều nhất → câu chứa
// đáp án đúng → câu dài nhất. Câu dưới 3 từ không được chọn vì quá ngắn để luyện ngữ điệu.

import { splitDisplayWords } from "./prosody";

export interface StarInput {
  id: string;
  content: string;
  optionLabel?: string | null;
}

export const STAR_COUNT = 3;
const MIN_WORDS = 3;

export function pickStarred(
  sentences: StarInput[],
  opts: { errorsBySentence?: Record<string, number>; correctOption?: string | null } = {}
): string[] {
  const errors = opts.errorsBySentence ?? {};
  const answer = opts.correctOption?.trim().toUpperCase() || null;
  const eligible = sentences.filter((s) => splitDisplayWords(s.content).length >= MIN_WORDS);
  const pool = eligible.length >= Math.min(STAR_COUNT, sentences.length) ? eligible : sentences;

  return [...pool]
    .map((s, i) => ({
      id: s.id,
      i,
      err: errors[s.id] ?? 0,
      isAnswer: !!answer && s.optionLabel?.toUpperCase() === answer,
      len: splitDisplayWords(s.content).length,
    }))
    .sort((a, b) =>
      b.err - a.err ||
      Number(b.isAnswer) - Number(a.isAnswer) ||
      b.len - a.len ||
      a.i - b.i
    )
    .slice(0, STAR_COUNT)
    .map((s) => s.id);
}
