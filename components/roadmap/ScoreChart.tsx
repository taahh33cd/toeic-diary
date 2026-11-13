import type { MonthGoal } from "@/lib/roadmap/types";

export type ScorePoint = {
  /** "YYYY-MM-DD" */
  date: string;
  score: number;
  label: string;
};

/**
 * Đường điểm dự kiến (mốc từng tháng) đặt cạnh điểm thi thử thật.
 *
 * Vẽ bằng SVG thuần, không thêm thư viện biểu đồ: hai đường, vài điểm chấm —
 * kéo thêm một gói chỉ để làm việc này thì nặng hơn chính nó.
 *
 * Chỉ hiện khi đã có ÍT NHẤT một lần thi thử sau bài đầu vào. Một đường dự kiến
 * đứng một mình thì chẳng nói lên gì, mà lại trông như một lời hứa.
 */
export function ScoreChart({
  months,
  actual,
  startScore,
  startDate,
  targetScore,
}: {
  months: MonthGoal[];
  actual: ScorePoint[];
  startScore: number;
  startDate: string;
  targetScore: number | null;
}) {
  if (months.length === 0 || actual.length < 2) return null;

  const planned: ScorePoint[] = [
    { date: startDate, score: startScore, label: "Đầu vào" },
    ...months.map((m) => ({
      date: m.endDate,
      score: m.targetScore,
      label: m.label,
    })),
  ];

  const all = [...planned, ...actual];
  const xs = all.map((p) => Date.parse(`${p.date}T00:00:00Z`));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const scores = all.map((p) => p.score);
  const minY = Math.max(0, Math.min(...scores) - 50);
  const maxY = Math.min(990, Math.max(...scores, targetScore ?? 0) + 50);

  const W = 640;
  const H = 220;
  const PAD = { left: 44, right: 16, top: 16, bottom: 28 };

  const x = (d: string) => {
    const t = Date.parse(`${d}T00:00:00Z`);
    const span = maxX - minX || 1;
    return PAD.left + ((t - minX) / span) * (W - PAD.left - PAD.right);
  };
  const y = (s: number) => {
    const span = maxY - minY || 1;
    return PAD.top + (1 - (s - minY) / span) * (H - PAD.top - PAD.bottom);
  };

  const path = (pts: ScorePoint[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date)},${y(p.score)}`).join(" ");

  const gridValues = [minY, Math.round((minY + maxY) / 2), maxY];

  const latest = actual[actual.length - 1];
  const plannedNow = nearestPlanned(planned, latest.date);
  const diff = plannedNow === null ? null : latest.score - plannedNow;

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Biểu đồ điểm: dự kiến so với thực tế. Lần gần nhất ${latest.score} điểm.`}
      >
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              strokeOpacity={0.12}
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              fillOpacity={0.55}
            >
              {v}
            </text>
          </g>
        ))}

        {/* Dự kiến: nét đứt, vì nó là kế hoạch chứ không phải chuyện đã xảy ra */}
        <path d={path(planned)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" />
        {planned.map((p) => (
          <circle key={`p-${p.date}`} cx={x(p.date)} cy={y(p.score)} r={3} fill="#94a3b8" />
        ))}

        {/* Thực tế: nét liền */}
        <path d={path(actual)} fill="none" stroke="#0f766e" strokeWidth={2.5} />
        {actual.map((p) => (
          <g key={`a-${p.date}`}>
            <circle cx={x(p.date)} cy={y(p.score)} r={4} fill="#0f766e" />
            <text
              x={x(p.date)}
              y={y(p.score) - 9}
              textAnchor="middle"
              fontSize="11"
              fill="#0f766e"
            >
              {p.score}
            </text>
          </g>
        ))}
      </svg>

      <figcaption className="text-sm text-[var(--text-secondary)]">
        <span style={{ color: "#0f766e" }}>━</span> điểm thi thử thật ·{" "}
        <span style={{ color: "#94a3b8" }}>╌</span> mốc dự kiến
        {diff !== null && (
          <>
            {" · "}
            {diff >= 0
              ? `bạn đang đi trước kế hoạch ${diff} điểm`
              : `bạn đang chậm hơn kế hoạch ${Math.abs(diff)} điểm`}
          </>
        )}
      </figcaption>
    </figure>
  );
}

/** Mốc dự kiến gần nhất TRƯỚC hoặc ĐÚNG ngày thi thật, để so cho công bằng. */
function nearestPlanned(planned: ScorePoint[], date: string): number | null {
  const before = planned.filter((p) => p.date <= date);
  return before.length ? before[before.length - 1].score : null;
}
