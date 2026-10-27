// So khớp câu — dùng ở cấp tự chấm, chạy được cả trên client.

/** Bỏ dấu câu, hạ chữ thường, gộp khoảng trắng. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[—–]/g, " ")
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Đúng/sai cho chỗ trống trong khuôn câu. */
export function matchesAnswer(input: string, answers: string[]): boolean {
  const got = normalize(input);
  return answers.some((a) => normalize(a) === got);
}

/**
 * Từ chức năng — thiếu hoặc đổi những từ này thì câu vẫn còn nghĩa, mà bản
 * chuyển giọng-thành-chữ lại rất hay nuốt chúng. Chấm theo từ nội dung thôi.
 */
const FUNCTION_WORDS = new Set([
  "a", "an", "the", "to", "of", "for", "in", "on", "at", "by", "with", "and",
  "or", "but", "so", "is", "are", "am", "be", "been", "was", "were", "do",
  "does", "did", "will", "would", "can", "could", "should", "have", "has",
  "had", "it", "this", "that", "these", "those", "i", "you", "we", "they",
  "he", "she", "my", "your", "our", "their", "his", "her", "its", "not",
  "please", "about", "from", "as", "than", "up", "out", "yet", "there",
]);

export function contentWords(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 0 && !FUNCTION_WORDS.has(w));
}

export type MatchResult = {
  /** 0–100 theo tỉ lệ từ nội dung của câu mẫu xuất hiện trong bản thu */
  score: number;
  hit: string[];
  missed: string[];
};

/** Bản thu (đã chuyển thành chữ) nói lại đúng câu mẫu đến mức nào. */
export function matchModel(model: string, said: string): MatchResult {
  const want = contentWords(model);
  const got = new Set(contentWords(said));
  const hit: string[] = [];
  const missed: string[] = [];
  for (const w of want) {
    // Chấp nhận biến thể đuôi nhẹ: report/reports, approve/approved.
    const ok = got.has(w) || [...got].some((g) => stemEq(g, w));
    (ok ? hit : missed).push(w);
  }
  const score = want.length === 0 ? 0 : Math.round((hit.length / want.length) * 100);
  return { score, hit, missed };
}

function stem(w: string): string {
  return w.replace(/(ies|ied|es|ed|ing|s)$/, "");
}

function stemEq(a: string, b: string): boolean {
  if (a === b) return true;
  const sa = stem(a);
  const sb = stem(b);
  return sa.length >= 4 && sa === sb;
}

/** Từ cho sẵn có thật sự xuất hiện trong câu học viên tạo ra hay không. */
export function usesWord(answer: string, word: string): boolean {
  const said = normalize(answer);
  const target = normalize(word);
  if (target.includes(" ")) return said.includes(target);
  return said.split(" ").some((w) => stemEq(w, target));
}
