import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_PAIRS } from "@/lib/subskills/writing-part3/samples";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";
import {
  WRITING_P3_SKILLS,
  P3_BANDS,
  countTestsP3,
  suggestBandP3,
  type P3Band,
  type P3BandSignal,
} from "@/lib/subskills/writing-part3";

export const metadata: Metadata = { title: "Writing Part 3 — Subskills TOEIC" };

/**
 * Điểm rubric trung bình của một bản nộp, đọc từ feedback giáo viên ghi.
 * Với Q8 chỉ có một item nên đây chính là điểm 0–5 của bài luận.
 */
function rubricFromFeedback(fb: unknown): number | null {
  if (!fb || typeof fb !== "object") return null;
  const items = (fb as { items?: unknown }).items;
  if (!Array.isArray(items)) return null;
  const scores = items
    .map((i) => (i && typeof i === "object" ? (i as { score?: unknown }).score : null))
    .filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export default async function WritingPart3Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const attempts = user
    ? await prisma.subskillAttempt
        .findMany({
          where: { userId: user.id, part: { startsWith: "wp3-" } },
          select: { part: true, questionWord: true, itemIdx: true, score: true, passed: true },
        })
        .catch(() => [])
    : [];

  // ── Gợi ý band ──────────────────────────────────────────────
  // Đọc điểm rubric THÔ của bài Q8, KHÔNG đọc trường `band`: estimateBand()
  // quy đổi rubric của riêng một câu ra thang 200 (Q8 mức 2 → 80đ), nên dùng nó
  // sẽ đẩy người yếu bài luận xuống band "chưa tới lượt" — ngược thứ ETS nói.
  // Trường `band` chỉ dùng khi chưa có bài Q8 nào, lúc đó nó là proxy nền chung.
  const submissions = user
    ? await prisma.skillSubmission
        .findMany({
          where: { userId: user.id, skill: "writing", status: "graded" },
          select: { unit: true, band: true, feedback: true, gradedAt: true },
          orderBy: { gradedAt: "desc" },
          take: 20,
        })
        .catch(() => [])
    : [];

  let signal: P3BandSignal = { source: "none" };
  // Bài luận Q8 đến từ hai nơi: khu /skills dùng unit "q8", Tầng 13 dùng
  // "subskill-wp3-tang13". Cả hai đều chấm bằng rubric 0–5 của Q8.
  const latestQ8 = submissions.find((s) => s.unit === "q8" || s.unit === "subskill-wp3-tang13");
  const q8Rubric = latestQ8 ? rubricFromFeedback(latestQ8.feedback) : null;

  if (q8Rubric !== null) {
    signal = { source: "q8", rubric: Math.round(q8Rubric) };
  } else {
    const bands = submissions.map((s) => s.band).filter((b): b is number => typeof b === "number");
    if (bands.length > 0) {
      signal = { source: "writing-other", band: Math.round(bands.reduce((a, b) => a + b, 0) / bands.length) };
    }
  }

  const suggestion = suggestBandP3(signal);
  const suggestedBand: P3Band | null = user ? suggestion.band : null;

  const statsMap: Record<string, { passedTests: number; doneTests: number }> = {};
  for (const skill of WRITING_P3_SKILLS) {
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
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Part 3</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Writing · Part 3
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Viết luận — 14 tầng kỹ năng
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Một câu duy nhất, 30 phút, tối thiểu 300 từ, chấm trên thang 0–5. Đi từ đọc đúng đề → chọn phe →
          chứng minh bằng ví dụ → dựng khung bài → làm sâu → tinh chỉnh → nộp bài thật.
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: FS.sm, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Mỗi tầng nhắm vào <strong style={{ color: "var(--text-secondary)" }}>đúng một trục trong thang chấm</strong> —
          luyện nhầm trục thì chăm đến mấy cũng đứng yên tại chỗ.
        </p>
      </div>

      {suggestedBand && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.8rem",
            padding: "0.9rem 1.2rem",
            marginBottom: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--accent-primary)",
            background: "linear-gradient(135deg, rgba(59,130,246,0.09), rgba(59,130,246,0.02))",
          }}
        >
          <span style={{ fontSize: FS.md, flexShrink: 0, lineHeight: 1.4 }}>🎯</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
              Gợi ý bắt đầu từ Band {suggestedBand} · {P3_BANDS.find((b) => b.id === suggestedBand)?.range}
            </div>
            <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
              {suggestion.why} Bạn vẫn vào được mọi band khác nếu muốn.
            </p>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Thư viện bài mẫu — cặp mức 3 / mức 5 */}
      <Link
        href="/subskills/writing/part3/bai-mau"
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
        <span style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1 }}>📄</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
            Thư viện bài mẫu
          </div>
          <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
            {SAMPLE_PAIRS.length} cặp bài mức 3 / mức 5 đặt cạnh nhau, mỗi dạng đề một cặp. Bài mức 3 cố ý viết
            gần như không có lỗi ngữ pháp nào — để thấy vì sao sạch lỗi thôi vẫn chưa lên được mức 4.
          </p>
        </div>
        <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
      </Link>

      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.6rem" }}>
        Luyện tập theo band điểm
      </p>

      {P3_BANDS.map((band) => {
        const bandSkills = WRITING_P3_SKILLS.filter((s) => s.band === band.id);
        if (bandSkills.length === 0) return null;
        const isSuggested = band.id === suggestedBand;

        return (
          <div key={band.id} style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.55rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: FS.xs, fontWeight: 800, letterSpacing: "0.08em", color: "var(--accent-primary)", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 5, padding: "2px 8px" }}>
                BAND {band.id} · {band.range}
              </span>
              <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{band.title}</span>
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{band.blurb}</span>
              {isSuggested && (
                <span style={{ fontSize: FS.xs, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "#fff", background: "var(--accent-primary)", borderRadius: 4, padding: "2px 7px" }}>
                  Gợi ý cho bạn
                </span>
              )}
            </div>

            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0 0 0.6rem" }}>
              Đích của band này: <strong style={{ color: "var(--text-secondary)" }}>{band.goal}</strong>
              {band.id === "A" && " — bài luận chưa phải đòn bẩy tốt nhất ở mức điểm này."}
            </p>

            <div
              className="stagger-children animate-slide-up"
              style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
            >
              {bandSkills.map((skill, idx) => {
                const totalTests = countTestsP3(skill.id);
                const stats = statsMap[skill.id] ?? { passedTests: 0, doneTests: 0 };
                const pct = totalTests > 0 ? Math.round((stats.doneTests / totalTests) * 100) : 0;
                const allPassed = totalTests > 0 && stats.passedTests === totalTests;
                const anyDone = stats.doneTests > 0;
                const isLast = idx === bandSkills.length - 1;
                const bg = idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)";
                const borderBottom = isLast ? "none" : "1px solid var(--border)";

                const inner = (
                  <>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: allPassed && anyDone ? "rgba(34,197,94,0.15)" : anyDone ? "rgba(234,179,8,0.15)" : "var(--bg-elevated)", border: `1.5px solid ${allPassed && anyDone ? "rgba(34,197,94,0.5)" : anyDone ? "rgba(234,179,8,0.5)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.sm }}>
                      {allPassed && anyDone ? "✓" : anyDone ? "…" : "○"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{skill.labelVi}</span>
                        <span style={{ fontSize: FS.xs, color: "var(--text-muted)", fontStyle: "italic" }}>{skill.label}</span>
                        <span style={{ fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                          {skill.axis}
                        </span>
                        {!skill.active && (
                          <span style={{ fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
                            Sắp có
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{skill.description}</p>
                      {anyDone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
                          <div style={{ flex: "1 1 100px", maxWidth: 120, height: 3, background: "var(--border)", borderRadius: 999 }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: allPassed ? "rgb(34,197,94)" : "var(--accent-primary)", borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{stats.doneTests}/{totalTests} test</span>
                          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>·</span>
                          <span style={{ fontSize: FS.xs, color: stats.passedTests > 0 ? "rgb(34,197,94)" : "var(--text-muted)" }}>
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
                    href={skill.href ?? `/subskills/writing/part3/${skill.id}`}
                    className="r-row"
                    style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1.3rem 1.6rem", background: bg, textDecoration: "none", borderBottom }}
                  >
                    {inner}
                    <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ width: "100%", marginTop: "auto", paddingTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
