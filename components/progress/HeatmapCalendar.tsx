"use client";

interface Props {
  // Map of "YYYY-MM-DD" → number of lessons completed that day
  activityMap: Record<string, number>;
}

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

function getIntensity(count: number): string {
  if (count === 0) return "bg-[var(--bg-tertiary)]";
  if (count <= 2)  return "bg-emerald-500/30";
  if (count <= 5)  return "bg-emerald-500/55";
  if (count <= 9)  return "bg-emerald-500/80";
  return "bg-emerald-500";
}

export function HeatmapCalendar({ activityMap }: Props) {
  // Build last 26 weeks (182 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Sunday of the current week
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() - 26 * 7 + 7);

  const weeks: { date: Date; key: string }[][] = [];
  const cursor = new Date(startDate);

  while (cursor <= today) {
    const week: { date: Date; key: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor);
      const key = date.toISOString().split("T")[0];
      week.push({ date, key });
      cursor.setDate(cursor.getDate() + 1);
      if (cursor > today) break;
    }
    weeks.push(week);
    if (cursor > today) break;
  }

  // Month labels
  const monthLabels: { label: string; col: number }[] = [];
  weeks.forEach((week, i) => {
    const firstDay = week[0].date;
    if (firstDay.getDate() <= 7 || i === 0) {
      const last = monthLabels[monthLabels.length - 1];
      if (!last || last.label !== MONTHS[firstDay.getMonth()]) {
        monthLabels.push({ label: MONTHS[firstDay.getMonth()], col: i });
      }
    }
  });

  const totalDays = Object.values(activityMap).reduce((s, n) => s + n, 0);
  const activeDays = Object.values(activityMap).filter((n) => n > 0).length;

  return (
    <div>
      <div className="flex items-end gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 flex-shrink-0">
          <div className="h-4" /> {/* month label spacer */}
          {DAYS.map((d) => (
            <div key={d} className="h-[11px] text-[9px] text-[var(--text-muted)] leading-none flex items-center">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => {
            const monthLabel = monthLabels.find((m) => m.col === wi);
            return (
              <div key={wi} className="flex flex-col gap-[3px]">
                <div className="h-4 text-[9px] text-[var(--text-muted)] whitespace-nowrap">
                  {monthLabel?.label ?? ""}
                </div>
                {week.map(({ date, key }) => {
                  const count = activityMap[key] ?? 0;
                  const isFuture = date > today;
                  return (
                    <div
                      key={key}
                      title={`${key}: ${count} bài`}
                      className={`w-[11px] h-[11px] rounded-sm transition-colors ${
                        isFuture ? "opacity-0" : getIntensity(count)
                      }`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)]">
        <span>{activeDays} ngày hoạt động · {totalDays} bài hoàn thành</span>
        <div className="flex items-center gap-1">
          <span>Ít</span>
          {["bg-[var(--bg-tertiary)]","bg-emerald-500/30","bg-emerald-500/55","bg-emerald-500/80","bg-emerald-500"].map((c, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>
    </div>
  );
}
