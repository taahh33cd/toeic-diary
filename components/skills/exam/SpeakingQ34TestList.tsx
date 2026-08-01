import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { Q34_LEVELS, SPEAKING_Q34_TESTS, getQ34Tests } from "@/lib/skills/speaking-q3-4";

const LEVEL_COLOR: Record<string, string> = {
  easy: "#16a34a",
  medium: "#d97706",
  hard: "#dc2626",
};

export function SpeakingQ34TestList({ skill, unit }: { skill: Skill; unit: SkillUnit }) {
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
          {unit.labelVi}{" "}
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({unit.labelEn})</span>
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {unit.description}
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 1.4rem" }}>
        {SPEAKING_Q34_TESTS.length} bộ đề · mỗi bộ 2 ảnh như thi thật (45 giây chuẩn bị, 30 giây trả lời cho mỗi ảnh).
        Chọn mức độ phù hợp rồi làm lần lượt — bài nói mẫu hiện sau khi bạn trả lời xong.
      </p>

      {Q34_LEVELS.map(({ level, label, labelEn, hint }) => {
        const tests = getQ34Tests(level);
        const color = LEVEL_COLOR[level];
        return (
          <section key={level} style={{ marginBottom: "1.8rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {label}{" "}
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({labelEn})</span>
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{tests.length} bộ đề</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.75rem" }}>{hint}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.7rem" }}>
              {tests.map((t) => (
                <Link
                  key={t.slug}
                  href={`/skills/${skill.slug}/${unit.slug}/${t.slug}`}
                  style={{
                    display: "block",
                    padding: "0.85rem 0.95rem",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 10,
                    textDecoration: "none",
                    color: "var(--text-primary)",
                  }}
                >
                  <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>Đề {t.index}</span>
                  <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {t.items.length} ảnh
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
