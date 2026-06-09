import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";

export const metadata: Metadata = { title: "Tiến độ Subskills — TOEIC Part 2" };

type BestMap = Record<string, { score: number; passed: boolean }>;

function buildBest(
  attempts: { questionWord: string; exerciseIndex: number; score: number; passed: boolean }[]
): BestMap {
  const best: BestMap = {};
  for (const a of attempts) {
    const key = `${a.questionWord}:${a.exerciseIndex}`;
    if (!best[key] || a.score > best[key].score)
      best[key] = { score: a.score, passed: a.passed };
  }
  return best;
}

function DifficultySection({
  title,
  accentColor,
  best,
}: {
  title: string;
  accentColor: string;
  best: BestMap;
}) {
  const totalSets = PART2_SETS.length;
  const totalEx   = totalSets * 4;
  const doneEx    = Object.keys(best).length;
  const passedEx  = Object.values(best).filter(b => b.passed).length;
  const passedSets = PART2_SETS.filter(s =>
    [0,1,2,3].every(i => best[`${s.questionWord}:${i}`]?.passed)
  ).length;

  const anyAttempted = doneEx > 0;

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      {/* Section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "0.75rem",
        paddingBottom: "0.6rem",
        borderBottom: `2px solid ${accentColor}44`,
      }}>
        <span style={{ fontSize: "1rem", fontWeight: 800, color: accentColor }}>{title}</span>
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto", flexWrap: "wrap" }}>
          {[
            { v: `${passedSets}/${totalSets}`, l: "nhóm pass",  c: accentColor },
            { v: `${passedEx}/${totalEx}`,     l: "bài pass",   c: accentColor },
            { v: `${doneEx}/${totalEx}`,        l: "bài xong",   c: "var(--text-muted)" },
          ].map(({ v, l, c }) => (
            <div key={l} style={{
              padding: "0.3rem 0.7rem",
              borderRadius: "var(--radius-md, 8px)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              display: "flex",
              alignItems: "baseline",
              gap: "0.25rem",
            }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: c }}>{v}</span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {!anyAttempted ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", padding: "0.75rem 0" }}>
          Chưa có bài nào được làm ở mức độ này.
        </p>
      ) : (
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}>
          {PART2_SETS.map((set, idx) => {
            const bests  = [0,1,2,3].map(i => best[`${set.questionWord}:${i}`] ?? null);
            const done   = bests.filter(Boolean).length;
            const passAll = bests.every(b => b?.passed);
            const avg    = done > 0
              ? Math.round(bests.filter(Boolean).reduce((s, b) => s + (b?.score ?? 0), 0) / done)
              : null;

            if (done === 0) {
              return (
                <Link
                  key={set.questionWord}
                  href={`/subskills/listening/part2/${set.questionWord}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.85rem 1.25rem",
                    background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                    textDecoration: "none",
                    borderBottom: idx < PART2_SETS.length - 1 ? "1px solid var(--border)" : "none",
                    opacity: 0.45,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: "var(--border)" }} />
                  <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {set.label}
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", marginLeft: "0.35rem" }}>{set.labelVi}</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>chưa làm</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
                </Link>
              );
            }

            return (
              <Link
                key={set.questionWord}
                href={`/subskills/listening/part2/${set.questionWord}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1.25rem",
                  background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                  textDecoration: "none",
                  borderBottom: idx < PART2_SETS.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.12s",
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: passAll ? "rgb(34,197,94)" : "rgb(234,179,8)",
                }} />

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{set.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", marginLeft: "0.35rem" }}>{set.labelVi}</span>
                </div>

                {/* Exercise dots */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {bests.map((b, i) => (
                    <span key={i}
                      title={`Bài ${i+1}: ${b ? `${b.score}%` : "chưa làm"}`}
                      style={{
                        width: 22, height: 22, borderRadius: 5,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.6rem", fontWeight: 700,
                        background: b?.passed ? "rgba(34,197,94,0.18)" : b ? "rgba(239,68,68,0.13)" : "var(--bg-elevated)",
                        color: b?.passed ? "rgb(34,197,94)" : b ? "rgb(239,68,68)" : "var(--text-muted)",
                        border: `1px solid ${b?.passed ? "rgba(34,197,94,0.35)" : b ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                      }}
                    >
                      {b ? `${b.score}` : i + 1}
                    </span>
                  ))}
                </div>

                {/* Avg score */}
                <div style={{
                  width: 44, textAlign: "right", fontSize: "0.82rem", fontWeight: 700, flexShrink: 0,
                  color: avg === null ? "var(--text-muted)" : passAll ? "rgb(34,197,94)" : "var(--text-primary)",
                }}>
                  {avg === null ? "—" : `${avg}%`}
                </div>

                <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function SubskillsProgressPage() {
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

  const totalEx = PART2_SETS.length * 4;
  const overallDone   = new Set([...Object.keys(easyBest), ...Object.keys(mediumBest), ...Object.keys(hardBest)]).size;
  const overallPassed = [easyBest, mediumBest, hardBest].reduce((s, b) => s + Object.values(b).filter(v => v.passed).length, 0);

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
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/listening/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Listening · Part 2</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Tiến độ</span>
      </div>

      {/* Page title */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.4rem" }}>
          Subskills · TOEIC Part 2
        </p>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Tiến độ luyện tập
        </h1>
      </div>

      {/* Overall summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "2.5rem" }}>
        {[
          { value: `${overallDone}/${totalEx * 3}`,   label: "Bài hoàn thành",   color: "var(--accent-primary)" },
          { value: `${overallPassed}/${totalEx * 3}`, label: "Bài đã pass",      color: "#22c55e" },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius-lg, 12px)", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Easy + Medium + Hard</div>
          </div>
        ))}
      </div>

      {/* Per-difficulty sections */}
      <DifficultySection title="🟢 Easy"   accentColor="#22c55e" best={easyBest} />
      <DifficultySection title="🟡 Medium" accentColor="#f59e0b" best={mediumBest} />
      <DifficultySection title="🔴 Hard"   accentColor="#ef4444" best={hardBest} />

      {/* Footer */}
      <div style={{ width: "100%", marginTop: "1rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
