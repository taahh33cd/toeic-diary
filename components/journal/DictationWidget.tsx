import Link from "next/link";
import { getDictationStats } from "@/app/actions/getDictationStats";
import { xpToNextLevel } from "@/lib/xp";

export async function DictationWidget() {
  const stats = await getDictationStats();
  if (!stats) return null;

  const { pct } = xpToNextLevel(stats.totalXp);

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold tracking-tight">🎧 Luyện dictation</h2>
        <Link
          href="/practice"
          className="text-xs font-medium"
          style={{ color: "var(--accent-primary, #C4622D)" }}
        >
          Tiếp tục →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Streak" value={`${stats.currentStreak}🔥`} />
        <Stat label="Hôm nay" value={`${stats.todayLessons}`} suffix="bài" />
        <Stat label="TB tuần" value={`${stats.avgScore}`} suffix="điểm" />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[11px] mb-1" style={{ color: "var(--text-secondary)" }}>
          <span>Level {stats.level}</span>
          <span>{stats.totalXp.toLocaleString()} XP</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, background: "var(--accent-primary, #C4622D)" }}
          />
        </div>
      </div>

      {stats.recentLessons.length > 0 && (
        <ul className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
          {stats.recentLessons.slice(0, 3).map((l) => (
            <li key={l.id} className="flex justify-between">
              <span className="truncate pr-2">{l.title}</span>
              <span className="font-mono shrink-0">{l.score}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {suffix ? `${label} (${suffix})` : label}
      </div>
    </div>
  );
}
