import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { SKILLS } from "@/lib/skills/structure";
import { WRITING_Q1_5, Q15_PART_KEY } from "@/lib/skills/writing-q1-5";

export const metadata: Metadata = { title: "Luyện đề — TOEIC" };

// Palette riêng cho khu Luyện đề: sáng, trung tính + accent indigo
const C = {
  bg: "#f6f6fb",
  ink: "#201d33",
  muted: "#6b6880",
  card: "#ffffff",
  border: "#e7e6f0",
  accent: "#4f46e5",
  accentSoft: "#eef0fe",
};

function shortUnits(labels: string[]) {
  return labels.map((l) => l.replace("Questions ", "Q").replace("Question ", "Q").replace("Part ", "P")).join(" · ");
}

export default async function SkillsLanding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const writingAttempts = user
    ? await prisma.subskillAttempt
        .findMany({ where: { userId: user.id, part: Q15_PART_KEY }, select: { questionWord: true, score: true } })
        .catch(() => [])
    : [];
  const wBest: Record<string, number> = {};
  for (const a of writingAttempts) {
    if (wBest[a.questionWord] == null || a.score > wBest[a.questionWord]) wBest[a.questionWord] = a.score;
  }
  const writingDone = Object.keys(wBest).length;
  const writingAvg = writingDone ? Math.round(Object.values(wBest).reduce((s, v) => s + v, 0) / writingDone) : 0;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: C.bg, color: C.ink, padding: "clamp(1.75rem, 5vw, 3.5rem) clamp(1.25rem, 5vw, 2rem)" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Hero */}
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent, margin: "0 0 0.6rem" }}>
          TOEIC · Luyện đề
        </p>
        <h1 style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 0.6rem" }}>
          Luyện đề 4 kỹ năng
        </h1>
        <p style={{ fontSize: "1rem", color: C.muted, lineHeight: 1.6, maxWidth: "52ch", margin: 0 }}>
          Luyện theo đúng format &amp; giao diện bài thi TOEIC — Listening, Reading, Speaking, Writing.
        </p>

        {/* Dòng tiến độ nhỏ */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: "1.1rem", padding: "8px 14px", background: C.accentSoft, border: `1px solid ${C.border}`, borderRadius: 999, fontSize: "0.84rem", color: C.ink }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
          {writingDone > 0
            ? <span>Đã làm <strong>{writingDone}</strong> câu · Writing TB <strong>{writingAvg}%</strong></span>
            : <span>Chưa bắt đầu — chọn một kỹ năng bên dưới để luyện.</span>}
        </div>

        {/* 4 thẻ kỹ năng — minimal */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.9rem", marginTop: "2rem" }}>
          {SKILLS.map((skill) => {
            const isWriting = skill.slug === "writing";
            return (
              <Link
                key={skill.slug}
                href={`/skills/${skill.slug}`}
                className="skill-card-link"
                style={{ display: "flex", flexDirection: "column", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.3rem", textDecoration: "none", color: C.ink, transition: "border-color .15s, box-shadow .15s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.7rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{skill.emoji}</span>
                  <span>
                    <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700 }}>{skill.label}</span>
                    <span style={{ display: "block", fontSize: "0.76rem", color: C.muted }}>{skill.labelVi}</span>
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.5, margin: "0 0 0.9rem", flex: 1 }}>{skill.intro}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, paddingTop: "0.8rem" }}>
                  <span style={{ fontSize: "0.72rem", color: C.muted }}>
                    {isWriting && writingDone > 0 ? `Đã làm ${writingDone}/${WRITING_Q1_5.length}` : shortUnits(skill.units.map((u) => u.label))}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.accent }}>→</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Full test — thi thử trọn đề 200 câu, tách riêng khỏi 4 thẻ kỹ năng */}
        <Link
          href="/skills/full-tests"
          className="skill-card-link"
          style={{ display: "flex", alignItems: "center", gap: "1.1rem", marginTop: "0.9rem", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "1.3rem", textDecoration: "none", color: C.ink, transition: "border-color .15s, box-shadow .15s" }}
        >
          <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>🎯</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "1.05rem", fontWeight: 700 }}>Full Test</span>
            <span style={{ display: "block", fontSize: "0.76rem", color: C.muted, marginBottom: "0.4rem" }}>Thi thử trọn đề</span>
            <span style={{ display: "block", fontSize: "0.82rem", color: C.muted, lineHeight: 1.5 }}>
              200 câu Listening &amp; Reading, bấm giờ như thi thật — hoặc chọn riêng từng part để luyện.
            </span>
          </span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.accent, flexShrink: 0 }}>→</span>
        </Link>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "0.7rem", letterSpacing: "0.1em", color: C.muted, marginTop: "3rem" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
