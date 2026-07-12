/**
 * Khoá 0 (self-study, lifetime unlock) purchase config + helpers.
 *
 * Flow: the buyer transfers to the Techcombank account via a VietQR that
 * pre-fills the amount + a unique order code as the note. An admin then
 * verifies the incoming transfer in the admin panel and approves the order,
 * which grants course access. (Semi-automatic — no payment provider needed,
 * since SePay/webhook services don't support Techcombank.)
 */

import { randomBytes } from "crypto";

/** Course id 0 == "Khoá 0" in components/course/CourseCards.tsx */
export const KHOA0_COURSE_ID = 0;
/** Price in VND — must match the price shown on the /course page. */
export const KHOA0_PRICE = 49000;

// Techcombank account that receives transfers (same as the fee-receipt QR).
export const BANK_ACCOUNT = "7313779966";
export const BANK_CODE = "TCB"; // VietQR short code for Techcombank
export const BANK_LABEL = "Techcombank";
export const BANK_OWNER = "LAM QUANG HIEU";

/**
 * Builds a VietQR image URL that pre-fills amount + transfer note so the buyer
 * only has to scan and confirm. The note (`addInfo`) is the order code the
 * admin uses to match the bank transfer to a pending order.
 */
export function buildVietQrUrl(code: string): string {
  const params = new URLSearchParams({
    amount: String(KHOA0_PRICE),
    addInfo: code,
    accountName: BANK_OWNER,
  });
  return `https://img.vietqr.io/image/${BANK_CODE}-${BANK_ACCOUNT}-compact2.png?${params.toString()}`;
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
