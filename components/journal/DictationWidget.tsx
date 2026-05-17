import Link from "next/link";
import { getDictationStats } from "@/app/actions/getDictationStats";
import { xpToNextLevel } from "@/lib/xp";

const FIRE_DOTS = 8;

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-primary)" }}>
      <div className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div
        className="text-[10px] font-semibold uppercase tracking-wider mt-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

export async function DictationWidget() {
  const stats = await getDictationStats();

  const streak = stats?.currentStreak ?? 0;
  const todayLessons = stats?.todayLessons ?? 0;
  const avgScore = stats?.avgScore ?? 0;
  const level = stats?.level ?? 1;
  const totalXp = stats?.totalXp ?? 0;
  const { pct } = xpToNextLevel(totalXp);

  const fireTitle = "🔥".repeat(Math.min(streak, 3));

  return (
    <div className="space-y-4">
      {/* Row 2: Dictation Progress | Daily Quest */}
      <div className="grid grid-cols-3 gap-4">
        {/* Dictation Progress */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2 className="font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
            Dictation Progress {fireTitle}
          </h2>

          {/* Fire dot strip */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: FIRE_DOTS }).map((_, i) => (
              <span key={i} style={{ opacity: i < streak ? 1 : 0.18, fontSize: "1.1rem" }}>
                🔥
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatBox label="Streak" value={streak} />
            <StatBox label="Today (Lessons)" value={todayLessons} />
            <StatBox label="Weekly Avg" value={avgScore || "—"} />
          </div>

          <Link
            href="/"
            className="block text-center py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[var(--bg-primary)]"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            Continue
          </Link>
        </div>

        {/* Daily Quest */}
        <div
          className="col-span-2 rounded-2xl p-5"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              Daily Quest
            </h2>
            <span className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
              0/100
            </span>
          </div>

          <div
            className="h-3 rounded-full overflow-hidden mb-2"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(pct, 100)}%`, background: "var(--orange)" }}
            />
          </div>

          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Level {level} — {totalXp.toLocaleString()} XP
          </p>
        </div>
      </div>

      {/* Next Step */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span className="text-2xl font-bold shrink-0" style={{ color: "var(--text-muted)" }}>
          →
        </span>
        <div>
          <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
            Next Step
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Start Your Journey: Bắt đầu hành trình. Thử bài đầu tiên ở Part 1 — chỉ 5 phút
          </p>
        </div>
      </div>
    </div>
  );
}
