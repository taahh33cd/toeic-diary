/**
 * Chuẩn hoá từ để làm khoá nối VocabCard → VocabProgress.
 *
 * Chỉ hạ chữ thường và gộp khoảng trắng thừa — KHÔNG bỏ dấu gạch nối hay
 * khoảng trắng giữa từ, nên "take off" và "takeoff" vẫn là hai từ khác nhau
 * (đúng: một là phrasal verb, một là danh từ).
 */
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}
