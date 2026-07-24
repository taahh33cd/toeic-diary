import type { ExamType, Goal, SwScore, ToeicScore } from "@/lib/firebase/types";

/** Điểm tối đa của từng kỳ thi. */
export const EXAM_MAX: Record<ExamType, number> = { lr: 990, sw: 400 };

export const EXAM_LABEL: Record<ExamType, string> = {
  lr: "TOEIC L&R",
  sw: "TOEIC S&W",
};

/** Kỳ thi học viên đang chọn. Goal cũ (chưa có examType) mặc định là L&R. */
export function goalExamType(goal: Goal | null | undefined): ExamType {
  return goal?.examType === "sw" ? "sw" : "lr";
}

/** Mục tiêu tổng của kỳ thi đang chọn — null nếu HV chưa đặt cho kỳ đó. */
export function goalTotal(goal: Goal | null | undefined): number | null {
  if (!goal) return null;
  if (goalExamType(goal) === "sw") {
    const { swTargetS, swTargetW } = goal;
    if (swTargetS === undefined && swTargetW === undefined) return null;
    return (swTargetS ?? 0) + (swTargetW ?? 0);
  }
  return goal.target ?? null;
}

/** Hạn của kỳ thi đang chọn. */
export function goalDeadline(goal: Goal | null | undefined): string | undefined {
  if (!goal) return undefined;
  return goalExamType(goal) === "sw" ? goal.swDeadline : goal.deadline;
}

/** Lịch sử điểm của kỳ thi đang chọn, quy về dạng chung {score, date}. */
export function examScores(
  examType: ExamType,
  scores: ToeicScore[] | undefined,
  swScores: SwScore[] | undefined
): { score: number; date: string }[] {
  if (examType === "sw") {
    return (swScores ?? []).map((s) => ({ score: s.total, date: s.date }));
  }
  return (scores ?? []).map((s) => ({ score: s.score, date: s.date }));
}
