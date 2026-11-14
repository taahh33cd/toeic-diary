/**
 * Phép tính dùng chung cho trang Kết quả (học viên) và bảng Kết quả HV (admin).
 * File thuần — không "use client", không import server — để cả hai phía gọi được.
 */

/** Nhãn chế độ thi thử (config.mode === "real") của một lượt làm bài. */
export const REAL_MODE_LABEL = "Thi thử";

/** Số câu mỗi part trong một đề TOEIC L&R. */
export const PART_SIZE: Record<number, number> = { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 };

/**
 * Điểm ước tính = trung bình tối đa 3 bài thi thử gần nhất, làm tròn bội 5
 * như thang TOEIC. `totalsNewestFirst` chỉ gồm bài thi thử trọn đề có điểm 990,
 * chế độ thi thử (bài chế độ luyện tập có thể đã xem đáp án nên không tính).
 */
export function estimateFromTotals(totalsNewestFirst: number[]): { value: number; n: number } | null {
  const recent = totalsNewestFirst.slice(0, 3);
  if (recent.length === 0) return null;
  const avg = recent.reduce((s, x) => s + x, 0) / recent.length;
  return { value: Math.round(avg / 5) * 5, n: recent.length };
}

/** Lượt nộp khi mới làm chưa được nửa đề không nói gì về trình độ — bỏ khỏi tỷ lệ. */
export function answeredEnough(answered: number, gradable: number | null): boolean {
  return !!gradable && answered >= gradable * 0.5;
}

export interface PartTally { part: number; correct: number; gradable: number }

/**
 * Part yếu nhất từ tổng câu đúng/câu chấm theo part. Chỉ xét part đã làm được
 * ít nhất một part trọn vẹn (vd P1 ≥ 6 câu, P7 ≥ 54 câu) để một lượt lẻ không
 * quyết định kết luận.
 */
export function weakestPart(tallies: Iterable<PartTally>): { part: number; pct: number; gradable: number } | null {
  let best: { part: number; pct: number; gradable: number } | null = null;
  for (const t of tallies) {
    if (t.gradable < (PART_SIZE[t.part] ?? Infinity)) continue;
    const pct = Math.round((t.correct / t.gradable) * 100);
    if (!best || pct < best.pct || (pct === best.pct && t.gradable > best.gradable)) {
      best = { part: t.part, pct, gradable: t.gradable };
    }
  }
  return best;
}

/** "L · P3" / "R · P7" */
export function partShortLabel(part: number): string {
  return `${part <= 4 ? "L" : "R"} · P${part}`;
}
