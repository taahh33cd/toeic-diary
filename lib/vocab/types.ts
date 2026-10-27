/**
 * Kiểu dùng chung cho cả server và client ở khu bộ thẻ.
 *
 * Tách khỏi lib/vocab/client.ts (có "use client" ngầm qua các hàm fetch) và
 * khỏi lib/vocab/deck.ts (kéo theo zod + node:crypto) để route handler import
 * không lôi theo thứ không cần.
 */
export interface CardDraft {
  word: string;
  ipa?: string;
  pos?: string;
  meaningVi?: string;
  definition?: string;
  example?: string;
  imageUrl?: string;
  imagePublicId?: string;
  audioUrl?: string;
}
