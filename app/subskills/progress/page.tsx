import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";

export const metadata: Metadata = { title: "Tiến độ Subskills — TOEIC Part 2" };

export default async function SubskillsProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: "part2" },
          select: { questionWord: true, exerciseIndex: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const best: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    const key = `${a.questionWord}:${a.exerciseIndex}`;
    if (!best[key] || a.score > best[key].score) {
      best[key] = { score: a.score, passed: a.passed };
    }
  }

  const totalExercises = PART2_SETS.length * 4;
  const doneExercises  = Object.keys(best).length;
  const passedSets = PART2_SETS.filter((s) => {
    return [0, 1, 2, 3].every((i) => best[`${s.questionWord}:${i}`]?.passed);
  }).length;
  const passedExercises = Object.values(best).filter((b) => b.passed).length;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 900,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Page title */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: "0.4rem",
        }}>
          Subskills · TOEIC Part 2
        </p>
        <h1 style={{
          fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}>
          Tiến độ luyện tập
        </h1>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "0.75rem",
        marginBottom: "2rem",
      }}>
        {[
          { value: `${passedSets}/${PART2_SETS.length}`,   label: "Nhóm đã pass",     color: "#22c55e" },
          { value: `${passedExercises}/${totalExercises}`, label: "Bài đã pass",       color: "#3b82f6" },
          { value: `${doneExercises}/${totalExercises}`,   label: "Bài hoàn thành",    color: "#f59e0b" },
        ].map(({ value, label, color }) => (
          <div
            key={label}
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
            }}
          >
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Per-set breakdown */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {PART2_SETS.map((set, idx) => {
          const exerciseBests = [0, 1, 2, 3].map((i) => best[`${set.questionWord}:${i}`] ?? null);
          const doneCount = exerciseBests.filter(Boolean).length;
          const passedAll = exerciseBests.every((b) => b?.passed);
          const avgScore  = doneCount > 0
            ? Math.round(exerciseBests.filter(Boolean).reduce((s, b) => s + (b?.score ?? 0), 0) / doneCount)
            : null;

          return (
            <Link
              key={set.questionWord}
              href={`/subskills/listening/part2/${set.questionWord}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < PART2_SETS.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.12s",
              }}
            >
              {/* Status dot */}
              <div style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                flexShrink: 0,
                background: passedAll && doneCount > 0
                  ? "rgb(34,197,94)"
                  : doneCount > 0
                  ? "rgb(234,179,8)"
                  : "var(--border)",
              }} />

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {set.label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.4rem", fontStyle: "italic" }}>
                  {set.labelVi}
                </span>
              </div>

              {/* Exercise dots */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {exerciseBests.map((b, i) => (
                  <span
                    key={i}
                    title={`Bài ${i + 1}: ${b ? `${b.score}%` : "chưa làm"}`}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      background: b?.passed
                        ? "rgba(34,197,94,0.18)"
                        : b
                        ? "rgba(239,68,68,0.13)"
                        : "var(--bg-elevated)",
                      color: b?.passed ? "rgb(34,197,94)" : b ? "rgb(239,68,68)" : "var(--text-muted)",
                      border: `1px solid ${b?.passed ? "rgba(34,197,94,0.35)" : b ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                    }}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>

              {/* Avg score */}
              <div style={{
                width: 44,
                textAlign: "right",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: avgScore === null ? "var(--text-muted)" : passedAll ? "rgb(34,197,94)" : "var(--text-primary)",
                flexShrink: 0,
              }}>
                {avgScore === null ? "—" : `${avgScore}%`}
              </div>

              <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
