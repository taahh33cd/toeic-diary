import type { VerbBlank, VerbMCQ } from "@/lib/subskills/verbs/types";
import { khongDoiL5, khongDoiL6 } from "./khong-doi";

/**
 * Câu ngữ cảnh cho L5 (điền vào câu) và L6 (TOEIC Part 5).
 * Khác với L1–L4 (sinh tự động từ bảng động từ), hai level này phải soạn tay
 * nên được nạp dần theo từng nhóm. Nhóm chưa có sẽ hiện "Sắp có".
 */
export const GROUP_SENTENCES: Record<string, { l5: VerbBlank[]; l6: VerbMCQ[] }> = {
  "khong-doi": { l5: khongDoiL5, l6: khongDoiL6 },
};
