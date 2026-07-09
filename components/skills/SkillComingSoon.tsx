import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";

export function SkillComingSoon({ skill, unit }: { skill: Skill; unit: SkillUnit }) {
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
        <Link href={`/skills/${skill.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{skill.label}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{unit.label}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          {skill.emoji} {skill.label} · {unit.label}
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
          {unit.labelVi} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({unit.labelEn})</span>
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {unit.description}
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* Coming soon panel */}
      <div
        className="animate-slide-up"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "0.75rem",
          padding: "clamp(2.5rem, 8vw, 4rem) 1.5rem",
          border: "1px dashed var(--border)",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-secondary)",
        }}
      >
        <span style={{ fontSize: "2.5rem" }}>🚧</span>
        <span style={{
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "2px 8px",
        }}>
          Đang phát triển
        </span>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 420 }}>
          Bài tập luyện <strong>{skill.label} {unit.label}</strong> sẽ sớm có mặt. Cảm ơn bạn đã kiên nhẫn chờ đợi!
        </p>
        <Link
          href={`/skills/${skill.slug}`}
          style={{
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--accent-primary)",
            textDecoration: "none",
          }}
        >
          ← Quay lại {skill.label}
        </Link>
      </div>

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
