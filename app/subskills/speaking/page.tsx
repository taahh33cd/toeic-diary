import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { SPEAKING_SKILLS } from "@/lib/subskills/speaking";
import { SPEAKING_P2_SKILLS } from "@/lib/subskills/speaking-part2";
import { SPEAKING_P4_SKILLS } from "@/lib/subskills/speaking-part4";

export const metadata: Metadata = { title: "Speaking — Subskills TOEIC" };

const P1_TESTS_PER_SKILL = 20;
const P2_TESTS_PER_SKILL = 5;
const P4_TESTS_PER_SKILL = 3;

export default async function SpeakingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [p1Attempts, p2Attempts, p4Attempts, recordingRows] = user
    ? await Promise.all([
        prisma.subskillAttempt
          .findMany({ where: { userId: user.id, part: { startsWith: "sp1-" } }, select: { part: true, questionWord: true, score: true, passed: true } })
          .catch(() => []),
        prisma.subskillAttempt
          .findMany({ where: { userId: user.id, part: { startsWith: "sp2-" } }, select: { part: true, questionWord: true, score: true, passed: true } })
          .catch(() => []),
        prisma.subskillAttempt
          .findMany({ where: { userId: user.id, part: { startsWith: "sp4-" } }, select: { part: true, questionWord: true, score: true, passed: true } })
          .catch(() => []),
        (prisma.$queryRaw`SELECT overall_score FROM speaking_recording_attempts WHERE user_id = ${user.id}` as Promise<{ overall_score: number }[]>)
          .catch(() => [] as { overall_score: number }[]),
      ])
    : [[], [], [], [] as { overall_score: number }[]];

  // Part 1 stats
  let p1SkillsDone = 0;
  let p1TestsPassed = 0;
  for (const skill of SPEAKING_SKILLS) {
    const skillAttempts = p1Attempts.filter((a) => a.part === skill.part);
    if (skillAttempts.length > 0) p1SkillsDone++;
    const best: Record<string, number> = {};
    for (const a of skillAttempts) {
      const prev = best[a.questionWord] ?? 0;
      if (a.score > prev) best[a.questionWord] = a.score;
    }
    p1TestsPassed += Object.values(best).filter((s) => s >= 80).length;
  }

  // Part 2 stats
  let p2SkillsDone = 0;
  let p2TestsPassed = 0;
  for (const skill of SPEAKING_P2_SKILLS) {
    const skillAttempts = p2Attempts.filter((a) => a.part === skill.part);
    if (skillAttempts.length > 0) p2SkillsDone++;
    const best: Record<string, number> = {};
    for (const a of skillAttempts) {
      const prev = best[a.questionWord] ?? 0;
      if (a.score > prev) best[a.questionWord] = a.score;
    }
    p2TestsPassed += Object.values(best).filter((s) => s >= 80).length;
  }

  // Part 4 stats — chỉ tính các kỹ năng đã có bài tập
  const p4Ready = SPEAKING_P4_SKILLS.filter((s) => s.ready);
  let p4SkillsDone = 0;
  let p4TestsPassed = 0;
  for (const skill of p4Ready) {
    const skillAttempts = p4Attempts.filter((a) => a.part === skill.part || a.part.startsWith(`${skill.part}-`));
    if (skillAttempts.length > 0) p4SkillsDone++;
    const best: Record<string, number> = {};
    for (const a of skillAttempts) {
      const key = `${a.part}:${a.questionWord}`;
      const prev = best[key] ?? 0;
      if (a.score > prev) best[key] = a.score;
    }
    p4TestsPassed += Object.values(best).filter((s) => s >= 80).length;
  }

  const recordingCount = recordingRows.length;
  const bestRecordingScore = recordingCount > 0
    ? Math.round(Math.max(...recordingRows.map((r) => r.overall_score)))
    : null;

  const totalTests = SPEAKING_SKILLS.length * P1_TESTS_PER_SKILL; // 100

  type PartConfig = {
    part: number;
    label: string;
    description: string;
    href: string | null;
    active: boolean;
    detail: string | null;
    skillsDone: number;
    totalSkills: number;
    testsPassed: number;
    totalTestsAll: number;
  };

  const PARTS: PartConfig[] = [
    {
      part: 1,
      label: "Part 1 — Đọc văn bản to",
      description: "Luyện 5 kỹ năng nền tảng: phát âm, ngắt nghỉ, ngữ điệu, trọng âm câu, nối âm. Mỗi kỹ năng có 5 bộ test × 3 cấp độ.",
      href: "/subskills/speaking/part1",
      active: true,
      detail: `5 kỹ năng · ${P1_TESTS_PER_SKILL} bộ test/kỹ năng · 3 cấp độ`,
      skillsDone: p1SkillsDone,
      totalSkills: SPEAKING_SKILLS.length,
      testsPassed: p1TestsPassed,
      totalTestsAll: totalTests,
    },
    {
      part: 2,
      label: "Part 2 — Mô tả ảnh",
      description: "Quan sát ảnh và mô tả chi tiết trong 45 giây. Luyện cấu trúc câu, từ vựng mô tả.",
      href: "/subskills/speaking/part2",
      active: true,
      detail: `6 kỹ năng · ${P2_TESTS_PER_SKILL} bộ test/kỹ năng · 3 cấp độ · có ghi âm`,
      skillsDone: p2SkillsDone,
      totalSkills: SPEAKING_P2_SKILLS.length,
      testsPassed: p2TestsPassed,
      totalTestsAll: SPEAKING_P2_SKILLS.length * P2_TESTS_PER_SKILL,
    },
    {
      part: 3,
      label: "Part 3 — Trả lời câu hỏi",
      description: "Trả lời 3 câu hỏi liên tiếp về một chủ đề quen thuộc trong 15–30 giây mỗi câu.",
      href: null,
      active: false,
      detail: null,
      skillsDone: 0,
      totalSkills: 0,
      testsPassed: 0,
      totalTestsAll: 0,
    },
    {
      part: 4,
      label: "Part 4 — Trả lời theo thông tin cho trước",
      description: "Đọc bảng lịch, đơn hàng hay CV rồi trả lời 3 câu hỏi. Luyện đọc số, đính chính thông tin sai và liệt kê cho câu 10.",
      href: "/subskills/speaking/part4",
      active: true,
      detail: `${p4Ready.length}/${SPEAKING_P4_SKILLS.length} kỹ năng · ${P4_TESTS_PER_SKILL} bộ test/kỹ năng · 3 cấp độ · có ghi âm`,
      skillsDone: p4SkillsDone,
      totalSkills: p4Ready.length,
      testsPassed: p4TestsPassed,
      totalTestsAll: p4Ready.length * P4_TESTS_PER_SKILL,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Speaking</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          🗣 Speaking
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          Luyện kỹ năng nói TOEIC
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Luyện từng kỹ năng phát âm, ngắt nhịp và nhấn giọng trước khi bước vào đề thi Speaking chính thức.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Parts list */}
      <div
        className="stagger-children animate-slide-up"
        style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
      >
        {PARTS.map((p, idx) => {
          if (!p.active) {
            return (
              <div
                key={p.part}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "1.25rem",
                  padding: "1.3rem 1.6rem",
                  background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                  borderBottom: idx < PARTS.length - 1 ? "1px solid var(--border)" : "none",
                  opacity: 0.55,
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: "var(--bg-elevated)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>
                  {p.part}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.label}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>Coming soon</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.description}</p>
                </div>
              </div>
            );
          }

          const hasDone = p.skillsDone > 0;

          return (
            <Link
              key={p.part}
              href={p.href!}
              className="r-row"
              style={{
                display: "flex", alignItems: "flex-start", gap: "1.25rem",
                padding: "1.3rem 1.6rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < PARTS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {/* Status icon */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: hasDone ? "rgba(59,130,246,0.12)" : "var(--bg-elevated)",
                border: `1.5px solid ${hasDone ? "rgba(59,130,246,0.4)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700,
                color: hasDone ? "var(--accent-primary)" : "var(--text-muted)",
              }}>
                {p.part}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{p.label}</div>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                    {p.detail}
                  </span>
                  {hasDone && (
                    <>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.skillsDone}/{p.totalSkills} kỹ năng đã bắt đầu</span>
                      {p.testsPassed > 0 && (
                        <span style={{ fontSize: "0.68rem", color: "rgb(34,197,94)" }}>{p.testsPassed}/{p.totalTestsAll} test pass (Easy ≥ 80%)</span>
                      )}
                    </>
                  )}
                  {p.part === 1 && recordingCount > 0 && (
                    <span style={{ fontSize: "0.68rem", color: "rgba(168,85,247,0.85)" }}>
                      🎙 {recordingCount} lần ghi âm · phát âm tốt nhất: {bestRecordingScore}%
                    </span>
                  )}
                </div>
              </div>

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
