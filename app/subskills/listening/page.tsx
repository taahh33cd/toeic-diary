import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { PART2_SETS } from "@/lib/subskills";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Listening — Subskills TOEIC" };

const PARTS = [
  {
    part: 2,
    label: "Part 2 — Câu hỏi ngắn",
    description: "Nghe câu hỏi ngắn, chọn câu trả lời phù hợp nhất (A/B/C). Luyện từ nhóm từ khóa, fill-in, keyword đến freewrite.",
    href: "/subskills/listening/part2",
    active: true,
    detail: "10 nhóm · 4 bài/nhóm · 3 cấp độ",
  },
  {
    part: 3,
    label: "Part 3 & 4 — Hội thoại và bài nói",
    description:
      "Đoán trước dạng câu hỏi để bù cho 3 giây ít ỏi khi thi trên máy, rồi luyện bắt đáp án dù nó luôn được diễn đạt lại.",
    href: "/subskills/listening/part3",
    active: true,
    detail: "5 cấp độ · 4 bài/cấp · dữ liệu từ 10 đề EST 2026",
  },
];

export default async function ListeningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Part 2 stats
  const [easyAttempts, mediumAttempts, hardAttempts] = user
    ? await Promise.all([
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2" },        select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => []),
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2-medium" }, select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => []),
        prisma.subskillAttempt.findMany({ where: { userId: user.id, part: "part2-hard" },   select: { questionWord: true, exerciseIndex: true, score: true, passed: true } }).catch(() => []),
      ])
    : [[], [], []];

  function buildBest(list: typeof easyAttempts) {
    const best: Record<string, { score: number; passed: boolean }> = {};
    for (const a of list) {
      const key = `${a.questionWord}:${a.exerciseIndex}`;
      if (!best[key] || a.score > best[key].score) best[key] = { score: a.score, passed: a.passed };
    }
    return best;
  }

  const easyBest   = buildBest(easyAttempts);
  const mediumBest = buildBest(mediumAttempts);
  const hardBest   = buildBest(hardAttempts);

  const passedSets = PART2_SETS.filter((s) =>
    [0, 1, 2, 3].every((i) => easyBest[`${s.questionWord}:${i}`]?.passed)
  ).length;

  const allKeys = new Set([...Object.keys(easyBest), ...Object.keys(mediumBest), ...Object.keys(hardBest)]);
  const doneExercises  = allKeys.size;
  const totalExercises = PART2_SETS.length * 4 * 3;

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
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Listening</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          🎧 Listening
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          Luyện kỹ năng nghe TOEIC
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Mỗi part được chia thành các bài tập theo cấp độ Easy → Medium → Hard, luyện từng kỹ năng nhỏ trước khi làm đề thật.
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
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: "var(--bg-elevated)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 700 }}>
                  {p.part}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{p.label}</span>
                    <span style={{ fontSize: FS.xs, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>Coming soon</span>
                  </div>
                  <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.description}</p>
                </div>
              </div>
            );
          }

          // Chỉ Part 2 mới có sẵn số liệu tiến độ ở trang này
          const hasDone = p.part === 2 && doneExercises > 0;
          const pct = Math.round((doneExercises / totalExercises) * 100);

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
              {/* Status */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                background: passedSets === PART2_SETS.length && hasDone ? "rgba(34,197,94,0.15)" : hasDone ? "rgba(59,130,246,0.12)" : "var(--bg-elevated)",
                border: `1.5px solid ${passedSets === PART2_SETS.length && hasDone ? "rgba(34,197,94,0.5)" : hasDone ? "rgba(59,130,246,0.4)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: FS.xs, fontWeight: 700,
                color: passedSets === PART2_SETS.length && hasDone ? "rgb(34,197,94)" : hasDone ? "var(--accent-primary)" : "var(--text-muted)",
              }}>
                {passedSets === PART2_SETS.length && hasDone ? "✓" : p.part}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{p.label}</div>
                <p style={{ margin: "0 0 0.5rem", fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: FS.xs, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>
                    {p.detail}
                  </span>
                  {hasDone && (
                    <>
                      <div style={{ flex: "1 1 80px", maxWidth: 100, height: 3, background: "var(--border)", borderRadius: 999 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: passedSets === PART2_SETS.length ? "rgb(34,197,94)" : "var(--accent-primary)", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{doneExercises}/{totalExercises} bài</span>
                      <span style={{ fontSize: FS.xs, color: passedSets > 0 ? "rgb(34,197,94)" : "var(--text-muted)" }}>{passedSets}/{PART2_SETS.length} nhóm pass (Easy)</span>
                    </>
                  )}
                </div>
              </div>

              <span className="r-arrow" style={{ fontSize: FS.sm, color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          );
        })}
      </div>

      <div style={{ width: "100%", marginTop: "auto", paddingTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
