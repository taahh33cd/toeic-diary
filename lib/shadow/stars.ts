// Chọn câu ⭐ để học viên shadow trước.
// Thứ tự ưu tiên (docs/shadow-spec.md): câu vừa chép sai nhiều nhất → câu chứa
// đáp án đúng → câu dài nhất. Câu dưới 3 từ không được chọn vì quá ngắn để luyện ngữ điệu.

import { splitDisplayWords } from "./prosody";

export interface StarInput {
  id: string;
  content: string;
  optionLabel?: string | null;
  /** Admin ghi đè: true = luôn ⭐, false = không bao giờ ⭐. */
  isStarred?: boolean | null;
}

export const STAR_COUNT = 3;
const MIN_WORDS = 3;

export function pickStarred(
  sentences: StarInput[],
  opts: { errorsBySentence?: Record<string, number>; correctOption?: string | null } = {}
): string[] {
  const errors = opts.errorsBySentence ?? {};
  const answer = opts.correctOption?.trim().toUpperCase() || null;
  // Câu admin đánh ⭐ đứng trước; câu admin loại thì không bao giờ chọn. Còn chỗ thì tự chọn tiếp.
  const forced = sentences.filter((s) => s.isStarred === true).slice(0, STAR_COUNT).map((s) => s.id);
  const free = sentences.filter((s) => s.isStarred !== true && s.isStarred !== false);
  const need = Math.min(STAR_COUNT - forced.length, free.length);
  if (need <= 0) return forced;
  const eligible = free.filter((s) => splitDisplayWords(s.content).length >= MIN_WORDS);
  const pool = eligible.length >= need ? eligible : free;

  return forced.concat([...pool]
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
    .slice(0, need)
    .map((s) => s.id));
}
