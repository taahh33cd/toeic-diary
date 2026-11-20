// ── Luyện đọc câu hỏi Part 7 ────────────────────────────────────────────────
// Khung chiến lược: docs/part7-question-strategies.md

/** 10 dạng câu hỏi Part 7 */
export type P7QType =
  | "muc-dich"
  | "chi-tiet"
  | "indicated"
  | "not"
  | "suy-luan"
  | "doi-tuong"
  | "dong-nghia"
  | "y-dinh"
  | "dien-cau"
  | "lien-ket";

export const P7Q_TYPES: Record<P7QType, { name: string; signal: string }> = {
  "muc-dich": { name: "Mục đích / chủ đề", signal: "purpose · mainly about · Why did X write/send" },
  "chi-tiet": { name: "Chi tiết", signal: "Wh- + thông tin cụ thể · asked to · According to" },
  indicated: { name: "Indicated / True", signal: "What is indicated / mentioned / true about X" },
  not: { name: "NOT", signal: "NOT viết hoa · not need to" },
  "suy-luan": { name: "Suy luận", signal: "suggested · implied · concluded · most likely" },
  "doi-tuong": { name: "Đối tượng / danh tính", signal: "For whom · Who most likely is · What kind of business" },
  "dong-nghia": { name: "Từ đồng nghĩa", signal: "closest in meaning" },
  "y-dinh": { name: "Ý định người viết", signal: "At [giờ], what does X mean when he writes \"…\"" },
  "dien-cau": { name: "Điền câu", signal: "positions marked [1], [2], [3], [4]" },
  "lien-ket": { name: "Liên kết văn bản", signal: "bộ 2–3 văn bản · cần tra chéo" },
};

/** Bộ chiến lược chuẩn S1–S7 */
export type StrategyCode = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";

export const STRATEGIES: Record<StrategyCode, string> = {
  S1: "Đọc tiêu đề + 2–3 câu đầu để nắm ý chính",
  S2: "Scan từ khoá nội dung → đọc kỹ 1–2 câu quanh đó",
  S3: "Loại trừ: đối chiếu lần lượt từng phương án A–D với bài",
  S4: "Đọc câu trước và sau câu trích dẫn",
  S5: "Hiểu nghĩa từ trong câu gốc, thay từng phương án vào",
  S6: "Tìm từ móc nối trong câu cho sẵn, khớp vị trí [n]",
  S7: "Lấy thông tin ở văn bản 1, tra tiếp sang văn bản 2/3",
};

/** 3 kiểu lỗi dịch mà bản dịch sai nhắm vào */
export type TransError = "chu-the" | "thi-bi-dong" | "da-nghia";

export const TRANS_ERROR_LABEL: Record<TransError, string> = {
  "chu-the": "Nhầm chủ thể",
  "thi-bi-dong": "Sai thì / bị động",
  "da-nghia": "Hiểu sai từ đa nghĩa",
};

/**
 * Lớp từ khoá:
 *  q = 🟦 từ để hỏi · t = 🟨 từ báo dạng & phạm vi · c = 🟩 từ nội dung để scan
 */
export type KwLayer = "q" | "t" | "c";

export const KW_LAYERS: Record<KwLayer, { label: string; short: string; color: string; bg: string }> = {
  q: { label: "Từ để hỏi", short: "Hỏi", color: "var(--accent-blue)", bg: "rgba(59,130,246,.18)" },
  t: { label: "Dạng & phạm vi", short: "Dạng", color: "var(--accent-yellow)", bg: "rgba(245,158,11,.22)" },
  c: { label: "Nội dung để scan", short: "Nội dung", color: "var(--accent-green)", bg: "rgba(16,185,129,.2)" },
};

export type P7QItem = {
  /** "2026-7-158" = EST 2026 · Test 7 · câu 158 */
  id: string;
  type: P7QType;
  /**
   * Câu hỏi có đánh dấu từ khoá: `[[q:What]] is the [[t:purpose]] of …`.
   * `[[c?:word]]` = không bắt buộc: bỏ trống hoặc tô đúng lớp đều được.
   */
  prompt: string;
  /** Bản dịch đúng */
  vi: string;
  /** Bản dịch sai, mỗi bản mang đúng 1 lỗi */
  wrong: { text: string; error: TransError; why: string }[];
  /** Vì sao chọn những từ khoá này */
  kwNote: string;
  /** Chỉ dùng ở bài tổng hợp: 4 dạng để chọn (gồm dạng đúng) */
  typeOptions?: P7QType[];
  typeWhy?: string;
  strategy: { options: StrategyCode[]; correct: StrategyCode; why: string };
  /** Chỗ căn cứ trong bài. Trong `excerpt`, `==…==` là phần tô sáng. */
  evidence: { doc: string; excerpt: string; note: string };
};

export type P7QLevel = "co-ban" | "nang-cao";

export type P7QLesson = {
  slug: string; // "muc-dich-co-ban"
  title: string;
  /** null = bài tổng hợp (trộn dạng, có bước nhận diện dạng) */
  type: P7QType | null;
  level: P7QLevel;
  description: string;
  items: P7QItem[];
};

// ── Lưu kết quả ──────────────────────────────────────────────────────────────
// Dùng lại bảng subskill_attempts, không cần migration:
//  - 1 dòng / bài:  part = P7Q_PART, questionWord = lesson slug, score = điểm bài
//  - 1 dòng / câu:  part = P7Q_ITEM_PART, questionWord = item id,
//                   score = % bước đúng, passed = đúng hết,
//                   exerciseIndex = bitmask bước đúng (STEP_BIT)

export const P7Q_PART = "p7q";
export const P7Q_ITEM_PART = "p7q-item";
export const P7Q_PASS = 80;

export type StepKey = "dich" | "tu-khoa" | "dang" | "chien-luoc";

export const STEP_BIT: Record<StepKey, number> = { dich: 1, "tu-khoa": 2, dang: 4, "chien-luoc": 8 };

export const STEP_LABEL: Record<StepKey, string> = {
  dich: "Dịch câu hỏi",
  "tu-khoa": "Từ khoá",
  dang: "Nhận diện dạng",
  "chien-luoc": "Chiến lược",
};

export type BestScore = { score: number; passed: boolean };

// ── Từ khoá ──────────────────────────────────────────────────────────────────

export type Token = { text: string; layer: KwLayer | null; optional: boolean };

/** Tách câu hỏi đã đánh dấu thành các từ (token) kèm lớp đáp án. */
export function parsePrompt(marked: string): Token[] {
  const tokens: Token[] = [];
  const re = /\[\[([qtc])(\?)?:(.+?)\]\]|([^\s[]+|\[(?!\[)[^\s]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(marked))) {
    if (m[1]) {
      for (const w of m[3].split(/\s+/)) {
        tokens.push({ text: w, layer: m[1] as KwLayer, optional: !!m[2] });
      }
    } else if (m[4]) {
      tokens.push({ text: m[4], layer: null, optional: false });
    }
  }
  // Dấu câu đứng ngay sau ]] ("[[t:memo]]?") thành token riêng → gộp vào từ trước.
  const out: Token[] = [];
  for (const t of tokens) {
    if (/^[?,.!;:"”']+$/.test(t.text) && out.length) out[out.length - 1].text += t.text;
    else out.push({ ...t });
  }
  return out;
}

/** Câu hỏi dạng chữ thường (bỏ đánh dấu). */
export function plainPrompt(marked: string): string {
  return parsePrompt(marked).map((t) => t.text).join(" ");
}

export type KwResult = {
  /** Đúng hết từ bắt buộc, không tô sai lớp, tô thừa tối đa 1 từ */
  ok: boolean;
  /** Trạng thái từng token để hiển thị */
  marks: ("right" | "wrong" | "missed" | "extra" | null)[];
};

export function gradeKeywords(tokens: Token[], picked: (KwLayer | null)[]): KwResult {
  let missedOrWrong = 0;
  let extra = 0;
  const marks = tokens.map((t, i) => {
    const p = picked[i] ?? null;
    if (t.layer) {
      if (p === t.layer) return "right" as const;
      if (p === null && t.optional) return null;
      if (p === null) { missedOrWrong++; return "missed" as const; }
      missedOrWrong++;
      return "wrong" as const;
    }
    if (p !== null) { extra++; return "extra" as const; }
    return null;
  });
  return { ok: missedOrWrong === 0 && extra <= 1, marks };
}

/** "2026-7-158" → "EST 2026 · Test 7 · Câu 158" */
export function sourceLabel(id: string): string {
  const [y, t, q] = id.split("-");
  return `EST ${y} · Test ${t} · Câu ${q}`;
}
