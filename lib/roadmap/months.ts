/**
 * lib/roadmap/months.ts — khung mục tiêu theo tháng, bản rule.
 *
 * Mốc điểm từng tháng do CODE tính, không để AI đặt: con số điểm là thứ học viên
 * sẽ bám vào và so sánh, sai một lần là mất tin cả lộ trình. AI chỉ được viết
 * nhãn và lời mô tả cho mỗi tháng (lib/roadmap/ai.ts).
 */

import { DEFAULT_PLAN_MONTHS } from "./config";
import { addDays, daysBetween, joinVi } from "./vn-date";
import type { MonthGoal, PartNumber, WeaknessReport } from "./types";

const PART_FOCUS_LABEL: Record<PartNumber, string> = {
  1: "Mô tả tranh",
  2: "Hỏi – đáp",
  3: "Hội thoại",
  4: "Bài nói",
  5: "Hoàn thành câu",
  6: "Hoàn thành đoạn văn",
  7: "Đọc hiểu",
};

export type BuildMonthGoalsInput = {
  report: WeaknessReport;
  /** "YYYY-MM-DD" — ngày bắt đầu lộ trình. */
  startDate: string;
  /** "YYYY-MM-DD" — ngày thi dự kiến, nếu có. */
  deadline?: string | null;
};

/**
 * Số tháng của lộ trình.
 *
 * Không có ngày thi → 3 tháng (§15.3). Có ngày thi → đúng số tháng tới hôm đó,
 * nhưng ít nhất 1 và nhiều nhất 6: vẽ sẵn lịch cho 10 tháng sau thì vừa vô ích
 * vừa sai, vì trình độ lúc đó đã khác hẳn.
 */
export function planMonthCount(startDate: string, deadline?: string | null): number {
  if (!deadline) return DEFAULT_PLAN_MONTHS;
  const days = daysBetween(startDate, deadline);
  if (days <= 0) return 1;
  return Math.min(6, Math.max(1, Math.round(days / 30)));
}

export function buildMonthGoals(input: BuildMonthGoalsInput): MonthGoal[] {
  const { report, startDate, deadline } = input;
  const months = planMonthCount(startDate, deadline);

  // Điểm đích của cả lộ trình: mục tiêu học viên đặt, hoặc — nếu chưa đặt —
  // điểm hiện tại cộng mức tăng ước tính. Không bịa ra một con số tròn trịa.
  const finalTarget =
    report.targetScore ??
    Math.min(990, report.total + (report.expectedGain ?? 50 * months));

  const gap = Math.max(finalTarget - report.total, 0);

  const focusOrder = report.parts.map((p) => p.part);

  return Array.from({ length: months }, (_, i) => {
    const monthIndex = i + 1;
    // Chia đều mức tăng theo tháng. Có thể làm đường cong (tháng đầu lên nhanh
    // hơn) nhưng đó là phỏng đoán chưa có số liệu nào đỡ lưng, nên giữ tuyến tính.
    const targetScore = Math.round(report.total + (gap * monthIndex) / months);

    // Tháng 1 chữa 2 part yếu nhất, tháng 2 lấn sang part thứ 3, v.v.
    const focusParts = focusOrder.slice(0, Math.min(2 + i, focusOrder.length));

    return {
      monthIndex,
      label: `Tháng ${monthIndex}`,
      targetScore,
      focus: focusParts.map((p) => `Part ${p} · ${PART_FOCUS_LABEL[p]}`),
      summary: ruleSummary(monthIndex, months, targetScore, focusParts),
      startDate: addDays(startDate, i * 30),
      endDate: addDays(startDate, (i + 1) * 30 - 1),
    };
  });
}

function ruleSummary(
  monthIndex: number,
  months: number,
  targetScore: number,
  focusParts: PartNumber[],
): string {
  const list = joinVi(focusParts.map((p) => `Part ${p}`));
  if (monthIndex === 1) {
    return `Tháng đầu dồn sức vào ${list} — đây là chỗ bạn mất nhiều điểm nhất và cũng là chỗ lên nhanh nhất. Mốc cuối tháng: ${targetScore} điểm.`;
  }
  if (monthIndex === months) {
    return `Tháng cuối luyện theo đúng format đề thi và giữ nhịp ${list}. Mốc: ${targetScore} điểm.`;
  }
  return `Mở rộng sang ${list}, vẫn giữ bài nền của tháng trước. Mốc cuối tháng: ${targetScore} điểm.`;
}
