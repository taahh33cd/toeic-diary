import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { SPEAKING_P2_SKILLS } from "@/lib/subskills/speaking-part2";
import { STEPS_SKILL, STEP_TESTS_COUNT } from "@/lib/subskills/speaking-p2-steps";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Speaking Part 2 — Subskills TOEIC" };

const TESTS_PER_SKILL = 5;

export default async function SpeakingPart2Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { startsWith: "sp2-" } },
          select: { part: true, questionWord: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  type SkillStats = { passedTests: number; doneTests: number };
  const statsMap: Record<string, SkillStats> = {};
  for (const skill of SPEAKING_P2_SKILLS) {
    const easyPart = skill.part;
    const easyAttempts = attempts.filter((a) => a.part === easyPart);
    const easyBest: Record<string, number> = {};
    for (const a of easyAttempts) {
      const prev = easyBest[a.questionWord] ?? 0;
      if (a.score > prev) easyBest[a.questionWord] = a.score;
    }
    const passedTests = Object.values(easyBest).filter((s) => s >= 80).length;
    const doneTests = Object.keys(easyBest).length;
    statsMap[skill.id] = { passedTests, doneTests };
  }

  // Skill 6 — guided 3-step picture description (own data model, own route)
  const stepsEasyBest: Record<string, number> = {};
  for (const a of attempts.filter((x) => x.part === STEPS_SKILL.part)) {
    const prev = stepsEasyBest[a.questionWord] ?? 0;
    if (a.score > prev) stepsEasyBest[a.questionWord] = a.score;
  }
  const stepsStats = {
    passedTests: Object.values(stepsEasyBest).filter((s) => s >= 80).length,
    doneTests: Object.keys(stepsEasyBest).length,
  };

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
        <Link href="/subskills/speaking" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Speaking</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Part 2</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Speaking · Part 2
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Mô tả ảnh — 6 kỹ năng
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          5 kỹ năng ngữ pháp — mỗi kỹ năng 5 bộ test × 3 cấp độ (Easy → Medium → Hard), 25 câu/cấp.
          Riêng <b>Mô tả tranh theo 3 bước</b> luyện quy trình mô tả hoàn chỉnh trên 47 bức ảnh thật, có ghi âm.
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
        {SPEAKING_P2_SKILLS.map((skill, idx) => {
          const stats = statsMap[skill.id] ?? { passedTests: 0, doneTests: 0 };
          const pct = Math.round((stats.doneTests / TESTS_PER_SKILL) * 100);
          const allPassed = stats.passedTests === TESTS_PER_SKILL;
          const anyDone = stats.doneTests > 0;

          return (
            <Link
              key={skill.id}
              href={`/subskills/speaking/part2/${skill.id}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.3rem 1.6rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: "1px solid var(--border)",
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

        {/* Skill 6 — guided 3-step picture description */}
        {(() => {
          const pct = Math.round((stepsStats.doneTests / STEP_TESTS_COUNT) * 100);
          const allPassed = stepsStats.passedTests === STEP_TESTS_COUNT;
          const anyDone = stepsStats.doneTests > 0;
          return (
            <Link
              href={`/subskills/speaking/part2/${STEPS_SKILL.id}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.3rem 1.6rem",
                background: SPEAKING_P2_SKILLS.length % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: allPassed && anyDone ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)",
                border: `1.5px solid ${allPassed && anyDone ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.sm,
              }}>
                {allPassed && anyDone ? "✓" : anyDone ? "…" : "○"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{STEPS_SKILL.labelVi}</span>
                  <span style={{ fontSize: FS.xs, color: "var(--text-muted)", fontStyle: "italic" }}>{STEPS_SKILL.label}</span>
                  <span style={{ fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgb(168,85,247)", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: 4, padding: "1px 6px" }}>
                    Có ghi âm
                  </span>
                </div>
                <p style={{
                  fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.55,
                  marginBottom: anyDone ? "0.55rem" : 0,
                }}>
                  {STEPS_SKILL.description}
                </p>
                {anyDone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: allPassed ? "rgb(34,197,94)" : "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{stepsStats.doneTests}/{STEP_TESTS_COUNT} bộ</span>
                    <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>·</span>
                    <span style={{ fontSize: FS.xs, color: stepsStats.passedTests > 0 ? "rgb(34,197,94)" : "var(--text-muted)" }}>
                      {stepsStats.passedTests} pass (Easy ≥ 80%)
                    </span>
                  </div>
                )}
              </div>

              <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })()}

        {/* Vocabulary reflex drill — feeds the two hardest steps of the description */}
        <Link
          href="/subskills/speaking/part2/tu-vung"
          className="r-row"
          style={{
            display: "flex", alignItems: "flex-start", gap: "0.9rem", padding: "1.1rem 1.3rem",
            textDecoration: "none", background: "var(--bg-secondary)", borderTop: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: FS.lg, lineHeight: 1, marginTop: 2 }}>⚡</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: 3 }}>
              <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>Phản xạ từ vựng</span>
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)", fontStyle: "italic" }}>Clothes &amp; Actions</span>
              <span style={{ fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgb(234,179,8)", background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.35)", borderRadius: 4, padding: "1px 6px" }}>
                Có tính giờ
              </span>
            </div>
            <p style={{ margin: "0 0 0.4rem", fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.55 }}>
              60 từ về trang phục và hành động — học thẻ, chơi lật thẻ ghi nhớ, rồi quét ảnh trong 45 giây để luyện bật ra từ.
            </p>
          </div>
          <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
        </Link>
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
