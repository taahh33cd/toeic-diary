import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Writing — Subskills TOEIC" };

const PARTS = [
  {
    href: "/subskills/writing/part1",
    label: "Part 1",
    labelVi: "Mô tả ảnh",
    description: "5 tầng kỹ năng nền tảng · 5 bộ test mỗi tầng",
    active: true,
  },
  {
    href: "/subskills/writing/part2",
    label: "Part 2",
    labelVi: "Viết e-mail",
    description: "10 tầng kỹ năng xếp theo band điểm · có Tầng 0 cho người mới và Tầng 9 nộp bài giáo viên chấm",
    active: true,
  },
  {
    href: "/subskills/writing/part3",
    label: "Part 3",
    labelVi: "Viết luận",
    description: "14 tầng xếp theo band điểm, mỗi tầng nhắm vào một trục trong thang chấm 0–5 · đang mở Tầng 1–9",
    active: true,
  },
];

export default function WritingHubPage() {
  return (
    <div
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Writing</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          Writing · TOEIC
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          Luyện kỹ năng Writing
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Chọn phần thi để luyện tập từng kỹ năng nền tảng.
        </p>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      <div className="stagger-children animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
        {PARTS.map((part, idx) =>
          part.active ? (
            <Link
              key={part.label}
              href={part.href!}
              className="r-row"
              style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1.3rem 1.6rem", background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", textDecoration: "none", borderBottom: idx < PARTS.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{part.labelVi}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{part.label}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{part.description}</p>
              </div>
              <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0, marginTop: 6 }}>→</span>
            </Link>
          ) : (
            <div key={part.label} style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.3rem 1.6rem", background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", opacity: 0.5, borderBottom: idx < PARTS.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.15rem" }}>
                  <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{part.labelVi}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{part.label}</span>
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px" }}>Coming soon</span>
              </div>
            </div>
          )
        )}
      </div>

      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
      </div>
    </div>
  );
}
