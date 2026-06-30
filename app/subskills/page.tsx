import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";

export const metadata: Metadata = { title: "Subskills — TOEIC" };

const SKILLS = [
  {
    key: "listening",
    emoji: "🎧",
    label: "Listening",
    href: "/subskills/listening",
    description: "Part 2 đang mở · Part 3, 4 sắp ra",
    comingSoon: false,
  },
  {
    key: "reading",
    emoji: "📖",
    label: "Reading",
    href: "/subskills/reading",
    description: "Part 5 đang mở · 12 thì, 6 levels mỗi thì",
    comingSoon: false,
  },
  {
    key: "speaking",
    emoji: "🗣",
    label: "Speaking",
    href: "/subskills/speaking",
    description: "Part 1 đang mở · Part 2, 3 sắp ra",
    comingSoon: false,
  },
  {
    key: "writing",
    emoji: "✍️",
    label: "Writing",
    href: "/subskills/writing",
    description: "Luyện kỹ năng mô tả ảnh và hoàn thành câu",
    comingSoon: false,
  },
];

export default async function SubskillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, easyAttempts, mediumAttempts, hardAttempts] = await Promise.all([
    user
      ? prisma.profile.findUnique({ where: { id: user.id }, select: { displayName: true } })
      : Promise.resolve(null),
    user
      ? prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2" },        select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => [])
      : Promise.resolve([]),
    user
      ? prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2-medium" }, select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => [])
      : Promise.resolve([]),
    user
      ? prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2-hard" },   select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => [])
      : Promise.resolve([]),
  ]);

  // Best score per difficulty tier, keyed by "questionWord:exerciseIndex"
  function buildBest(attempts: { questionWord: string; exerciseIndex: number; score: number; passed: boolean }[]) {
    const best: Record<string, { score: number; passed: boolean }> = {};
    for (const a of attempts) {
      const key = `${a.questionWord}:${a.exerciseIndex}`;
      if (!best[key] || a.score > best[key].score) best[key] = { score: a.score, passed: a.passed };
    }
    return best;
  }
  const easyBest   = buildBest(easyAttempts);
  const mediumBest = buildBest(mediumAttempts);
  const hardBest   = buildBest(hardAttempts);

  const displayName = profile?.displayName ?? user?.email?.split("@")[0] ?? "bạn";

  // Easy: a "set" is passed when all 4 Easy exercises are passed
  const part2PassedSets = PART2_SETS.filter((s) =>
    [0, 1, 2, 3].every((i) => easyBest[`${s.questionWord}:${i}`]?.passed)
  ).length;

  // Total done = unique exercises done across all 3 difficulties
  const allKeys = new Set([...Object.keys(easyBest), ...Object.keys(mediumBest), ...Object.keys(hardBest)]);
  const part2DoneExercises  = allKeys.size;
  const part2TotalExercises = PART2_SETS.length * 4 * 3; // 10 sets × 4 exercises × 3 difficulties

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
      <section
        className="animate-slide-up"
        style={{
          background: "#1E5F8E",
          borderRadius: "var(--radius-xl, 16px)",
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
          marginBottom: "2rem",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginBottom: "0.5rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
            Subskills · TOEIC
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
            Luyện từng kỹ năng TOEIC theo từng loại câu hỏi — chọn kỹ năng để bắt đầu.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0, flexWrap: "wrap" }}>
          {[
            { value: `${part2PassedSets}/${PART2_SETS.length}`, label: "L. Part 2 pass (Easy)" },
            { value: `${part2DoneExercises}/${part2TotalExercises}`, label: "Bài xong (E+M+H)" },
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
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", marginTop: "0.3rem", textAlign: "center" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Chọn kỹ năng luyện tập
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Skill cards */}
      <div
        className="stagger-children animate-slide-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {SKILLS.map((skill) => {
          if (skill.comingSoon) {
            return (
              <div
                key={skill.key}
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius-lg, 12px)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  opacity: 0.55,
                  cursor: "not-allowed",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>{skill.emoji}</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{skill.label}</span>
                </div>
                <span style={{
                  display: "inline-block",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                }}>
                  Coming soon
                </span>
              </div>
            );
          }

          // Active skill — full card is a link
          const statLine = skill.key === "listening"
            ? `Easy: ${part2PassedSets}/${PART2_SETS.length} nhóm pass · ${part2DoneExercises}/${part2TotalExercises} bài (E+M+H)`
            : null;

          return (
            <Link
              key={skill.key}
              href={skill.href!}
              className="skill-card-link"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.5rem",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                boxShadow: "var(--shadow-sm)",
                textDecoration: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>{skill.emoji}</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{skill.label}</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--accent-primary)" }}>→</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {skill.description}
              </div>
              {statLine && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "var(--text-secondary)", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                  {statLine}
                </div>
              )}
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
