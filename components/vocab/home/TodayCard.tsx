"use client";

/** Mục tiêu mỗi ngày tính theo số từ đã ôn. */
export const DAILY_GOAL = 20;

/**
 * Một khối, một việc chính: ôn từ đến hạn hôm nay (gộp mọi bộ).
 * Hết từ đến hạn thì gợi ý học trước các từ sắp đến hạn.
 */
export default function TodayCard({
  dueCount,
  reviewedToday,
  upcomingCount,
  onStart,
}: {
  dueCount: number;
  reviewedToday: number;
  upcomingCount: number;
  onStart: (scope: "due" | "upcoming") => void;
}) {
  const done = Math.min(reviewedToday, DAILY_GOAL);
  const C = 2 * Math.PI * 26;
  const phut = Math.max(1, Math.ceil((Math.min(dueCount, 20) * 25) / 60));
  const hetHan = dueCount === 0;

  return (
    <section
      className="rounded-2xl px-4 py-4 sm:px-6 flex items-center gap-4 flex-wrap"
      style={{ background: "#3A2A1F", color: "#FBF4EA" }}
      aria-label="Ôn hôm nay"
    >
      <div className="relative shrink-0" style={{ width: 60, height: 60 }}>
        <svg width="60" height="60" viewBox="0 0 64 64" role="img" aria-label={`Đã ôn ${reviewedToday} trên mục tiêu ${DAILY_GOAL} từ hôm nay`}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="#5B4636" strokeWidth="7" />
          <circle
            cx="32" cy="32" r="26" fill="none" stroke="#F0A36B" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${(done / DAILY_GOAL) * C} ${C}`} transform="rotate(-90 32 32)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {reviewedToday}/{DAILY_GOAL}
        </span>
      </div>

      <div className="flex-1" style={{ minWidth: 200 }}>
        <p className="text-lg font-bold">
          {hetHan ? "Đã ôn hết từ đến hạn" : `${dueCount} từ đến hạn hôm nay`}
        </p>
        <p className="text-sm" style={{ color: "#E2D2BE" }}>
          {hetHan
            ? upcomingCount > 0
              ? `Có thể học trước ${upcomingCount} từ sắp đến hạn.`
              : "Tra và lưu thêm từ mới ở ô phía trên."
            : `Khoảng ${phut} phút · gộp từ mọi bộ${dueCount > 20 ? " · 20 từ mỗi lượt" : ""}`}
        </p>
      </div>

      {(!hetHan || upcomingCount > 0) && (
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onStart(hetHan ? "upcoming" : "due")}
            className="rounded-xl px-8 font-bold flex-1 sm:flex-none"
            style={{ minHeight: 48, background: "#F0A36B", color: "#2B2118" }}
          >
            {hetHan ? "Học trước" : "Bắt đầu ôn"}
          </button>
        </div>
      )}
    </section>
  );
}
