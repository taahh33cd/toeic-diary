/**
 * Nguồn chân lý duy nhất cho lặp lại giãn cách (SRS) của từ vựng.
 *
 * Trước đây 5 nơi tự định nghĩa lịch ôn — trang vocab, badge nav, dashboard và
 * 2 cron — với 3 kiểu lệch: badge dùng bảng interval khác, badge không bỏ từ đã
 * thuộc, và client tính "hôm nay" theo UTC trong khi cron tính theo ICT (nên từ
 * 00:00–07:00 giờ VN client coi hôm nay là hôm qua). Mọi nơi giờ gọi vào đây.
 *
 * Dùng được ở cả client và server: toàn hàm thuần, không import gì.
 */

/** Số ngày giãn cách theo repCount. repCount 0 = đến hạn ngay trong ngày. */
export const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

/** Ôn đúng đủ số lần này thì coi là đã thuộc, thôi đưa vào lịch ôn. */
export const MASTERY_THRESHOLD = 10;

/** Phần của VocabWord mà SRS cần — nhận cả bản ghi RTDB lẫn row Postgres. */
export interface SrsWord {
  repCount?: number;
  /** YYYY-MM-DD. Thiếu = chưa ôn lần nào. */
  lastReview?: string;
}

/**
 * Hôm nay theo giờ VN (UTC+7), dạng YYYY-MM-DD.
 * Suy từ UTC nên cho cùng kết quả dù chạy ở máy học viên hay ở Vercel.
 */
export function todayIct(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function intervalFor(repCount: number): number {
  const i = Math.min(Math.max(repCount, 0), SRS_INTERVALS.length - 1);
  return SRS_INTERVALS[i];
}

export function isMastered(word: SrsWord): boolean {
  return (word.repCount ?? 0) >= MASTERY_THRESHOLD;
}

/** Ngày đến hạn ôn tiếp theo (YYYY-MM-DD). null = chưa ôn lần nào, đến hạn ngay. */
export function nextDue(word: SrsWord): string | null {
  if (!word.lastReview) return null;
  const d = new Date(word.lastReview + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + intervalFor(word.repCount ?? 0));
  return d.toISOString().slice(0, 10);
}

/** Từ có cần ôn hôm nay không. Từ đã thuộc thì không bao giờ đến hạn. */
export function isDue(word: SrsWord, today: string = todayIct()): boolean {
  if (isMastered(word)) return false;
  const due = nextDue(word);
  return due === null || due <= today;
}

export function countDue(words: SrsWord[], today: string = todayIct()): number {
  let n = 0;
  for (const w of words) if (isDue(w, today)) n++;
  return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// Đường GHI — SM-2 rút gọn, chất lượng suy ra từ kết quả chứ không hỏi học viên
// ─────────────────────────────────────────────────────────────────────────────

const EASE_MIN = 1.3;
const EASE_MAX = 2.8;
/** Giãn cách tối đa; tới đây coi như đã thuộc hẳn. */
const INTERVAL_MAX = 60;

/**
 * Ngưỡng "trả lời nhanh" theo nhóm dạng câu hỏi, đơn vị ms.
 *
 * CHƯA HIỆU CHỈNH — ba số này là phỏng đoán khởi điểm. Phải đo lại bằng
 * VocabQuizItem.answerMs thật sau khi có dữ liệu (cách đã làm với ngưỡng
 * subskill Chunking). Đừng tinh chỉnh bằng cảm giác.
 */
export const SPEED_THRESHOLD_MS = {
  /** Chọn đáp án chữ */
  choiceText: 6_000,
  /** Chọn đáp án ảnh — mắt phải quét 4 ảnh nên cho thêm thời gian */
  choiceImage: 8_000,
  /** Gõ từ */
  typing: 15_000,
};

export function speedThresholdFor(quizType: string): number {
  if (quizType.endsWith("-to-typing")) return SPEED_THRESHOLD_MS.typing;
  if (quizType.endsWith("-to-image")) return SPEED_THRESHOLD_MS.choiceImage;
  return SPEED_THRESHOLD_MS.choiceText;
}

/** Trạng thái SRS của một từ — khớp các cột của VocabProgress. */
export interface SrsState {
  repCount: number;
  intervalDays: number;
  ease: number;
  lapses: number;
  seenCount: number;
  wrongCount: number;
  mastered: boolean;
  lastReview: Date | null;
  dueAt: Date | null;
}

export type ReviewOutcome =
  /** Trả lời một câu quiz */
  | { kind: "quiz"; correct: boolean; answerMs?: number; quizType?: string }
  /** Lật thẻ ở chế độ Học rồi tự đánh dấu */
  | { kind: "flip"; known: boolean };

export function emptyState(): SrsState {
  return {
    repCount: 0,
    intervalDays: 0,
    ease: 2.5,
    lapses: 0,
    seenCount: 0,
    wrongCount: 0,
    mastered: false,
    lastReview: null,
    dueAt: null,
  };
}

/** Từ ở Postgres có đến hạn ôn chưa. dueAt null = chưa ôn lần nào → đến hạn. */
export function isDueRow(row: { mastered: boolean; dueAt: Date | null }, now = new Date()): boolean {
  if (row.mastered) return false;
  return row.dueAt === null || row.dueAt <= now;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/** Cộng `days` ngày vào `from`, trả về 00:00 UTC của ngày đó. */
function dueAfter(from: Date, days: number): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Tính trạng thái SRS mới sau một lượt ôn.
 *
 * Quy tắc (plan-flashcards.md §5):
 * - Quiz sai            → giãn cách về 0, ease −0.20, lapses++, wrongCount++
 * - Quiz đúng chậm      → giãn cách × ease × 0.8
 * - Quiz đúng nhanh     → giãn cách × ease, ease +0.05
 * - Lật thẻ "Thuộc"     → giãn cách × ease × 0.5 (nửa trọng số), và CHỈ khi
 *                         thẻ đang đến hạn — lật lại thẻ chưa tới hạn thì
 *                         không được đẩy lịch đi xa thêm
 * - Lật thẻ "Chưa thuộc"→ giãn cách về 0, ease −0.10, KHÔNG tính là trả lời sai
 *
 * Hàm thuần, không đụng DB — để test được và để quiz/review dùng chung.
 */
export function applyReview(
  cur: SrsState,
  outcome: ReviewOutcome,
  now: Date = new Date()
): SrsState {
  const next: SrsState = { ...cur, seenCount: cur.seenCount + 1, lastReview: now };

  const thatBai =
    outcome.kind === "quiz" ? !outcome.correct : !outcome.known;

  if (thatBai) {
    next.intervalDays = 0;
    next.ease = clamp(cur.ease - (outcome.kind === "quiz" ? 0.2 : 0.1), EASE_MIN, EASE_MAX);
    if (cur.mastered || cur.repCount >= MASTERY_THRESHOLD) next.lapses = cur.lapses + 1;
    if (outcome.kind === "quiz") next.wrongCount = cur.wrongCount + 1;
    // repCount giữ nguyên: học viên đã từng ôn đúng bao nhiêu lần thì vẫn vậy,
    // chỉ lịch ôn bị kéo về hôm nay.
    next.dueAt = dueAfter(now, 0);
    next.mastered = false;
    return next;
  }

  // ── Trả lời đúng / tự nhận đã thuộc ──
  if (outcome.kind === "flip" && cur.dueAt !== null && cur.dueAt > now) {
    // Thẻ chưa tới hạn mà học viên lật xem lại: ghi nhận đã xem, không đổi lịch.
    return { ...cur, seenCount: cur.seenCount + 1 };
  }

  let heSo: number;
  if (outcome.kind === "flip") {
    // "Nửa trọng số" = nội suy nửa đường giữa KHÔNG giãn (×1) và giãn đủ (×ease),
    // chứ KHÔNG phải ease × 0.5. Nhân ease cho 0.5 cho hệ số 0.65–1.4, tức có
    // lúc co lịch lại, và round(1 × 1.4) = 1 nên giãn cách kẹt ở 1 ngày vĩnh
    // viễn — học viên chỉ lật thẻ sẽ thấy mọi từ đến hạn lại mỗi ngày.
    heSo = 1 + (cur.ease - 1) * 0.5;
  } else {
    const nguong = speedThresholdFor(outcome.quizType ?? "");
    const nhanh = outcome.answerMs === undefined || outcome.answerMs <= nguong;
    heSo = nhanh ? cur.ease : cur.ease * 0.8;
    if (nhanh) next.ease = clamp(cur.ease + 0.05, EASE_MIN, EASE_MAX);
  }

  next.repCount = cur.repCount + 1;
  next.intervalDays =
    cur.intervalDays === 0
      ? 1 // lần đúng đầu tiên, hoặc đúng lại sau khi sai
      : clamp(
          // Luôn tiến ít nhất 1 ngày: với ease thấp, phép nhân rồi làm tròn có
          // thể ra đúng bằng giãn cách cũ và lịch đứng im.
          Math.max(Math.round(cur.intervalDays * heSo), cur.intervalDays + 1),
          1,
          INTERVAL_MAX
        );
  next.dueAt = dueAfter(now, next.intervalDays);
  next.mastered = next.repCount >= MASTERY_THRESHOLD || next.intervalDays >= INTERVAL_MAX;

  return next;
}
