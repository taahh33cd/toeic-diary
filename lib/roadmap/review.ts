/**
 * lib/roadmap/review.ts — nhìn lại một tuần rồi quyết định tuần sau nặng nhẹ ra sao.
 *
 * Thuần code, không chạm DB, không gọi AI: đây là chỗ quyết định học viên tuần
 * sau học gì, nên phải kiểm chứng được bằng script và phải cho cùng kết quả với
 * cùng đầu vào. AI chỉ được viết lời cho quyết định đã có.
 *
 * Bảng điều chỉnh (plan-roadmap-ai.md §11):
 *
 *   hoàn thành ≥85% · đúng ≥80%  → lên bậc, giữ thời lượng
 *   hoàn thành ≥85% · đúng <65%  → giữ bậc, thêm bài nền cùng chủ đề
 *   hoàn thành 50–85%            → giữ nguyên
 *   hoàn thành <50%              → còn 2/3 thời lượng, chỉ giữ part ưu tiên #1
 */

export type ReviewTaskLike = {
  status: string;
  estMinutes: number;
  priority: string;
  /** `{ score }` do lib/roadmap/evidence.ts ghi khi việc được tích xong. */
  evidence: unknown;
};

export type WeekReview = {
  totalTasks: number;
  doneTasks: number;
  skippedTasks: number;
  missedTasks: number;
  /** Phút ước tính của các việc đã làm xong. */
  minutes: number;
  /** 0..1 — tính trên việc `core`, bỏ qua việc không bắt buộc. */
  completionRate: number;
  /** 0..1 — trung bình điểm của các việc đã xong; null nếu không việc nào có điểm. */
  accuracy: number | null;
  note: string;
};

export function buildReview(tasks: ReviewTaskLike[]): WeekReview {
  const core = tasks.filter((t) => t.priority === "core");
  const done = tasks.filter((t) => t.status === "done");
  const skipped = tasks.filter((t) => t.status === "skipped");
  const missed = tasks.filter((t) => t.status === "missed" || t.status === "pending");

  const coreDone = core.filter((t) => t.status === "done").length;

  // Mẫu số là việc `core`: tuần nào cũng có một việc bonus, tính nó vào thì học
  // viên làm hết phần bắt buộc vẫn không bao giờ chạm 100%.
  const completionRate = core.length ? coreDone / core.length : 0;

  const scores = done
    .map((t) => (t.evidence as { score?: number } | null)?.score)
    .filter((s): s is number => typeof s === "number");
  const accuracy = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length / 100
    : null;

  return {
    totalTasks: tasks.length,
    doneTasks: done.length,
    skippedTasks: skipped.length,
    missedTasks: missed.length,
    minutes: done.reduce((s, t) => s + t.estMinutes, 0),
    completionRate,
    accuracy,
    note: noteFor(completionRate, accuracy),
  };
}

export type AdjustmentKind = "level_up" | "reinforce" | "keep" | "lighten";

export type Adjustment = {
  kind: AdjustmentKind;
  /** Nhân vào `minutesPerDay` của tuần sau. */
  minutesFactor: number;
  /**
   * Cộng vào mốc điểm khi lọc catalog, để mở ra bài khó hơn. Không đổi mốc điểm
   * của lộ trình — chỉ đổi độ khó bài tập.
   */
  bandBoost: number;
  /** Số part được chữa trong tuần sau. Đuối thì rút về đúng một part. */
  focusLimit: 1 | 2;
  /** Ưu tiên bài nền (grammar-core, listening-decode…) hơn bài khó. */
  preferFoundation: boolean;
  /** Câu giải thích cho học viên đọc. */
  reason: string;
};

export function decideAdjustment(review: WeekReview): Adjustment {
  const { completionRate, accuracy } = review;

  if (completionRate < 0.5) {
    return {
      kind: "lighten",
      minutesFactor: 2 / 3,
      bandBoost: 0,
      focusLimit: 1,
      preferFoundation: true,
      reason:
        "Tuần vừa rồi bạn làm được dưới một nửa, nên tuần này nhẹ đi và chỉ tập trung vào một phần.",
    };
  }

  if (completionRate >= 0.85 && accuracy !== null && accuracy >= 0.8) {
    return {
      kind: "level_up",
      minutesFactor: 1,
      bandBoost: 60,
      focusLimit: 2,
      preferFoundation: false,
      reason:
        "Tuần vừa rồi bạn làm gần hết và làm đúng nhiều, nên tuần này bài sẽ khó hơn một bậc.",
    };
  }

  if (completionRate >= 0.85 && accuracy !== null && accuracy < 0.65) {
    return {
      kind: "reinforce",
      minutesFactor: 1,
      bandBoost: 0,
      focusLimit: 2,
      preferFoundation: true,
      reason:
        "Bạn làm hết bài nhưng tỉ lệ đúng còn thấp, nên tuần này giữ nguyên độ khó và thêm bài nền cùng chủ đề.",
    };
  }

  return {
    kind: "keep",
    minutesFactor: 1,
    bandBoost: 0,
    focusLimit: 2,
    preferFoundation: false,
    reason: "Bạn đang giữ được nhịp, tuần này đi tiếp với cùng khối lượng.",
  };
}

function noteFor(completionRate: number, accuracy: number | null): string {
  const pct = Math.round(completionRate * 100);
  const acc = accuracy === null ? null : Math.round(accuracy * 100);
  if (acc === null) return `Hoàn thành ${pct}% số việc.`;
  return `Hoàn thành ${pct}% số việc, tỉ lệ đúng trung bình ${acc}%.`;
}
