import type { VerbBlank, VerbMCQ } from "@/lib/subskills/verbs/types";
import { khongDoiL5, khongDoiL6 } from "./khong-doi";
import { v2v3DuoiTL5, v2v3DuoiTL6 } from "./v2v3-duoi-t";
import { v2v3DoiNguyenAmL5, v2v3DoiNguyenAmL6 } from "./v2v3-doi-nguyen-am";
import { baDangKhac2L5, baDangKhac2L6 } from "./ba-dang-khac-2";
import { dacBietL5, dacBietL6 } from "./dac-biet";
import { baDangKhac1L5, baDangKhac1L6 } from "./ba-dang-khac-1";

/**
 * Câu ngữ cảnh cho L5 (điền vào câu) và L6 (TOEIC Part 5).
 * Khác với L1–L4 (sinh tự động từ bảng động từ), hai level này phải soạn tay
 * nên được nạp dần theo từng nhóm. Nhóm chưa có sẽ hiện "Sắp có".
 */
export const GROUP_SENTENCES: Record<string, { l5: VerbBlank[]; l6: VerbMCQ[] }> = {
  "khong-doi": { l5: khongDoiL5, l6: khongDoiL6 },
  "v2v3-duoi-t": { l5: v2v3DuoiTL5, l6: v2v3DuoiTL6 },
  "v2v3-doi-nguyen-am": { l5: v2v3DoiNguyenAmL5, l6: v2v3DoiNguyenAmL6 },
  "ba-dang-khac-2": { l5: baDangKhac2L5, l6: baDangKhac2L6 },
  "dac-biet": { l5: dacBietL5, l6: dacBietL6 },
  "ba-dang-khac-1": { l5: baDangKhac1L5, l6: baDangKhac1L6 },
};
