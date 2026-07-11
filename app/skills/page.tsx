import type { Metadata } from "next";
import Link from "next/link";
import { SKILLS } from "@/lib/skills/structure";
import { FAMILY } from "@/lib/skills/exam-theme";

export const metadata: Metadata = { title: "Luyện đề — TOEIC" };

function shortUnits(labels: string[]) {
  return labels.map((l) => l.replace("Questions ", "Q").replace("Question ", "Q").replace("Part ", "P")).join(" · ");
}

export default function SkillsPage() {
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
      {/* Hero banner — navy exam brand */}
      <section
        className="animate-slide-up"
        style={{
          background: `linear-gradient(135deg, ${FAMILY.sw.dark}, ${FAMILY.sw.primary})`,
          borderRadius: "var(--radius-xl, 16px)",
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
          marginBottom: "2rem",
        }}
      >
        <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", marginBottom: "0.6rem", fontWeight: 800, letterSpacing: "0.02em" }}>
          <span style={{ fontSize: "1.05rem" }}>✳</span> TOEIC
          <span style={{ fontWeight: 600, opacity: 0.8, borderLeft: "1px solid rgba(255,255,255,0.35)", paddingLeft: 9, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Luyện đề</span>
        </p>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "0.4rem" }}>
          Luyện đề theo giao diện thi thật
        </h1>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.6, maxWidth: 640 }}>
          Trải nghiệm đúng format &amp; giao diện bài thi TOEIC cho cả 4 kỹ năng Listening · Reading · Speaking · Writing.
          Chọn kỹ năng để bắt đầu.
        </p>
      </section>

      {/* Section divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Chọn kỹ năng luyện đề</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Skill cards — colored by family */}
      <div className="stagger-children animate-slide-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {SKILLS.map((skill) => {
          const fam = FAMILY[skill.family];
          return (
            <Link
              key={skill.slug}
              href={`/skills/${skill.slug}`}
              className="skill-card-link"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                padding: "1.4rem",
                borderRadius: "var(--radius-lg, 12px)",
                background: `linear-gradient(135deg, ${fam.dark}, ${fam.primary})`,
                boxShadow: "var(--shadow-sm)",
                textDecoration: "none",
                overflow: "hidden",
                minHeight: 150,
              }}
            >
              <span style={{ position: "absolute", right: -6, top: -10, fontSize: "3.4rem", opacity: 0.16, color: "#fff" }}>✳</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{skill.emoji}</span>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>{skill.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)" }}>{skill.labelVi}</span>
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, flex: 1 }}>{skill.intro}</div>
              <div style={{ marginTop: "0.7rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.85)", paddingTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.22)", fontVariantNumeric: "tabular-nums" }}>
                {skill.units.length} phần · {shortUnits(skill.units.map((u) => u.label))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
