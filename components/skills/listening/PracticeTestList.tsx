import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { ListeningPart, PracticeCatalogEntry } from "@/lib/listening-practice/types";

export function PracticeTestList({
  skill,
  unit,
  part,
  tests,
}: {
  skill: Skill;
  unit: SkillUnit;
  part: ListeningPart;
  tests: PracticeCatalogEntry[];
}) {
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

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 1.1rem" }}>
        {tests.length} bộ đề · mỗi bộ {part === 1 ? "6" : "25"} câu. Làm bài như thi thật: chỉ nghe audio
        {part === 1 ? " và xem ảnh" : ""}, không hiện chữ — script &amp; đáp án hiện sau khi nộp bài.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.7rem" }}>
        {tests.map((t) => {
          // Part 1 luôn là câu 1..part1, phần còn lại là Part 2
          const missing = t.missingAudio.filter((n) => (part === 1 ? n <= t.part1 : n > t.part1)).length;
          return (
            <Link
              key={t.slug}
              href={`/skills/${skill.slug}/${unit.slug}/${t.testNumber}`}
              style={{
                display: "block",
                padding: "0.85rem 0.95rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                textDecoration: "none",
                color: "var(--text-primary)",
              }}
            >
              <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>{t.title}</span>
              <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                {part === 1 ? t.part1 : t.part2} câu
                {missing > 0 ? ` · ${missing} câu thiếu audio` : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
