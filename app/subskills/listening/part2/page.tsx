import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";

export const metadata: Metadata = { title: "Listening Part 2 — Subskills TOEIC" };

export default async function ListeningPart2Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  const passedSets = PART2_SETS.filter((s) =>
    [0, 1, 2, 3].every((i) => best[`${s.questionWord}:${i}`]?.passed)
  ).length;
  const doneExercises = Object.keys(best).length;
  const totalExercises = PART2_SETS.length * 4;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 1100,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Subskills
        </Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Listening · Part 2</span>
      </div>

      {/* Section header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
            Listening · Part 2
          </p>
          <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
            Câu hỏi ngắn — 10 loại
          </h1>
        </div>
        {/* Mini stats */}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {[
            { value: `${passedSets}/${PART2_SETS.length}`, label: "Nhóm pass" },
            { value: `${doneExercises}/${totalExercises}`, label: "Bài xong" },
          ].map(({ value, label }) => (
            <div key={label} style={{ padding: "0.5rem 0.9rem", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--border)", background: "var(--bg-elevated)", textAlign: "center" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Question word list */}
      <div
        className="stagger-children animate-slide-up"
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {PART2_SETS.map((set, idx) => {
          const exerciseBests = [0, 1, 2, 3].map((i) => best[`${set.questionWord}:${i}`] ?? null);
          const doneCount = exerciseBests.filter(Boolean).length;
          const passedAll = exerciseBests.every((b) => b?.passed);
          const anyDone   = doneCount > 0;
          const pct       = Math.round((doneCount / 4) * 100);

          return (
            <Link
              key={set.questionWord}
              href={`/subskills/listening/part2/${set.questionWord}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.3rem 1.6rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < PART2_SETS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Status icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: passedAll && anyDone
                    ? "rgba(34,197,94,0.15)"
                    : anyDone
                    ? "rgba(234,179,8,0.15)"
                    : "var(--bg-elevated)",
                  border: `1.5px solid ${passedAll && anyDone ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {passedAll && anyDone ? "✓" : anyDone ? "…" : "○"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{set.label}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{set.labelVi}</span>
                </div>
                <p style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                  marginBottom: anyDone ? "0.55rem" : 0,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {set.intro}
                </p>
                {anyDone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: passedAll ? "rgb(34,197,94)" : "var(--accent-primary)",
                        borderRadius: 999,
                        transition: "width 0.3s",
                      }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{doneCount}/4 bài</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {exerciseBests.map((b, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            background: b?.passed ? "rgba(34,197,94,0.18)" : b ? "rgba(239,68,68,0.13)" : "var(--bg-elevated)",
                            color: b?.passed ? "rgb(34,197,94)" : b ? "rgb(239,68,68)" : "var(--text-muted)",
                            border: `1px solid ${b?.passed ? "rgba(34,197,94,0.35)" : b ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                          }}
                          title={`Bài ${i + 1}: ${b ? `${b.score}%` : "chưa làm"}`}
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
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
