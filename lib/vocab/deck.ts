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
  pos: z.string().trim().max(20).optional(),
  meaningVi: z.string().trim().max(300).optional(),
  definition: z.string().trim().max(1000).optional(),
  example: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().url().max(600).optional(),
  imagePublicId: z.string().trim().max(300).optional(),
  audioUrl: z.string().trim().url().max(600).optional(),
});

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
