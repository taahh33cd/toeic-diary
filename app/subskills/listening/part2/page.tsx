import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";

export const metadata: Metadata = { title: "Listening Part 2 — Subskills TOEIC" };

type BestMap = Record<string, { score: number; passed: boolean }>;

function buildBest(attempts: { questionWord: string; exerciseIndex: number; score: number; passed: boolean }[]): BestMap {
  const best: BestMap = {};
  for (const a of attempts) {
    const key = `${a.questionWord}:${a.exerciseIndex}`;
    if (!best[key] || a.score > best[key].score) {
      best[key] = { score: a.score, passed: a.passed };
    }
  }
  return best;
}

export default async function ListeningPart2Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [easyRaw, mediumRaw, hardRaw] = user
    ? await Promise.all([
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2" },        select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => []),
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2-medium" }, select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => []),
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2-hard" },   select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => []),
      ])
    : [[], [], []];

  const easyBest   = buildBest(easyRaw);
  const mediumBest = buildBest(mediumRaw);
  const hardBest   = buildBest(hardRaw);

  // Summary stats
  const totalSets = PART2_SETS.length;
  const totalEx   = totalSets * 4;
  const easyDone   = Object.keys(easyBest).length;
  const mediumDone = Object.keys(mediumBest).length;
  const hardDone   = Object.keys(hardBest).length;
  const easyPassed   = PART2_SETS.filter(s => [0,1,2,3].every(i => easyBest[`${s.questionWord}:${i}`]?.passed)).length;
  const mediumPassed = PART2_SETS.filter(s => [0,1,2,3].every(i => mediumBest[`${s.questionWord}:${i}`]?.passed)).length;
  const hardPassed   = PART2_SETS.filter(s => [0,1,2,3].every(i => hardBest[`${s.questionWord}:${i}`]?.passed)).length;

  const diffRows = [
    { label: "🟢 Easy",   done: easyDone,   passed: easyPassed,   total: totalEx },
    { label: "🟡 Medium", done: mediumDone, passed: mediumPassed, total: totalEx },
    { label: "🔴 Hard",   done: hardDone,   passed: hardPassed,   total: totalEx },
  ];

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
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Listening · Part 2</span>
      </div>

      {/* Section header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Listening · Part 2
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Câu hỏi ngắn — 10 loại
        </h1>
      </div>

      {/* Difficulty summary strip */}
      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {diffRows.map(({ label, done, passed, total }) => (
          <div key={label} style={{ padding: "0.5rem 0.9rem", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--border)", background: "var(--bg-elevated)", minWidth: 110 }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700 }}>{passed}</span><span style={{ color: "var(--text-muted)" }}>/{PART2_SETS.length} nhóm pass</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{done}/{total} bài xong</div>
          </div>
        ))}
      </div>

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
          const eb = [0,1,2,3].map(i => easyBest[`${set.questionWord}:${i}`]   ?? null);
          const mb = [0,1,2,3].map(i => mediumBest[`${set.questionWord}:${i}`] ?? null);
          const hb = [0,1,2,3].map(i => hardBest[`${set.questionWord}:${i}`]   ?? null);

          const easyDoneCount = eb.filter(Boolean).length;
          const passedAll     = eb.every(b => b?.passed);
          const anyDone       = easyDoneCount > 0;
          const pct           = Math.round((easyDoneCount / 4) * 100);

          // Per-difficulty badge: all-pass = green, some = yellow, none = gray
          function diffStatus(bests: (null | { score: number; passed: boolean })[]) {
            const done = bests.filter(Boolean).length;
            if (done === 0) return null;
            return { done, passedAll: bests.every(b => b?.passed) };
          }
          const eSt = diffStatus(eb);
          const mSt = diffStatus(mb);
          const hSt = diffStatus(hb);

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
              {/* Status icon (based on Easy) */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: passedAll && anyDone ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)",
                border: `1.5px solid ${passedAll && anyDone ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
              }}>
                {passedAll && anyDone ? "✓" : anyDone ? "…" : "○"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{set.label}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{set.labelVi}</span>
                </div>
                <p style={{
                  fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55,
                  marginBottom: anyDone ? "0.55rem" : 0,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {set.intro}
                </p>
                {anyDone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: passedAll ? "rgb(34,197,94)" : "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{easyDoneCount}/4 bài</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {eb.map((b, i) => (
                        <span key={i} title={`Bài ${i+1}: ${b ? `${b.score}%` : "chưa làm"}`}
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 18, height: 18, borderRadius: 4, fontSize: "0.55rem", fontWeight: 700,
                            background: b?.passed ? "rgba(34,197,94,0.18)" : b ? "rgba(239,68,68,0.13)" : "var(--bg-elevated)",
                            color: b?.passed ? "rgb(34,197,94)" : b ? "rgb(239,68,68)" : "var(--text-muted)",
                            border: `1px solid ${b?.passed ? "rgba(34,197,94,0.35)" : b ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                          }}>{i + 1}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty badges */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0, alignSelf: "center" }}>
                {([
                  { key: "E", st: eSt, onColor: "#22c55e", partialColor: "#eab308" },
                  { key: "M", st: mSt, onColor: "#f59e0b", partialColor: "#f59e0b" },
                  { key: "H", st: hSt, onColor: "#ef4444", partialColor: "#ef4444" },
                ] as const).map(({ key, st, onColor, partialColor }) => (
                  <span key={key}
                    title={st ? `${st.done}/4 bài — ${st.passedAll ? "đã pass" : "đang làm"}` : "chưa làm"}
                    style={{
                      width: 20, height: 20, borderRadius: 4,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.6rem", fontWeight: 800,
                      background: st?.passedAll ? `${onColor}22` : st ? `${partialColor}18` : "var(--bg-elevated)",
                      color: st?.passedAll ? onColor : st ? partialColor : "var(--text-muted)",
                      border: `1px solid ${st?.passedAll ? `${onColor}55` : st ? `${partialColor}44` : "var(--border)"}`,
                    }}>{key}</span>
                ))}
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
