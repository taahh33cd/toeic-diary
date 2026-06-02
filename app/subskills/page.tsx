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

  const best: Record<string, { score: number; passed: boolean }> = {};
  for (const a of attempts) {
    const key = `${a.questionWord}:${a.exerciseIndex}`;
    if (!best[key] || a.score > best[key].score) {
      best[key] = { score: a.score, passed: a.passed };
    }
  }

  const displayName = profile?.displayName ?? user?.email?.split("@")[0] ?? "bạn";

  const totalExercises = PART2_SETS.length * 4;
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
      {/* Hero banner — same pattern as practice/[part] */}
      <section
        className="animate-slide-up"
        style={{
          background: "#1E5F8E",
          borderRadius: "var(--radius-xl, 16px)",
          padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 2.5rem)",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        {/* Left: greeting */}
        <div>
          <p style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginBottom: "0.5rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
            Subskills · TOEIC Part 2
          </p>
          <h1 style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: "0.4rem",
          }}>
            Xin chào, {displayName}! 👋
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            Luyện từng loại câu hỏi Part 2 — nhận biết nhanh, chọn đáp án chính xác.
          </p>
        </div>

        {/* Right: stat cards */}
        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0, flexWrap: "wrap" }}>
          {[
            { value: `${passedSets}/${PART2_SETS.length}`, label: "Nhóm đã pass" },
            { value: `${doneExercises}/${totalExercises}`,  label: "Bài hoàn thành" },
          ].map(({ value, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.12)",
                minWidth: 90,
              }}
            >
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {value}
              </span>
              <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", marginTop: "0.3rem", textAlign: "center" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section divider */}
      <div style={{ width: "100%", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
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
