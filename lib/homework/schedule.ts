/**
 * lib/homework/schedule.ts — tính ngày các buổi học từ lịch tuần.
 *
 * Quy ước BTVN của một buổi: giao vào ngày học buổi đó, hạn nộp là buổi kế tiếp.
 */

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY = 86_400_000;

function addDays(key: string, n: number): string {
  return new Date(new Date(key + "T00:00:00Z").getTime() + n * DAY).toISOString().slice(0, 10);
}
function weekdayOf(key: string): string {
  return WEEKDAYS[new Date(key + "T00:00:00Z").getUTCDay()];
}

/**
 * `count` ngày học đầu tiên kể từ `start` (tính cả `start` nếu đúng thứ),
 * bỏ ngày nghỉ. Không có lịch tuần thì coi như học mỗi tuần một buổi đúng thứ
 * của `start`.
 */
export function sessionDates(start: string, weekdays: string[], skip: string[], count: number): string[] {
  const days = new Set(weekdays.length ? weekdays : [weekdayOf(start)]);
  const skipSet = new Set(skip);
  const out: string[] = [];
  for (let i = 0; out.length < count && i < 800; i++) {
    const d = addDays(start, i);
    if (days.has(weekdayOf(d)) && !skipSet.has(d)) out.push(d);
  }
  return out;
}

/**
 * Ngày giao + hạn nộp cho từng buổi của giáo trình.
 * Buổi `startLesson` rơi vào buổi học đầu tiên từ `startDate`; buổi trước đó
 * (lớp nhận giáo trình giữa chừng) không có ngày → null.
 */
export function lessonDates(opts: {
  lessonCount: number;
  startDate: string;
  startLesson: number;
  weekdays: string[];
  skipDates: string[];
}): ({ date: string; endDate: string | null } | null)[] {
  const first = Math.max(1, opts.startLesson);
  const needed = Math.max(0, opts.lessonCount - first + 2);
  const dates = sessionDates(opts.startDate, opts.weekdays, opts.skipDates, needed);
  return Array.from({ length: opts.lessonCount }, (_, k) => {
    const si = k + 1 - first;
    if (si < 0 || !dates[si]) return null;
    return { date: dates[si], endDate: dates[si + 1] ?? null };
  });
}

/**
 * Dời một BTVN sang lịch của lớp/HV khác khi giao hàng loạt: ngày giao = buổi
 * học đầu tiên từ ngày gốc trở đi (trong vòng 7 ngày), hạn = buổi kế tiếp.
 * Không có lịch thì giữ nguyên ngày.
 */
export function shiftToSchedule(
  date: string,
  endDate: string | undefined,
  weekdays: string[],
): { date: string; endDate?: string } {
  if (weekdays.length === 0) return { date, ...(endDate ? { endDate } : {}) };
  const [d, next] = sessionDates(date, weekdays, [], 2);
  if (!d || d > addDays(date, 6)) return { date, ...(endDate ? { endDate } : {}) };
  return { date: d, ...(next ? { endDate: next } : {}) };
}
