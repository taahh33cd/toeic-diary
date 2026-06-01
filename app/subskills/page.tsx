import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";

export const metadata: Metadata = { title: "Subskills — TOEIC Part 2" };

export default async function SubskillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, attempts] = await Promise.all([
    user
      ? prisma.profile.findUnique({
          where: { id: user.id },
          select: { displayName: true },
        })
      : Promise.resolve(null),
    user
      ? prisma.subskillAttempt
          .findMany({
            where: { userId: user.id, part: "part2" },
            select: { questionWord: true, exerciseIndex: true, score: true, passed: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  // Best score per (questionWord, exerciseIndex)
  const best: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    const key = `${a.questionWord}:${a.exerciseIndex}`;
    if (!best[key] || a.score > best[key].score) {
      best[key] = { score: a.score, passed: a.passed };
    }
  }

  const displayName = profile?.displayName ?? user?.email?.split("@")[0] ?? "bạn";

  // Stats
  const totalExercises = PART2_SETS.length * 4; // 10 sets × 4 exercises
  const doneExercises  = Object.keys(best).length;
  const passedSets = PART2_SETS.filter((s) => {
    const keys = [0, 1, 2, 3].map((i) => `${s.questionWord}:${i}`);
    return keys.every((k) => best[k]?.passed);
  }).length;

  return (
    <div
      className="page-enter"
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
      {/* Hero banner */}
      <div
        className="animate-slide-up"
        style={{
          width: "100%",
          background: "#1E5F8E",
          borderRadius: 14,
          padding: "24px 32px",
          marginBottom: "2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 4px 16px rgba(30,95,142,0.22)",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            SUBSKILLS · TOEIC PART 2
          </p>
          <h2
            style={{
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 4px",
              lineHeight: 1.25,
            }}
          >
            Xin chào, {displayName}! 👋
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
            Luyện từng loại câu hỏi Part 2 — nhận biết nhanh, chọn đáp án chính xác.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: "100%" }}>
          {[
            { label: "NHÓM ĐÃ PASS",  value: `${passedSets}/${PART2_SETS.length}` },
            { label: "BÀI HOÀN THÀNH", value: `${doneExercises}/${totalExercises}` },
            { label: "TỔNG NHÓM",      value: `${PART2_SETS.length} nhóm` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 10,
                padding: "12px 16px",
                flex: "1 1 80px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: 5 }}>
                {value}
              </div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section divider */}
      <div style={{ width: "100%", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            TOEIC Part 2 — 10 loại câu hỏi
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
      </div>

      {/* Question word cards */}
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
          const doneCount  = exerciseBests.filter(Boolean).length;
          const passedAll  = exerciseBests.every((b) => b?.passed);
          const anyDone    = doneCount > 0;
          const pct        = Math.round((doneCount / 4) * 100);

          return (
            <Link
              key={set.questionWord}
              href={`/subskills/part2/${set.questionWord}`}
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
                  border: `1.5px solid ${
                    passedAll && anyDone
                      ? "rgba(34,197,94,0.5)"
                      : anyDone
                      ? "rgba(234,179,8,0.5)"
                      : "var(--border)"
                  }`,
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
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {set.label}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    {set.labelVi}
                  </span>
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
                    {/* Progress bar */}
                    <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: passedAll ? "rgb(34,197,94)" : "var(--accent-primary)",
                        borderRadius: 999,
                        transition: "width 0.3s",
                      }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      {doneCount}/4 bài
                    </span>
                    {/* Per-exercise mini badges */}
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
                            background: b?.passed
                              ? "rgba(34,197,94,0.18)"
                              : b
                              ? "rgba(239,68,68,0.13)"
                              : "var(--bg-elevated)",
                            color: b?.passed ? "rgb(34,197,94)" : b ? "rgb(239,68,68)" : "var(--text-muted)",
                            border: `1px solid ${
                              b?.passed
                                ? "rgba(34,197,94,0.35)"
                                : b
                                ? "rgba(239,68,68,0.25)"
                                : "var(--border)"
                            }`,
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

              {/* Arrow */}
              <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>
                →
              </span>
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
