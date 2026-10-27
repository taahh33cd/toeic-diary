// Subskill Đặt câu nhanh — chữa nghẽn "có từ nhưng không bật ra câu".
//
// Học viên nhớ nghĩa của từ nhưng khi phải nói/viết thì mất vài giây mới dựng
// được câu, nên trong phòng thi là mất lượt. Vì vậy mọi cấp ở đây đều chạy có
// đồng hồ: không chỉ hỏi "có đúng không" mà còn "có ra kịp không".

export type Branch = "viet" | "noi";
export type LevelSlug = "l1" | "l2" | "l3" | "l4" | "l5";

/** Dạng bài — quyết định trình chạy nào được dùng cho cấp đó. */
export type DrillKind =
  | "frame"           // Viết L1: điền dạng đúng của từ vào khuôn câu
  | "pick"            // Viết L2: 3 câu dùng cùng một từ, chọn câu đúng
  | "order"           // Viết L3: ghép mảnh thành câu, có đồng hồ
  | "write-one"       // Viết L4: tự viết 1 câu với 1 từ cho sẵn
  | "write-combo"     // Viết L5: tự viết với 2–3 từ cho sẵn
  | "speak-frame"     // Nói  L1: nói trọn câu từ khuôn, STT so khớp
  | "speak-word"      // Nói  L2: thấy 1 từ, bật ngay 1 câu
  | "speak-situation" // Nói  L3: 1 từ + tình huống
  | "speak-two"       // Nói  L4: nhồi 2 từ vào 1 câu
  | "speak-chain";    // Nói  L5: 3 từ, nói liền 2–3 câu

// ── Ngữ liệu một bộ chủ đề ───────────────────────────────────────────────────

export type SentenceEntry = {
  /** Từ cho sẵn, dạng nguyên mẫu — cũng là khoá hiển thị */
  en: string;
  /** v, n, adj, adv, phrase, phrasal */
  pos: string;
  vi: string;
  /** Khuôn câu, "___" là chỗ phải điền dạng đúng của từ */
  frame: string;
  /** Các dạng chấp nhận cho chỗ trống (so khớp sau khi lowercase) */
  frameAnswers: string[];
  /** Câu mẫu hoàn chỉnh = khuôn đã điền đúng */
  model: string;
  /** Mảnh của câu mẫu theo ĐÚNG thứ tự — client tự xáo trộn */
  chunks: string[];
  /** 2 câu dùng sai từ này, kèm lý do sai. Đây là lỗi học viên hay mắc thật. */
  wrong: [{ text: string; why: string }, { text: string; why: string }];
  /** Vì sao câu mẫu đúng — hiện sau khi trả lời */
  why: string;
  /** Tình huống để tự đặt câu ở các cấp cao */
  situation: string;
  /** Collocation đi kèm, hiện ở phần gợi ý khi hết thời gian */
  collocations: string[];
};

/** Bài ép dùng nhiều từ một lượt (cấp cuối của cả hai nhánh) */
export type SentenceCombo = {
  words: string[];
  situation: string;
  model: string;
};

export type SentenceTopic = {
  slug: string;
  name: string;
  emoji: string;
  blurb: string;
  entries: SentenceEntry[];
  combos: SentenceCombo[];
};

// ── Cấu hình cấp ─────────────────────────────────────────────────────────────

export type SprintLevel = {
  branch: Branch;
  slug: LevelSlug;
  name: string;
  goal: string;
  instruction: string;
  kind: DrillKind;
  passThreshold: number;
  /** Số câu trong một lượt làm */
  count: number;
  /** Giây được phép trả lời mỗi câu. Hết giờ là nộp nguyên trạng. */
  seconds: number;
  /** Chỉ nhánh Nói: giây nghĩ trước khi được bấm ghi âm */
  thinkSeconds?: number;
};

// ── Đề đã dựng cho trình chạy ────────────────────────────────────────────────

export type FrameItem = {
  id: string;
  word: string;
  pos: string;
  vi: string;
  frame: string;
  answers: string[];
  model: string;
  why: string;
};

export type PickItem = {
  id: string;
  word: string;
  vi: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
  notes: [string, string, string];
};

export type OrderItem = {
  id: string;
  word: string;
  vi: string;
  /** Mảnh theo đúng thứ tự */
  chunks: string[];
  model: string;
  situation: string;
};

export type ComposeItem = {
  id: string;
  /** 1 từ ở cấp thấp, 2–3 từ ở cấp cuối */
  words: string[];
  /** Nghĩa Việt song song với words */
  vi: string[];
  /** Rỗng ở cấp "thấy từ là bật câu" */
  situation: string;
  model: string;
  collocations: string[];
  /** Số câu tối thiểu học viên phải tạo (cấp cuối nhánh Nói: 2) */
  minSentences: number;
};

// ── Chấm bằng AI ─────────────────────────────────────────────────────────────

export type SentenceAssess = {
  /** 0–100 = tổng 4 tiêu chí */
  score: number;
  criteria: {
    usage: number;   // dùng đúng từ, đúng nghĩa — 0–25
    grammar: number; // đúng dạng từ và ngữ pháp câu — 0–25
    fit: number;     // khớp tình huống — 0–25
    natural: number; // người bản ngữ nói vậy — 0–25
  };
  /** Những từ cho sẵn thực sự đã dùng được */
  usedWords: string[];
  /** Câu của học viên đã sửa lại cho đúng, giữ tối đa cách diễn đạt của họ */
  corrected: string;
  feedback: string;
};

// ── Lưu điểm ─────────────────────────────────────────────────────────────────

/** Khoá `part` trong bảng subskill_attempts */
export function attemptPart(topicSlug: string, branch: Branch): string {
  return `ss-${topicSlug}-${branch}`;
}

export type BestScore = { score: number; passed: boolean };
