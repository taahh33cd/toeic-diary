import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { SPEAKING_SKILLS } from "@/lib/subskills/speaking";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Speaking Part 1 — Subskills TOEIC" };

const TESTS_PER_SKILL = 20;

export default async function SpeakingPart1Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all speaking-part1 attempts for this user
  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: {
            userId: user.id,
            part: { startsWith: "sp1-" },
          },
          select: { part: true, questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  // Aggregate: for each skill, count passed tests across all difficulties
  type SkillStats = { passedTests: number; doneTests: number };
  const statsMap: Record<string, SkillStats> = {};
  for (const skill of SPEAKING_SKILLS) {
    const skillAttempts = attempts.filter(
      (a) => a.part === skill.part || a.part.startsWith(`${skill.part}-`)
    );
    // Best score per (questionWord = testNum, easy only) to count "passed"
    const easyBest: Record<string, number> = {};
    for (const a of skillAttempts) {
      if (a.part !== skill.part) continue; // skip medium/hard for "passed" count
      const prev = easyBest[a.questionWord] ?? 0;
      if (a.score > prev) easyBest[a.questionWord] = a.score;
    }
    const passedTests = Object.values(easyBest).filter((s) => s >= 80).length;
    const doneTests   = Object.keys(easyBest).length;
    statsMap[skill.id] = { passedTests, doneTests };
  }

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Speaking · Part 1</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Speaking · Part 1
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Đọc văn bản to — 5 kỹ năng nền tảng, 20 bộ test mỗi kỹ năng
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Mỗi kỹ năng có 20 bộ test, mỗi bộ gồm 3 cấp độ (Easy → Medium → Hard), 25 câu/cấp.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Skill list */}
      <div
        className="stagger-children animate-slide-up"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {SPEAKING_SKILLS.map((skill, idx) => {
          const stats = statsMap[skill.id] ?? { passedTests: 0, doneTests: 0 };
          const pct   = Math.round((stats.doneTests / TESTS_PER_SKILL) * 100);
          const allPassed = stats.passedTests === TESTS_PER_SKILL;
          const anyDone   = stats.doneTests > 0;

          return (
            <Link
              key={skill.id}
              href={`/subskills/speaking/part1/${skill.id}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.3rem 1.6rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < SPEAKING_SKILLS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Status icon */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: allPassed && anyDone ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)",
                border: `1.5px solid ${allPassed && anyDone ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.sm,
              }}>
                {allPassed && anyDone ? "✓" : anyDone ? "…" : "○"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem" }}>
                  <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{skill.labelVi}</span>
                  <span style={{ fontSize: FS.xs, color: "var(--text-muted)", fontStyle: "italic" }}>{skill.label}</span>
                </div>
                <p style={{
                  fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.55,
                  marginBottom: anyDone ? "0.55rem" : 0,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {skill.description}
                </p>
                {anyDone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: allPassed ? "rgb(34,197,94)" : "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{stats.doneTests}/{TESTS_PER_SKILL} test</span>
                    <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>·</span>
                    <span style={{ fontSize: FS.xs, color: stats.passedTests > 0 ? "rgb(34,197,94)" : "var(--text-muted)" }}>
                      {stats.passedTests} pass (Easy ≥ 80%)
                    </span>
                  </div>
                )}
              </div>

              <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ width: "100%", marginTop: "auto", paddingTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
