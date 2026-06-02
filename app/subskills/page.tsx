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

  const totalExercises = PART2_SETS.length * 4;
  const doneExercises  = Object.keys(best).length;
  const passedSets = PART2_SETS.filter((s) => {
    const keys = [0, 1, 2, 3].map((i) => `${s.questionWord}:${i}`);
    return keys.every((k) => best[k]?.passed);
  }).length;

  const STATS = [
    { value: `${passedSets}/${PART2_SETS.length}`, label: "Nhóm đã pass" },
    { value: `${doneExercises}/${totalExercises}`,  label: "Bài hoàn thành" },
    { value: `${PART2_SETS.length}`,               label: "Tổng nhóm" },
  ];

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-primary)" }}>

      {/* ── Animation keyframes ── */}
      <style>{`
        @keyframes sk-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sk-a0 { opacity: 0; animation: sk-rise 0.5s cubic-bezier(.22,.68,0,1.2) 0.00s both; }
        .sk-a1 { opacity: 0; animation: sk-rise 0.5s cubic-bezier(.22,.68,0,1.2) 0.09s both; }
        .sk-a2 { opacity: 0; animation: sk-rise 0.5s cubic-bezier(.22,.68,0,1.2) 0.18s both; }
        .sk-a3 { opacity: 0; animation: sk-rise 0.5s cubic-bezier(.22,.68,0,1.2) 0.27s both; }
        .sk-a4 { opacity: 0; animation: sk-rise 0.5s cubic-bezier(.22,.68,0,1.2) 0.36s both; }
        .sk-a5 { opacity: 0; animation: sk-rise 0.5s cubic-bezier(.22,.68,0,1.2) 0.44s both; }
      `}</style>

      {/* ── Full-width hero ── */}
      <section
        style={{
          background: "linear-gradient(160deg, #1E5F8E 0%, #0e3454 100%)",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "clamp(2.5rem, 6vw, 3.5rem) clamp(1.5rem, 5vw, 3rem) 0",
          }}
        >
          {/* Eyebrow */}
          <p
            className="sk-a0"
            style={{
              margin: "0 0 1rem",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              fontWeight: 600,
            }}
          >
            Subskills · TOEIC Part 2
          </p>

          {/* Big headline */}
          <h1
            className="sk-a1"
            style={{
              margin: "0 0 0.9rem",
              fontSize: "clamp(2rem, 5.5vw, 3.2rem)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.13,
              letterSpacing: "-0.03em",
            }}
          >
            Luyện từng loại<br />câu hỏi Part 2
          </h1>

          {/* Greeting + description */}
          <p
            className="sk-a2"
            style={{
              margin: "0 0 clamp(2rem, 5vw, 3rem)",
              fontSize: "0.88rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.65,
              maxWidth: 480,
            }}
          >
            Xin chào, <strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{displayName}</strong>! 👋
            &nbsp; Nhận biết nhanh từng dạng câu — chọn đáp án chính xác.
          </p>

          {/* Stats strip (flush to bottom of hero) */}
          <div
            className="sk-a3"
            style={{
              display: "flex",
              borderTop: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "1.1rem 1rem 1.25rem",
                  borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
                }}
              >
                <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: 5 }}>
                  {value}
                </div>
                <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "clamp(1.75rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem) 3rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Section label */}
        <div
          className="sk-a4"
          style={{ marginBottom: "1.5rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              TOEIC Part 2 — 10 loại câu hỏi
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
        </div>

        {/* Question word cards */}
        <div
          className="sk-a5"
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
    </div>
  );
}
