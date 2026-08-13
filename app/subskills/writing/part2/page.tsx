import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { WRITING_P2_SKILLS, P2_BANDS, countTestsP2 } from "@/lib/subskills/writing-part2";
import { countPhrases } from "@/lib/subskills/writing-part2/theory";

export const metadata: Metadata = { title: "Writing Part 2 — Subskills TOEIC" };

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
          Viết e-mail — 10 tầng kỹ năng
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Đi từ đọc hiểu đề → nắm bố cục → thuộc công thức câu → viết đúng loại → cắt cho gọn → nộp bài thật.
          Mỗi tầng chia thành nhiều bộ test, mỗi bộ gồm 3 cấp độ.
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Các tầng được xếp theo <strong style={{ color: "var(--text-secondary)" }}>band điểm Writing</strong> —
          vào đúng band đang mắc thì học nhanh hơn là làm tuần tự từ đầu.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Lý thuyết & kho mẫu câu */}
      <Link
        href="/subskills/writing/part2/ly-thuyet"
        className="r-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.1rem",
          padding: "1.2rem 1.5rem",
          marginBottom: "1.5rem",
          borderRadius: "var(--radius-lg)",
          border: "1.5px solid var(--accent-primary)",
          background: "linear-gradient(135deg, rgba(59,130,246,0.09), rgba(59,130,246,0.02))",
          textDecoration: "none",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1 }}>📘</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
            Lý thuyết &amp; kho mẫu câu
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
            {countPhrases()} mẫu câu theo 7 nhóm chức năng: xưng hô · câu chào · cung cấp thông tin · đề nghị ·
            xin lỗi · câu kết · lời chào cuối. Đọc xong làm quiz để kiểm tra đã thuộc chưa.
          </p>
        </div>
        <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
      </Link>

      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.6rem" }}>
        Luyện tập theo band điểm
      </p>

      {P2_BANDS.map((band) => {
      const bandSkills = WRITING_P2_SKILLS.filter((s) => s.band === band.id);
      if (bandSkills.length === 0) return null;

      return (
      <div key={band.id} style={{ marginBottom: "1.75rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.55rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--accent-primary)", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 5, padding: "2px 8px" }}>
          BAND {band.id} · {band.range}
        </span>
        <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>{band.title}</span>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{band.blurb}</span>
      </div>

      <div
        className="stagger-children animate-slide-up"
        style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
      >
        {bandSkills.map((skill, idx) => {
          const totalTests = countTestsP2(skill.id);
          const stats = statsMap[skill.id] ?? { passedTests: 0, doneTests: 0 };
          const pct = totalTests > 0 ? Math.round((stats.doneTests / totalTests) * 100) : 0;
          const allPassed = totalTests > 0 && stats.passedTests === totalTests;
          const anyDone = stats.doneTests > 0;
          const isLast = idx === bandSkills.length - 1;
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
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{stats.doneTests}/{totalTests} test</span>
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
              href={skill.href ?? `/subskills/writing/part2/${skill.id}`}
              className="r-row"
              style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1.3rem 1.6rem", background: bg, textDecoration: "none", borderBottom }}
            >
              {inner}
              <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })}
      </div>
      </div>
      );
      })}

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
