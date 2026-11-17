// Mốc thời gian cho phần Shadow.
// `wordTimings` (giai đoạn 2) có một phần tử cho mỗi từ của `splitDisplayWords(content)`.
// Câu chưa có thì KHÔNG ước lượng theo âm tiết (đo được chỉ 12% từ lệch < 100ms):
// giao diện chỉ làm nổi cả câu.

export interface WordTiming {
  start: number;
  end: number;
}

/**
 * Đọc cột `sentences.word_timings` (JSONB `[[start, end], ...]`).
 * Dữ liệu sai dạng thì trả null để giao diện quay về làm nổi cả câu.
 */
export function parseWordTimings(raw: unknown): WordTiming[] | null {
  if (!Array.isArray(raw)) return null;
  const out: WordTiming[] = [];
  for (const p of raw) {
    if (!Array.isArray(p) || p.length !== 2 || typeof p[0] !== "number" || typeof p[1] !== "number") return null;
    out.push({ start: p[0], end: p[1] });
  }
  return out;
}

/** Chỉ số từ đang được đọc tại thời điểm `t` (giây), -1 nếu đang ở khoảng lặng ngoài câu. */
export function activeWordIndex(timings: WordTiming[], t: number): number {
  for (let i = 0; i < timings.length; i++) {
    const w = timings[i];
    // Giữ highlight qua khoảng nghỉ ngắn giữa hai từ để không nhấp nháy.
    const until = i + 1 < timings.length ? Math.max(w.end, timings[i + 1].start) : w.end;
    if (t >= w.start && t < until) return i;
  }
  return -1;
}

/** Dùng được khi số mốc khớp số từ và mốc tăng dần. */
export function usableTimings(timings: WordTiming[] | null | undefined, wordCount: number): WordTiming[] | null {
  if (!timings || timings.length !== wordCount) return null;
  for (let i = 0; i < timings.length; i++) {
    const w = timings[i];
    if (!(w.end >= w.start) || (i > 0 && w.start < timings[i - 1].start)) return null;
  }
  return timings;
}

/** Độ dài tham chiếu của câu để kiểm tra bản ghi: theo mốc từ nếu có, không thì theo khoảng phát. */
export function referenceSeconds(window: { start: number; end: number }, timings: WordTiming[] | null): number {
  if (timings && timings.length) return Math.max(0.3, timings[timings.length - 1].end - timings[0].start);
  const len = Number.isFinite(window.end) ? window.end - window.start : 0;
  // Khoảng phát có đệm trước/sau (~0.7s) — trừ đi để không đòi học viên nói dài hơn câu gốc.
  return Math.max(0.3, len - 0.7);
}
