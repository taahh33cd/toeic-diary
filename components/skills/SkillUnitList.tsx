import Link from "next/link";
import type { Skill } from "@/lib/skills/structure";

export function SkillUnitList({ skill }: { skill: Skill }) {
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
        <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{skill.label}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          {skill.emoji} {skill.label}
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          Luyện đề {skill.labelVi} TOEIC
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Chọn phần thi để luyện theo đúng format đề thi chính thức.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Unit list */}
      <div
        className="stagger-children animate-slide-up"
        style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}
      >
        {skill.units.map((unit, idx) => (
          <Link
            key={unit.slug}
            href={`/skills/${skill.slug}/${unit.slug}`}
            className="r-row"
            style={{
              display: "flex", alignItems: "flex-start", gap: "1.25rem",
              padding: "1.3rem 1.6rem",
              background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
              textDecoration: "none",
              borderBottom: idx < skill.units.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{unit.label}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>· {unit.labelVi}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>({unit.labelEn})</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{unit.description}</p>
            </div>
            <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
          </Link>
        ))}
      </div>

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
