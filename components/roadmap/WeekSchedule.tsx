import Link from "next/link";

import { formatDayLabel } from "@/lib/roadmap/vn-date";

export type ScheduleTask = {
  id?: string;
  catalogId: string;
  title: string;
  href: string;
  estMinutes: number;
  priority: string;
  status?: string;
};

export type ScheduleDay = {
  date: string;
  tasks: ScheduleTask[];
};

/**
 * Lịch một tuần, nhóm theo ngày.
 *
 * Ngày không có việc vẫn hiện, ghi rõ "nghỉ": tuần nhìn đủ bảy ngày thì học viên
 * thấy được nhịp nghỉ là có chủ ý, chứ không tưởng hệ thống quên xếp.
 */
export function WeekSchedule({
  days,
  today,
}: {
  days: ScheduleDay[];
  /** "YYYY-MM-DD" — để tô đậm hôm nay. */
  today?: string;
}) {
  return (
    <ol className="space-y-3">
      {days.map((day) => {
        const isToday = day.date === today;
        const minutes = day.tasks.reduce((s, t) => s + t.estMinutes, 0);
        return (
          <li
            key={day.date}
            className="rounded-xl border p-3 md:p-4"
            style={{
              borderColor: isToday ? "#0f766e" : "var(--border)",
              background: isToday ? "color-mix(in srgb, #0f766e 6%, transparent)" : "transparent",
            }}
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <span className="font-semibold text-[var(--text-primary)]">
                {formatDayLabel(day.date)}
                {isToday && (
                  <span className="ml-2 text-xs font-normal" style={{ color: "#0f766e" }}>
                    hôm nay
                  </span>
                )}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {day.tasks.length ? `${minutes} phút` : "nghỉ"}
              </span>
            </div>

            {day.tasks.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Ngày nghỉ — để dành sức cho hôm sau.
              </p>
            ) : (
              <ul className="space-y-2">
                {day.tasks.map((t) => (
                  <li key={t.id ?? t.catalogId}>
                    <Link
                      href={t.href}
                      className="flex items-baseline gap-2 group"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span
                        aria-hidden
                        className="shrink-0 text-xs mt-0.5"
                        style={{ color: t.priority === "bonus" ? "#a16207" : "#0f766e" }}
                      >
                        {t.status === "done" ? "✓" : t.priority === "bonus" ? "+" : "•"}
                      </span>
                      <span className="flex-1 group-hover:underline">
                        {t.title}
                        {t.priority === "bonus" && (
                          <span className="ml-2 text-xs text-[var(--text-secondary)]">
                            (không bắt buộc)
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
                        {t.estMinutes}′
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
