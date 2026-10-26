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
