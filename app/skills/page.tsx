import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Luyện đề — TOEIC" };

const SKILLS = [
  {
    key: "listening",
    emoji: "🎧",
    label: "Listening",
    labelVi: "Nghe hiểu",
    href: "/skills/listening",
    description: "Part 1–4 · luyện theo đúng format đề thi chính thức.",
  },
  {
    key: "reading",
    emoji: "📖",
    label: "Reading",
    labelVi: "Đọc hiểu",
    href: "/skills/reading",
    description: "Part 5–7 · luyện theo đúng format đề thi chính thức.",
  },
  {
    key: "speaking",
    emoji: "🗣",
    label: "Speaking",
    labelVi: "Nói",
    href: "/skills/speaking",
    description: "11 câu hỏi · luyện theo đúng format đề thi chính thức.",
  },
  {
    key: "writing",
    emoji: "✍️",
    label: "Writing",
    labelVi: "Viết",
    href: "/skills/writing",
    description: "8 câu hỏi · luyện theo đúng format đề thi chính thức.",
  },
];

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
      {/* Hero banner */}
      <section
        className="animate-slide-up"
        style={{
          background: "#1E5F8E",
          borderRadius: "var(--radius-xl, 16px)",
          padding: "clamp(1.5rem, 4vw, 2.5rem)",
          marginBottom: "2rem",
        }}
      >
        <p style={{
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.65)",
          marginBottom: "0.5rem",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}>
          Luyện đề · TOEIC
        </p>
        <h1 style={{
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          marginBottom: "0.4rem",
        }}>
          Luyện đề chính thức 4 kỹ năng 🎯
        </h1>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: 640 }}>
          Bài tập luyện theo đúng format đề thi TOEIC chính thức cho cả 4 kỹ năng
          Listening · Reading · Speaking · Writing. Chọn kỹ năng để bắt đầu.
        </p>
      </section>

      {/* Section divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Chọn kỹ năng luyện đề
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
        {SKILLS.map((skill) => (
          <Link
            key={skill.key}
            href={skill.href}
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
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>{skill.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{skill.labelVi}</span>
                </span>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--accent-primary)" }}>→</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {skill.description}
            </div>
          </Link>
        ))}
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
