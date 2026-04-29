"use client";

import { useAllStudents } from "@/hooks/firebase/useAllStudents";

export default function ProgressPage() {
  const { students, loading } = useAllStudents();

  const sorted = [...students].sort((a, b) => {
    const aScore = a.scores ? Math.max(...a.scores.map((s) => s.score)) : 0;
    const bScore = b.scores ? Math.max(...b.scores.map((s) => s.score)) : 0;
    return bScore - aScore;
  });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        📈 Tiến độ học viên
      </h1>

      {students.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">📈</div>
          <p style={{ color: "var(--text-secondary)" }}>Chưa có học viên.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((student, rank) => {
            const scores = student.scores ?? [];
            const bestScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;
            const latestScore = scores.length > 0
              ? [...scores].sort((a, b) => b.date.localeCompare(a.date))[0]
              : null;
            const hwCount = student.homework?.length ?? 0;

            // Score trend
            const trend =
              scores.length >= 2
                ? scores[scores.length - 1].score - scores[scores.length - 2].score
                : 0;

            return (
              <div
                key={student.id}
                className="rounded-xl p-4 border flex items-center gap-4 flex-wrap"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Rank */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: rank < 3 ? "var(--accent-primary)" : "var(--border)",
                    color: rank < 3 ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {rank + 1}
                </div>

                {/* Name + code */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {student.name}
                    {student.frozen && (
                      <span className="ml-2 text-[10px]" style={{ color: "rgb(220,38,38)" }}>❄️</span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {student.id} · Tuần {student.currentWeek ?? "—"} · {hwCount} bài
                  </p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  {latestScore ? (
                    <>
                      <p className="text-xl font-bold" style={{ color: "var(--accent-primary)" }}>
                        {latestScore.score}
                        {trend !== 0 && (
                          <span
                            className="text-xs ml-1"
                            style={{ color: trend > 0 ? "rgb(16,185,129)" : "rgb(239,68,68)" }}
                          >
                            {trend > 0 ? `+${trend}` : trend}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        Best: {bestScore} · {scores.length} lần
                      </p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>—</p>
                  )}
                </div>

                {/* Score bar */}
                {bestScore > 0 && (
                  <div className="w-full">
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(bestScore / 990) * 100}%`,
                          background: "var(--accent-primary)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
