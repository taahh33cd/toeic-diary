import { getEngagementScores } from "@/app/actions/getEngagementScores";

export async function EngagementWidget() {
  const rows = await getEngagementScores();
  if (rows.length === 0) return null;

  const colorFor = (s: number) => {
    if (s >= 70) return "#16a34a";
    if (s >= 40) return "#ca8a04";
    return "#dc2626";
  };

  return (
    <section className="rounded-xl p-5 bg-[#262a3d] border border-[#3a3f55]">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-semibold text-white">📊 Engagement (7 ngày)</h2>
        <span className="text-xs text-zinc-400">{rows.length} học viên</span>
      </div>
      <ul className="space-y-2">
        {rows.slice(0, 8).map((r) => (
          <li
            key={r.userId}
            className="flex items-center gap-3 text-sm"
            title={`Dictation ${r.breakdown.dictation} • Streak ${r.breakdown.streak} • HW ${r.breakdown.homework} • Vocab ${r.breakdown.vocab}`}
          >
            <span className="w-32 truncate text-zinc-200">
              {r.displayName ?? r.studentCode ?? "—"}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[#1a1d2c] overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${r.score}%`, background: colorFor(r.score) }}
              />
            </div>
            <span className="w-8 text-right font-mono text-xs" style={{ color: colorFor(r.score) }}>
              {r.score}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
