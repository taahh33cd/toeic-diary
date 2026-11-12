/**
 * lib/roadmap/vn-date.ts — mọi phép tính ngày của khu Lộ trình đi qua đây.
 *
 * Lý do có file này: Vercel chạy ở UTC. `new Date().toISOString().slice(0,10)`
 * trên máy chủ sẽ trả về ngày HÔM QUA trong suốt 7 tiếng đầu mỗi ngày giờ VN
 * (00:00–06:59). Lệch một ngày là lệch cả lịch: việc hôm nay bị đánh dấu "lỡ",
 * cron dồn nhầm, tuần bắt đầu sai thứ Hai. Cấm dùng toISOString() trực tiếp ở
 * bất cứ đâu trong lib/roadmap.
 *
 * Quy ước: "ngày" luôn là chuỗi "YYYY-MM-DD" theo giờ Asia/Ho_Chi_Minh (UTC+7,
 * không có giờ mùa hè nên cộng thẳng 7 tiếng là đúng, không cần Intl).
 */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" của một mốc thời gian, theo giờ VN. */
export function vnDateKey(at: Date = new Date()): string {
  return new Date(at.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Hôm nay theo giờ VN. */
export function vnToday(): string {
  return vnDateKey();
}

/** 0 = Chủ nhật … 6 = Thứ Bảy, của một ngày "YYYY-MM-DD". */
export function weekdayOf(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

/** Cộng/trừ ngày, trả về "YYYY-MM-DD". */
export function addDays(dateKey: string, days: number): string {
  const t = Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/** Số ngày từ `from` đến `to` (âm nếu `to` trước `from`). */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

/** Thứ Hai của tuần chứa `dateKey`. Tuần của lộ trình luôn bắt đầu thứ Hai. */
export function mondayOf(dateKey: string): string {
  const wd = weekdayOf(dateKey);
  // Chủ nhật (0) thuộc về tuần vừa kết thúc → lùi 6 ngày, không phải lùi 0.
  const back = wd === 0 ? 6 : wd - 1;
  return addDays(dateKey, -back);
}

/** Bảy ngày của tuần bắt đầu từ `monday`. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Đổi Date (từ DB) sang ngày VN; null giữ nguyên null. */
export function toVnDateKey(d: Date | null | undefined): string | null {
  return d ? vnDateKey(d) : null;
}

const WEEKDAY_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** "T4 12/11" — nhãn ngắn để in trong dry-run và hiện trên UI. */
export function formatDayLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${WEEKDAY_VI[weekdayOf(dateKey)]} ${d}/${m}`;
}

/**
 * Nối danh sách theo lối tiếng Việt: "a, b và c".
 *
 * Nối bằng " và " cho mọi phần tử thì ra "Part 6 và Part 5 và Part 1" — đọc
 * như máy. Để ở đây vì đây là file tiện ích chung của khu Lộ trình.
 */
export function joinVi(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} và ${items[items.length - 1]}`;
}
