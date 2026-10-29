import { randomBytes } from "node:crypto";
import { z } from "zod";
import { normalizeWord } from "./normalize";

/** base58 — bỏ 0/O/I/l để đọc qua điện thoại không nhầm. */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Slug cho link chia sẻ. 10 ký tự base58 ≈ 58^10, không đoán được. */
export function makeSlug(len = 10): string {
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += B58[b[i] % B58.length];
  return s;
}

export function makeId(prefix: string): string {
  return `${prefix}_${makeSlug(16)}`;
}

export const cardInput = z.object({
  word: z.string().trim().min(1, "Thiếu từ").max(120),
  ipa: z.string().trim().max(120).optional(),
  // 60 chứ không phải 20: dữ liệu migrate từ sổ cũ có loại từ ghi cả cụm như
  // "noun, verb, adjective, adverb" (29 ký tự). Để 20 là 3 bộ thật không lưu
  // nổi, mà lỗi chỉ hiện ra lúc bấm Lưu.
  pos: z.string().trim().max(60).optional(),
  meaningVi: z.string().trim().max(300).optional(),
  definition: z.string().trim().max(1000).optional(),
  example: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().url().max(600).optional(),
  imagePublicId: z.string().trim().max(300).optional(),
  audioUrl: z.string().trim().url().max(600).optional(),
});

/** Tên tiếng Việt của từng trường, để báo lỗi nói rõ chỗ nào sai. */
const TEN_TRUONG: Record<string, string> = {
  word: "Từ",
  ipa: "Phiên âm",
  pos: "Loại từ",
  meaningVi: "Nghĩa tiếng Việt",
  definition: "Định nghĩa",
  example: "Ví dụ",
  imageUrl: "Link ảnh",
  audioUrl: "Link audio",
  title: "Tên bộ",
  description: "Mô tả",
  part: "Part",
  cards: "Danh sách thẻ",
};

/**
 * Đổi lỗi zod thành câu tiếng Việt chỉ đúng chỗ sai.
 *
 * Trả thẳng issues[0].message cho ra những câu như "Too big: expected string
 * to have <=20 characters" — học viên đọc xong vẫn không biết sửa ô nào.
 */
export function moTaLoi(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "Dữ liệu không hợp lệ";

  // path kiểu ["cards", 3, "pos"] → thẻ thứ 4, trường "Loại từ"
  const truong = [...i.path].reverse().find((x) => typeof x === "string" && TEN_TRUONG[x]);
  const chiSo = i.path.find((x) => typeof x === "number");
  const viTri =
    typeof chiSo === "number" ? ` (thẻ thứ ${chiSo + 1})` : "";
  const nhan = typeof truong === "string" ? TEN_TRUONG[truong] : null;

  if (i.code === "too_big" && "maximum" in i) {
    return `${nhan ?? "Một trường"}${viTri} quá dài — tối đa ${i.maximum} ký tự.`;
  }
  if (i.code === "too_small") {
    return `${nhan ?? "Một trường"}${viTri} không được để trống.`;
  }
  if (i.code === "invalid_format") {
    return `${nhan ?? "Một trường"}${viTri} sai định dạng.`;
  }
  return nhan ? `${nhan}${viTri}: ${i.message}` : i.message;
}

export const deckCreateInput = z.object({
  title: z.string().trim().min(1, "Thiếu tiêu đề").max(150),
  description: z.string().trim().max(1000).optional(),
  part: z.number().int().min(1).max(7).optional(),
  source: z.enum(["manual", "ai_bulk", "ai_content"]).optional(),
  sourceRef: z.string().trim().max(200).optional(),
  cards: z.array(cardInput).max(500, "Một bộ tối đa 500 thẻ").optional(),
});

export const deckPatchInput = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  part: z.number().int().min(1).max(7).nullable().optional(),
});

export type CardInput = z.infer<typeof cardInput>;

/**
 * Chuẩn hoá danh sách thẻ trước khi ghi: bỏ từ trùng (giữ bản đầu, vì học viên
 * thường sửa dần từ trên xuống) và gán thứ tự. word_key phải không trùng trong
 * một bộ — DB có unique index, nên lọc ở đây để báo lỗi tử tế thay vì vỡ ở DB.
 */
export function prepareCards(cards: CardInput[]): {
  rows: (CardInput & { id: string; wordKey: string; order: number })[];
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const rows: (CardInput & { id: string; wordKey: string; order: number })[] = [];

  for (const c of cards) {
    const wordKey = normalizeWord(c.word);
    if (seen.has(wordKey)) {
      duplicates.push(c.word.trim());
      continue;
    }
    seen.add(wordKey);
    rows.push({ ...c, word: c.word.trim(), wordKey, id: makeId("vc"), order: rows.length });
  }

  return { rows, duplicates };
}
