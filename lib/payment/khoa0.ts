/**
 * Khoá 0 (self-study, lifetime unlock) purchase config + helpers.
 *
 * Payment is a plain bank transfer to the Techcombank account, reconciled
 * automatically by SePay: SePay watches the linked bank account and POSTs a
 * webhook whenever money arrives. We put a unique per-order code in the
 * transfer note and match it in the webhook to fulfil the right order.
 */

import { randomBytes } from "crypto";

/** Course id 0 == "Khoá 0" in components/course/CourseCards.tsx */
export const KHOA0_COURSE_ID = 0;
/** Price in VND — must match the price shown on the /course page. */
export const KHOA0_PRICE = 49000;

// Bank account that receives transfers (same as the QR on the fee receipt).
export const BANK_ACCOUNT = "7313779966";
export const BANK_CODE = "Techcombank";
export const BANK_OWNER = "LAM QUANG HIEU";

/**
 * Builds a SePay dynamic VietQR image URL that pre-fills amount + transfer note.
 * The scanned transfer note (`des`) is the order code we match in the webhook.
 */
export function buildSepayQrUrl(code: string): string {
  const params = new URLSearchParams({
    acc: BANK_ACCOUNT,
    bank: BANK_CODE,
    amount: String(KHOA0_PRICE),
    des: code,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

// Uppercase, no ambiguous characters (0/O, 1/I) so hand-typed notes still match.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generates a transfer-note order code, e.g. "KHOA0AB2CD3EF". */
export function generatePurchaseCode(): string {
  const bytes = randomBytes(8);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `KHOA0${s}`;
}

/** Strips everything but A-Z0-9 and uppercases — banks add spaces/punctuation. */
export function normalizeNote(s: string): string {
  return (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
