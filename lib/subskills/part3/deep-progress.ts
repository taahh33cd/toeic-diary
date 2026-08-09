// Tiến độ Nghe sâu, lưu ngay trên máy người học.
//
// Để ở module riêng thay vì cạnh component: trước đây xuất hàm phụ từ chính
// file client-entry đã gây lỗi với Turbopack.

export type DeepProgress = {
  /** Chỉ số bước đang làm, 0-4 */
  step: number;
  /** Tổng số lượt đã bấm nghe */
  plays: number;
  /** Số câu đúng ở bước 1, khi chưa xem transcript */
  quizScore: number | null;
  doneAt: string | null;
};

export const EMPTY_PROGRESS: DeepProgress = { step: 0, plays: 0, quizScore: null, doneAt: null };

export function deepStorageKey(groupId: string): string {
  return `part3-deep:${groupId}`;
}

export function loadDeepProgress(groupId: string): DeepProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(deepStorageKey(groupId));
    return raw ? { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Partial<DeepProgress>) } : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveDeepProgress(groupId: string, progress: DeepProgress): void {
  try {
    window.localStorage.setItem(deepStorageKey(groupId), JSON.stringify(progress));
  } catch {
    // Hết dung lượng hoặc trình duyệt chặn — không chặn việc học
  }
}
