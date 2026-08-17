import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import {
  Q810_CATEGORIES,
  Q810_FREE_PER_CATEGORY,
  SPEAKING_Q810_TESTS,
  getQ810Tests,
} from "@/lib/skills/speaking-q8-10";

const CATEGORY_COLOR: Record<string, string> = {
  conference: "#1e419a",
  class: "#0891b2",
  meeting: "#7c3aed",
  event: "#c2410c",
  travel: "#0d9488",
  interview: "#dc2626",
  resume: "#a16207",
  order: "#4d7c0f",
  mini: "#334155",
};

export function SpeakingQ810TestList({
  skill,
  unit,
  unlocked,
}: {
  skill: Skill;
  unit: SkillUnit;
  /** Đã đăng ký khoá (hoặc HV nội bộ/giáo viên) ⇒ mở hết đề */
  unlocked: boolean;
}) {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 960,
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

      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 0.9rem" }}>
        {SPEAKING_Q810_TESTS.length} bộ đề, chia theo loại bảng thông tin. Mỗi bộ chạy đúng nhịp thi thật:
        45 giây đọc bảng · 3 giây chuẩn bị mỗi câu · trả lời 15 giây (câu 8, 9) và 30 giây (câu 10).
        Bài nói được ghi âm để nghe lại và gửi giáo viên chấm.
      </p>

      {!unlocked && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 1.3rem" }}>
          🔓 {Q810_FREE_PER_CATEGORY} bộ đầu mỗi loại mở cho mọi tài khoản. Các bộ còn lại cần đăng ký khoá học.
        </p>
      )}

      {Q810_CATEGORIES.map(({ id, label, labelEn, hint }) => {
        const tests = getQ810Tests(id);
        if (tests.length === 0) return null;
        const color = CATEGORY_COLOR[id];
        return (
          <section key={id} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {label}{" "}
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({labelEn})</span>
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{tests.length} bộ đề</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.8rem" }}>{hint}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.8rem" }}>
              {tests.map((t) => {
                const locked = !unlocked && !t.free;
                const box: React.CSSProperties = {
                  display: "block",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "var(--text-primary)",
                };
                const body = (
                  <>
                    <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", height: 92, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    </div>
                    <div style={{ padding: "0.7rem 0.85rem" }}>
                      <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        Đề {t.index}{locked ? " 🔒" : ""}
                      </span>
                      <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.35, marginTop: 2 }}>
                        {t.title}
                      </span>
                      {locked && (
                        <span style={{ display: "block", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                          Cần đăng ký khoá
                        </span>
                      )}
                    </div>
                  </>
                );

                // Đề khoá vẫn hiện để thấy có gì phía sau, nhưng không bấm vào được.
                return locked ? (
                  <div key={t.slug} style={{ ...box, opacity: 0.5, cursor: "not-allowed" }}>{body}</div>
                ) : (
                  <Link key={t.slug} href={`/skills/${skill.slug}/${unit.slug}/${t.slug}`} style={box}>
                    {body}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
