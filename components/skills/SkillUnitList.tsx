import Link from "next/link";
import type { Skill } from "@/lib/skills/structure";
import { FAMILY } from "@/lib/skills/exam-theme";

// Các unit đã có khung màn thi (đề mẫu) — mở được ngay
const READY = new Set(["listening/part2", "reading/part5", "speaking/q3-4", "writing/q1-5"]);

export function SkillUnitList({ skill }: { skill: Skill }) {
  const fam = FAMILY[skill.family];

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{skill.label}</span>
      </div>

      {/* Hero — family color */}
      <div style={{ background: `linear-gradient(135deg, ${fam.dark}, ${fam.primary})`, borderRadius: "var(--radius-lg)", padding: "clamp(1.1rem, 3vw, 1.5rem)", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", right: -4, top: -10, fontSize: "3.6rem", opacity: 0.16, color: "#fff" }}>✳</span>
        <p style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.72rem", color: "rgba(255,255,255,0.85)", fontWeight: 800, margin: "0 0 0.35rem", letterSpacing: "0.02em" }}>
          <span style={{ fontSize: "0.95rem" }}>✳</span> TOEIC
          <span style={{ fontWeight: 600, opacity: 0.8, borderLeft: "1px solid rgba(255,255,255,0.35)", paddingLeft: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{skill.label}</span>
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.35rem" }}>
          Luyện đề {skill.labelVi}
        </h1>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
          Chọn phần thi để luyện theo đúng giao diện đề thi chính thức.
        </p>
      </div>

      {/* Unit list */}
      <div className="stagger-children animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
        {skill.units.map((unit, idx) => {
          const ready = READY.has(`${skill.slug}/${unit.slug}`);
          return (
            <Link
              key={unit.slug}
              href={`/skills/${skill.slug}/${unit.slug}`}
              className="r-row"
              style={{
                display: "flex", alignItems: "flex-start", gap: "1.25rem",
                padding: "1.2rem 1.5rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < skill.units.length - 1 ? "1px solid var(--border)" : "none",
                borderLeft: `3px solid ${ready ? fam.primary : "transparent"}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{unit.label}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>· {unit.labelVi}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>({unit.labelEn})</span>
                  {ready && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: fam.primary, borderRadius: 4, padding: "2px 7px" }}>Đề mẫu</span>
                  )}
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{unit.description}</p>
              </div>
              <span className="r-arrow" style={{ fontSize: "0.8rem", color: fam.primary, flexShrink: 0, marginTop: 6 }}>→</span>
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
