import type { MonthGoal } from "@/lib/roadmap/types";

/**
 * Dải mục tiêu theo tháng.
 *
 * Mốc điểm ở đây do code tính (lib/roadmap/months.ts), AI chỉ viết lại phần chữ.
 * Vì vậy nó được phép hiện như một con số chắc chắn — nhưng nhãn luôn là "mốc",
 * không phải "bạn sẽ đạt".
 */
export function MonthStrip({
  months,
  currentMonthIndex = 1,
}: {
  months: MonthGoal[];
  currentMonthIndex?: number;
}) {
  if (months.length === 0) return null;

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((m) => {
        const current = m.monthIndex === currentMonthIndex;
        return (
          <li
            key={m.monthIndex}
            className="rounded-xl border p-4"
            style={{
              borderColor: current ? "#0f766e" : "var(--border)",
              background: current
                ? "color-mix(in srgb, #0f766e 6%, transparent)"
                : "var(--bg-elevated)",
            }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="font-semibold text-[var(--text-primary)]">{m.label}</h3>
              <span className="text-sm tabular-nums" style={{ color: "#0f766e" }}>
                mốc {m.targetScore}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{m.summary}</p>
            {m.focus.length > 0 && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Tập trung: {m.focus.join(" · ")}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
