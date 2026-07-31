import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { WRITING_P2_SKILLS } from "@/lib/subskills/writing-part2";

export const metadata: Metadata = { title: "Writing Part 2 — Subskills TOEIC" };

const TESTS_PER_SKILL = 5;

export default async function WritingPart2Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { startsWith: "wp2-" } },
          select: { part: true, questionWord: true, itemIdx: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  const statsMap: Record<string, { passedTests: number; doneTests: number }> = {};
  for (const skill of WRITING_P2_SKILLS) {
    const easyAttempts = attempts.filter((a) => a.part === skill.dbPartPrefix);
    const finalByTest: Record<string, { score: number; passed: boolean }> = {};
    const startedTests = new Set<string>();
    for (const a of easyAttempts) {
      startedTests.add(a.questionWord);
      if (a.itemIdx === null) {
        const prev = finalByTest[a.questionWord];
        if (!prev || a.score > prev.score) finalByTest[a.questionWord] = { score: a.score, passed: a.passed };
      }
    }
    statsMap[skill.id] = {
      passedTests: Object.values(finalByTest).filter((f) => f.passed).length,
      doneTests: startedTests.size,
    };
  }

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Part 2</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Writing · Part 2
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Viết e-mail — 7 tầng kỹ năng
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Đi từ đọc hiểu đề → nắm bố cục → thuộc công thức câu → tự viết → tự phê bình.
          Mỗi tầng có 5 bộ test, mỗi bộ gồm 3 cấp độ.
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Chưa viết được câu nào? Bắt đầu từ <strong style={{ color: "var(--text-secondary)" }}>Tầng 0</strong> — chỉ cần chọn và ghép, không phải tự nghĩ ra câu.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      <div
        className="stagger-children animate-slide-up"
        style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
      >
        {WRITING_P2_SKILLS.map((skill, idx) => {
          const stats = statsMap[skill.id] ?? { passedTests: 0, doneTests: 0 };
          const pct = Math.round((stats.doneTests / TESTS_PER_SKILL) * 100);
          const allPassed = stats.passedTests === TESTS_PER_SKILL;
          const anyDone = stats.doneTests > 0;
          const isLast = idx === WRITING_P2_SKILLS.length - 1;
          const bg = idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)";
          const borderBottom = isLast ? "none" : "1px solid var(--border)";

          const inner = (
            <>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: allPassed && anyDone ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)", border: `1.5px solid ${allPassed && anyDone ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>
                {allPassed && anyDone ? "✓" : anyDone ? "…" : "○"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{skill.labelVi}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{skill.label}</span>
                  {!skill.active && (
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                      Sắp có
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{skill.description}</p>
                {anyDone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
                    <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: allPassed ? "rgb(34,197,94)" : "var(--accent-primary)", borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{stats.doneTests}/{TESTS_PER_SKILL} test</span>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>·</span>
                    <span style={{ fontSize: "0.68rem", color: stats.passedTests > 0 ? "rgb(34,197,94)" : "var(--text-muted)" }}>
                      {stats.passedTests} pass (Easy ≥ 80%)
                    </span>
                  </div>
                )}
              </div>
            </>
          );

          if (!skill.active) {
            return (
              <div key={skill.id} style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1.3rem 1.6rem", background: bg, borderBottom, opacity: 0.5 }}>
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={skill.id}
              href={`/subskills/writing/part2/${skill.id}`}
              className="r-row"
              style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1.3rem 1.6rem", background: bg, textDecoration: "none", borderBottom }}
            >
              {inner}
              <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })}
      </div>

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
