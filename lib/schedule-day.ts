/**
 * `ClassSession.day` được lưu ở nhiều định dạng tuỳ form nào ghi:
 * - "0".."6"                      (dữ liệu cũ)
 * - "Monday".."Sunday"            (form sửa lớp / sửa HV)
 * - "Thứ 2".."Thứ 7", "CN"        (modal tạo lớp)
 * Helper này quy về số 0 (CN) – 6 (T7), trả null nếu không nhận dạng được.
 */
const DAY_ALIASES: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
  CN: 0, "Thứ 2": 1, "Thứ 3": 2, "Thứ 4": 3, "Thứ 5": 4, "Thứ 6": 5, "Thứ 7": 6,
};

export function dayToNum(day: string | undefined | null): number | null {
  if (day == null) return null;
  const key = String(day).trim();
  if (key in DAY_ALIASES) return DAY_ALIASES[key];
  const n = parseInt(key, 10);
  return !isNaN(n) && n >= 0 && n <= 6 ? n : null;
}
