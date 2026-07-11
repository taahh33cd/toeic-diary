import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { SKILLS } from "@/lib/skills/structure";
import { DASH, SKILL_ACCENT } from "@/lib/skills/dashboard-theme";
import { WRITING_Q1_5, Q15_PART_KEY, Q15_TEST_SIZE } from "@/lib/skills/writing-q1-5";
import { READING_PART5, LISTENING_PART2, SPEAKING_Q3_4 } from "@/lib/skills/sample";

export const metadata: Metadata = { title: "Luyện đề — Bảng điều khiển" };

// Tổng số câu (đề mẫu) mỗi kỹ năng — để tính vòng tiến độ
const SKILL_TOTAL: Record<string, number> = {
  listening: LISTENING_PART2.length,
  reading: READING_PART5.length,
  speaking: SPEAKING_Q3_4.length,
  writing: WRITING_Q1_5.length,
};

function Ring({ pct, color, size = 84, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={DASH.border} strokeWidth={stroke} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cx})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={DASH.text} style={{ fontFamily: DASH.mono, fontSize: size * 0.26, fontWeight: 700 }}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default async function SkillsDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, writingAttempts] = await Promise.all([
    user ? prisma.profile.findUnique({ where: { id: user.id }, select: { displayName: true } }).catch(() => null) : Promise.resolve(null),
    user ? prisma.subskillAttempt.findMany({ where: { userId: user.id, part: Q15_PART_KEY }, select: { questionWord: true, score: true, passed: true } }).catch(() => []) : Promise.resolve([]),
  ]);

  const displayName = profile?.displayName ?? user?.email?.split("@")[0] ?? "bạn";

  // Best score mỗi câu Writing
  const wBest: Record<string, number> = {};
  for (const a of writingAttempts) {
    if (wBest[a.questionWord] == null || a.score > wBest[a.questionWord]) wBest[a.questionWord] = a.score;
  }
  const writingDone = Object.keys(wBest).length;
  const writingAvg = writingDone ? Math.round(Object.values(wBest).reduce((s, v) => s + v, 0) / writingDone) : 0;

  // Số test Writing đã hoàn thành (mỗi test 5 câu)
  let writingTestsDone = 0;
  const totalTests = Math.ceil(WRITING_Q1_5.length / Q15_TEST_SIZE);
  for (let t = 0; t < totalTests; t++) {
    const ids = WRITING_Q1_5.slice(t * Q15_TEST_SIZE, (t + 1) * Q15_TEST_SIZE).map((e) => e.id);
    if (ids.every((id) => wBest[id] != null)) writingTestsDone++;
  }

  // Tiến độ mỗi kỹ năng (hiện chỉ Writing có dữ liệu lưu)
  const perSkill = SKILLS.map((s) => {
    const total = SKILL_TOTAL[s.slug] ?? 0;
    const done = s.slug === "writing" ? writingDone : 0;
    const avg = s.slug === "writing" ? writingAvg : null;
    return { skill: s, total, done, avg, pct: total ? (done / total) * 100 : 0 };
  });

  const totalDone = writingDone;
  const avgAll = writingAvg;
  const skillsStarted = perSkill.filter((p) => p.done > 0).length;

  // Gợi ý "làm tiếp"
  const rec =
    writingDone === 0
      ? { label: "Bắt đầu với Writing", sub: "Viết câu mô tả ảnh — có AI chấm ngay", href: "/skills/writing/q1-5", accent: SKILL_ACCENT.writing }
      : writingDone < WRITING_Q1_5.length
      ? { label: `Tiếp tục Writing · Test ${writingTestsDone + 1}`, sub: `Đã hoàn thành ${writingTestsDone}/${totalTests} test`, href: "/skills/writing/q1-5", accent: SKILL_ACCENT.writing }
      : { label: "Thử kỹ năng khác", sub: "Bạn đã hoàn thành toàn bộ Writing Q1-5 👏", href: "/skills/listening/part2", accent: SKILL_ACCENT.listening };

  const stats = [
    { label: "Câu đã làm", value: String(totalDone) },
    { label: "Điểm TB", value: totalDone ? `${avgAll}%` : "—" },
    { label: "Test hoàn thành", value: String(writingTestsDone) },
    { label: "Kỹ năng đã thử", value: `${skillsStarted}/4` },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: DASH.bg, color: DASH.text, fontFamily: DASH.sans, padding: "clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* Overview */}
        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "1.25rem" }}>
            <div>
              <p style={{ fontFamily: DASH.mono, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: DASH.faint, margin: "0 0 0.6rem" }}>
                Bảng điều khiển luyện đề
              </p>
              <h1 style={{ fontFamily: DASH.display, fontWeight: 800, fontSize: "clamp(1.8rem, 4.5vw, 2.9rem)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0 }}>
                Chào {displayName}.
              </h1>
              <p style={{ color: DASH.muted, fontSize: "1rem", margin: "0.6rem 0 0", maxWidth: "54ch", lineHeight: 1.6 }}>
                Trung tâm luyện đề TOEIC theo giao diện thi thật cho 4 kỹ năng. Theo dõi tiến độ và tiếp tục nơi bạn dừng lại.
              </p>
            </div>
          </div>

          {/* Stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.85rem" }}>
            {stats.map((s) => (
              <div key={s.label} style={{ background: DASH.panel, border: `1px solid ${DASH.border}`, borderRadius: 14, padding: "1.1rem 1.2rem" }}>
                <div style={{ fontFamily: DASH.mono, fontSize: "1.9rem", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: DASH.muted, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Continue strip */}
        <Link href={rec.href} style={{ display: "flex", alignItems: "center", gap: "1rem", background: `linear-gradient(90deg, ${DASH.panel2}, ${DASH.panel})`, border: `1px solid ${DASH.border}`, borderLeft: `3px solid ${rec.accent}`, borderRadius: 14, padding: "1rem 1.25rem", textDecoration: "none", color: DASH.text, marginBottom: "1.75rem" }}>
          <span style={{ fontFamily: DASH.mono, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: rec.accent, fontWeight: 700, flexShrink: 0 }}>▸ Làm tiếp</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>{rec.label}</div>
            <div style={{ fontSize: "0.82rem", color: DASH.muted, marginTop: 2 }}>{rec.sub}</div>
          </div>
          <span style={{ color: rec.accent, fontSize: "1.2rem", flexShrink: 0 }}>→</span>
        </Link>

        {/* Section label */}
        <p style={{ fontFamily: DASH.mono, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: DASH.faint, margin: "0 0 0.9rem" }}>
          4 kỹ năng
        </p>

        {/* Skill cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))", gap: "1rem" }}>
          {perSkill.map(({ skill, total, done, avg, pct }) => {
            const accent = SKILL_ACCENT[skill.slug];
            return (
              <Link key={skill.slug} href={`/skills/${skill.slug}`} style={{ display: "flex", flexDirection: "column", gap: "1rem", background: DASH.panel, border: `1px solid ${DASH.border}`, borderRadius: 16, padding: "1.35rem", textDecoration: "none", color: DASH.text, position: "relative", overflow: "hidden" }}>
                <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, opacity: 0.85 }} />
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Ring pct={pct} color={accent} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: DASH.display, fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.01em" }}>{skill.label}</div>
                    <div style={{ fontSize: "0.8rem", color: DASH.muted }}>{skill.labelVi}</div>
                    <div style={{ fontFamily: DASH.mono, fontSize: "0.76rem", color: DASH.faint, marginTop: 6 }}>
                      {done}/{total} câu{avg != null && done > 0 ? ` · TB ${avg}%` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${DASH.borderSoft}`, paddingTop: "0.85rem" }}>
                  <span style={{ fontSize: "0.72rem", color: DASH.muted, fontFamily: DASH.mono }}>
                    {skill.units.map((u) => u.label.replace("Questions ", "Q").replace("Question ", "Q").replace("Part ", "P")).join(" · ")}
                  </span>
                  <span style={{ color: accent, fontSize: "0.85rem", fontWeight: 700 }}>{done > 0 ? "Tiếp tục →" : "Bắt đầu →"}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontFamily: DASH.mono, fontSize: "0.68rem", letterSpacing: "0.14em", color: DASH.faint, marginTop: "2.5rem" }}>
          TOEIC DICTATION DIARY · LUYỆN ĐỀ
        </p>
      </div>
    </div>
  );
}
