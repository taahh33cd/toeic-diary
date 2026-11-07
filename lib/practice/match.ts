/**
 * Chuẩn hoá & so khớp từ cho khu dictation (/practice Level 1–3).
 *
 * Vì sao cần: transcript nhập từ docx mang theo dấu nháy cong (’), gạch dài (—)
 * dính liền hai từ, tiền tố người nói ("W1:") và dấu câu đứng riêng. Cách chuẩn
 * hoá cũ — `s.toLowerCase().replace(/[^a-z0-9']/g, "")` — giữ dấu ' thẳng nhưng
 * xoá dấu ’ cong, nên "I’ve" → "ive" còn học viên gõ "I've" → "i've": nhập đúng
 * mà hệ thống báo sai. Tách câu theo khoảng trắng cũng khiến "idea—we" thành
 * MỘT từ, lệch vị trí so với bài học viên gõ nên mọi từ phía sau đều bị báo sai.
 */

// ── Chuẩn hoá ký tự ──────────────────────────────────────────────────────────

/** Đưa dấu nháy/gạch/khoảng trắng lạ về dạng ASCII, tách gạch dài thành ranh giới từ. */
export function preCleanText(text: string): string {
  return text
    // ‘ ’ ‚ ‛ ′ → '
    .replace(/[‘’‚‛′]/g, "'")
    // “ ” „ ″ → "
    .replace(/[“”„″]/g, '"')
    // – — ― … gạch dài/ngang dài luôn là ranh giới từ khi đọc
    .replace(/[–—―]/g, " ")
    // nbsp, figure space, narrow nbsp
    .replace(/[   ]/g, " ")
    // soft hyphen (vô hình, chỉ gây lệch)
    .replace(/­/g, "");
}

/** Tiền tố người nói lẫn trong nội dung câu: "W1:", "M:", "Woman:", "Narrator:". */
const SPEAKER_PREFIX = /^\s*(?:W|M|Woman|Man|Narrator|Speaker)\s*\d?\s*:\s*/i;

/**
 * Ký hiệu đọc thành chữ: $400 → "400 dollars", 25% → "25 percent", R&D → "R and D".
 * Áp cho CẢ câu mẫu và bài học viên gõ để số từ hai bên vẫn khớp vị trí.
 */
export function expandSpokenSymbols(text: string): string {
  return text
    .replace(/\$\s*([\d,]+(?:\.\d+)?)/g, (_m, n: string) => `${n} dollars`)
    .replace(/£\s*([\d,]+(?:\.\d+)?)/g, (_m, n: string) => `${n} pounds`)
    .replace(/€\s*([\d,]+(?:\.\d+)?)/g, (_m, n: string) => `${n} euros`)
    .replace(/([\d,]+(?:\.\d+)?)\s*%/g, (_m, n: string) => `${n} percent`)
    .replace(/&/g, " and ")
    // 2,000 → 2000 (dấu phẩy phân nhóm nghìn, không phải ranh giới câu)
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1");
}

/** Chuẩn hoá một từ về dạng dùng để so khớp. */
export function normalizeToken(w: string): string {
  return preCleanText(w)
    .toLowerCase()
    .replace(/[^a-z0-9']/g, "")
    // dấu nháy bọc ngoài ('yes' → yes) không tính là khác biệt
    .replace(/^'+|'+$/g, "");
}

/**
 * Tách câu mẫu thành danh sách từ dùng để hiển thị và so khớp (Level 3).
 * Bỏ tiền tố người nói, tách gạch dài, loại token chỉ gồm dấu câu.
 */
export function tokenizeSentence(content: string): string[] {
  const cleaned = expandSpokenSymbols(preCleanText(content)).replace(SPEAKER_PREFIX, "");
  return cleaned
    .trim()
    .split(/\s+/)
    .filter((w) => normalizeToken(w) !== "");
}

/**
 * Tách bài học viên gõ thành danh sách từ, cùng quy ước với `tokenizeSentence`.
 * Cũng bỏ tiền tố người nói, để học viên chép cả "W1:" vẫn không bị trừ.
 */
export function tokenizeInput(input: string): string[] {
  return expandSpokenSymbols(preCleanText(input))
    .replace(SPEAKER_PREFIX, "")
    .trim()
    .split(/\s+/)
    .filter((w) => normalizeToken(w) !== "");
}

// ── Số đọc thành chữ ─────────────────────────────────────────────────────────

const NUM_WORD: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

const SCALE: Record<string, number> = {
  hundred: 100, thousand: 1000, million: 1_000_000, billion: 1_000_000_000,
};

const TENS_WORDS = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/**
 * Số ghép bị chuẩn hoá mất dấu gạch: "twenty-five" → "twentyfive" → ["twenty","five"].
 * Trả null nếu không phải dạng ghép hàng chục + hàng đơn vị.
 */
function splitCompoundNumberWord(t: string): string[] | null {
  for (const tens of TENS_WORDS) {
    if (!t.startsWith(tens)) continue;
    const rest = t.slice(tens.length);
    if (rest === "") return [tens];
    if (rest in NUM_WORD && NUM_WORD[rest] < 10) return [tens, rest];
  }
  return null;
}

/**
 * Đọc một chuỗi từ thành số: ["four","hundred"] → 400, ["25"] → 25.
 * Trả null nếu có từ không thuộc hệ số đếm.
 */
export function wordsToNumber(tokens: string[]): number | null {
  let total = 0;
  let current = 0;
  let sawDigits = false;
  let any = false;

  const flat: string[] = [];
  for (const raw of tokens) {
    const t = normalizeToken(raw).replace(/'/g, "");
    if (!t) continue;
    if (t in NUM_WORD || t in SCALE || /^\d+$/.test(t) || t === "and") { flat.push(t); continue; }
    const parts = splitCompoundNumberWord(t);
    if (parts) flat.push(...parts);
    else flat.push(t);
  }

  for (const t of flat) {
    if (!t || t === "and") continue;

    if (/^\d+$/.test(t)) {
      if (any) return null; // "25 30" là hai số, không phải một
      total = Number(t);
      sawDigits = true;
      any = true;
      continue;
    }
    if (sawDigits) return null;

    if (t in SCALE) {
      const s = SCALE[t];
      if (current === 0) current = 1;
      if (s === 100) current *= 100;
      else { total += current * s; current = 0; }
      any = true;
      continue;
    }
    if (t in NUM_WORD) {
      const v = NUM_WORD[t];
      const tail = current % 100;
      if (v >= 20) current += v;
      else if (tail >= 20 && tail < 100 && v < 10) current += v; // twenty five → 25
      else if (current === 0) current = v;
      else return null;
      any = true;
      continue;
    }
    return null;
  }

  if (!any) return null;
  return total + current;
}

/** "3:30" → "330" nếu học viên đọc thành chữ ("three thirty"); null nếu không phải giờ. */
function timeRefDigits(refToken: string): string | null {
  const m = normalizeToken(refToken).match(/^(\d{1,2})(\d{2})$/);
  if (!m) return null;
  const raw = preCleanText(refToken);
  if (!/\d{1,2}\s*:\s*\d{2}/.test(raw)) return null;
  return m[1] + m[2];
}

/** Học viên gõ giờ bằng chữ: ["three","thirty"] → "330". */
function spokenTimeDigits(tokens: string[]): string | null {
  if (tokens.length < 1 || tokens.length > 3) return null;
  const parts: string[] = [];
  for (const t of tokens) {
    const n = wordsToNumber([t]);
    if (n === null) return null;
    parts.push(String(n));
  }
  return parts.join("");
}

// ── So khớp ──────────────────────────────────────────────────────────────────

const MAX_JOIN = 3; // số token học viên tối đa gộp lại để khớp 1 từ mẫu

/**
 * Một từ mẫu khớp với `count` token đầu của `userNorms` hay không.
 * Trả số token đã dùng, hoặc 0 nếu không khớp.
 *
 * Chấp nhận:
 *  - khớp thẳng sau chuẩn hoá;
 *  - học viên tách từ ghép: "cost effective" ↔ "cost-effective";
 *  - số viết chữ hoặc chữ số: "four hundred" ↔ "400", "three thirty" ↔ "3:30".
 */
function consumeRefToken(refToken: string, userNorms: string[], at: number): number {
  const refNorm = normalizeToken(refToken);
  if (refNorm === "") return 0;

  const available = Math.min(MAX_JOIN, userNorms.length - at);
  if (available <= 0) return 0;

  // 1. khớp thẳng, rồi tới gộp token (từ ghép bị học viên tách rời)
  for (let k = 1; k <= available; k++) {
    const joined = userNorms.slice(at, at + k).join("");
    if (joined === refNorm) return k;
  }

  // 2. số: so giá trị thay vì so chữ
  const refNum = wordsToNumber([refToken]);
  if (refNum !== null) {
    for (let k = 1; k <= available; k++) {
      if (wordsToNumber(userNorms.slice(at, at + k)) === refNum) return k;
    }
  }

  // 3. giờ "3:30" đọc thành "three thirty"
  const refTime = timeRefDigits(refToken);
  if (refTime !== null) {
    for (let k = 1; k <= available; k++) {
      if (spokenTimeDigits(userNorms.slice(at, at + k)) === refTime) return k;
    }
  }

  return 0;
}

/**
 * So bài học viên gõ với câu mẫu theo vị trí từ, trả kết quả đúng/sai cho từng
 * từ mẫu. Vẫn là so theo vị trí (không dùng diff) nhưng một từ mẫu có thể ăn
 * nhiều token của học viên khi đó là từ ghép hoặc số đọc thành chữ.
 */
export function matchWords(refTokens: string[], userInput: string): boolean[] {
  const userNorms = tokenizeInput(userInput).map(normalizeToken);
  const out: boolean[] = [];
  let u = 0;
  for (const ref of refTokens) {
    const used = consumeRefToken(ref, userNorms, u);
    if (used > 0) { out.push(true); u += used; }
    else { out.push(false); u += 1; }
  }
  return out;
}

/**
 * So một ô trống / một từ lẻ (Level 1–2 fill-in-blank, ô sửa từ của Level 3).
 * Toàn bộ chữ học viên gõ phải dùng hết cho đúng một từ mẫu.
 */
export function tokenMatches(refToken: string, userText: string): boolean {
  const userNorms = tokenizeInput(userText).map(normalizeToken);
  if (userNorms.length === 0) return false;
  return consumeRefToken(refToken, userNorms, 0) === userNorms.length;
}
