import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { ListeningPart, PracticeCatalogEntry } from "@/lib/listening-practice/types";

export function PracticeTestList({
  skill,
  unit,
  part,
  tests,
  unlocked,
  freeTests,
}: {
  skill: Skill;
  unit: SkillUnit;
  part: ListeningPart;
  tests: PracticeCatalogEntry[];
  /** Đã đăng ký khoá (hoặc HV nội bộ/giáo viên) ⇒ mở hết đề */
  unlocked: boolean;
  /** Số đề mở cho mọi tài khoản */
  freeTests: number[];
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
        {tests.length} bộ đề · mỗi bộ {part === 1 ? "6" : "25"} câu. Mỗi bộ chọn được hai chế độ:{" "}
        <strong>Thi thử</strong> (audio chạy liền một mạch, không tua) hoặc <strong>Luyện tập</strong>{" "}
        (nghe lại, đổi tốc độ, không bấm giờ). Script &amp; đáp án hiện sau khi nộp bài.
      </p>

      {!unlocked && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 1.1rem" }}>
          🔓 Đề {freeTests.join(" và ")} mở cho mọi tài khoản. Các đề còn lại cần đăng ký khoá học.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.7rem" }}>
        {tests.map((t) => {
          // Part 1 luôn là câu 1..part1, phần còn lại là Part 2
          const missing = t.missingAudio.filter((n) => (part === 1 ? n <= t.part1 : n > t.part1)).length;
          const locked = !unlocked && !freeTests.includes(t.testNumber);
          const box: React.CSSProperties = {
            display: "block",
            padding: "0.85rem 0.95rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            textDecoration: "none",
            color: "var(--text-primary)",
          };
          const body = (
            <>
              <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>
                {t.title}{locked ? " 🔒" : ""}
              </span>
              <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                {locked ? "Cần đăng ký khoá" : `${part === 1 ? t.part1 : t.part2} câu`}
                {!locked && missing > 0 ? ` · ${missing} câu thiếu audio` : ""}
              </span>
            </>
          );

          // Đề khoá vẫn hiện để thấy có gì phía sau, nhưng không bấm vào được.
          return locked ? (
            <div key={t.slug} style={{ ...box, opacity: 0.5, cursor: "not-allowed" }}>{body}</div>
          ) : (
            <Link key={t.slug} href={`/skills/${skill.slug}/${unit.slug}/${t.testNumber}`} style={box}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
