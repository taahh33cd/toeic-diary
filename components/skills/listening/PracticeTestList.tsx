import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { PracticeListItem } from "@/lib/listening-practice/types";
import type { TestStat } from "@/lib/journal/attempts";

export function PracticeTestList({
  skill,
  unit,
  sections,
  intro,
  freeNote,
  unlocked,
  freeTests,
  stats,
}: {
  skill: Skill;
  unit: SkillUnit;
  /** Các mục đề (vd "Luyện tập cơ bản", "Luyện tập nâng cao"); một mục không tên = một lưới phẳng */
  sections: { title?: string; tests: PracticeListItem[] }[];
  /** Đoạn giới thiệu số đề/chế độ làm bài phía trên lưới đề */
  intro: React.ReactNode;
  /** Dòng báo đề nào mở miễn phí — chỉ hiện khi chưa mở khoá */
  freeNote: string;
  /** Đã đăng ký khoá (hoặc HV nội bộ/giáo viên) ⇒ mở hết đề */
  unlocked: boolean;
  /** Số đề mở cho mọi tài khoản */
  freeTests: number[];
  /** Lịch sử của học viên theo số đề — rỗng khi chưa đăng nhập */
  stats?: Map<number, TestStat>;
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
        {intro}
      </p>

      {!unlocked && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 1.1rem" }}>
          🔓 {freeNote}
        </p>
      )}

      {sections.map((sec, si) => (
      <section key={sec.title ?? si} style={{ marginBottom: "1.6rem" }}>
      {sec.title && (
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.7rem" }}>
          {sec.title}{" "}
          <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-muted)" }}>· {sec.tests.length} test</span>
        </h2>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.7rem" }}>
        {sec.tests.map((t) => {
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
          const stat = stats?.get(t.testNumber);
          const body = (
            <>
              <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 700 }}>
                {t.title}{locked ? " 🔒" : ""}
              </span>
              <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                {locked ? "Cần đăng ký khoá" : t.detail}
              </span>

              {/* Kết quả của chính học viên: lần gần nhất, số lần, bài còn dở */}
              {!locked && stat && stat.attempts > 0 && (
                // Cố ý không tô màu theo điểm: thẻ đề đổi nền theo chế độ sáng/tối
                // nên mọi màu đặt cứng đều chìm ở một trong hai chế độ.
                <span style={{ display: "block", fontSize: "0.72rem", marginTop: 5, color: "var(--text-secondary)" }}>
                  Lần gần nhất{" "}
                  <b style={{ color: "var(--text-primary)" }}>
                    {stat.latestCorrect}/{stat.latestGradable}
                  </b>
                  <span style={{ color: "var(--text-muted)" }}>
                    {" · "}{stat.attempts} lần
                  </span>
                </span>
              )}
              {!locked && stat?.unfinished && (
                <span style={{ display: "block", fontSize: "0.72rem", marginTop: 3, fontWeight: 600, color: "var(--accent-primary)" }}>
                  ⏸ Đang làm dở — làm tiếp
                </span>
              )}
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
      </section>
      ))}
    </div>
  );
}
