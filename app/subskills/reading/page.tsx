import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";

export const metadata: Metadata = { title: "Reading Subskills — TOEIC" };

const PARTS = [
  {
    part: "Part 5",
    slug: "part5",
    title: "Ngữ pháp — 12 Thì",
    description: "Luyện từng thì tiếng Anh từ nhận diện, dấu hiệu, kết nối tiếng Việt đến bài thi TOEIC thật.",
    available: true,
    totalTenses: 12,
  },
  {
    part: "Part 5 & 6",
    slug: "connectors",
    title: "Liên từ & Từ nối",
    description: "Phân biệt liên từ / giới từ / trạng từ liên kết theo 10 nhóm quan hệ logic — bẫy hay gặp nhất của ETS.",
    available: true,
    totalTenses: 10,
  },
  {
    part: "Part 7",
    slug: "part7",
    title: "Đọc & Dịch",
    description: "Chữa từng kiểu hiểu lệch khi đọc câu dài — cụm danh từ, từ đa nghĩa, tham chiếu, hàm ý.",
    available: true,
    totalTenses: 7,
  },
];

export default function ReadingSubskillsPage() {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 1100,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <Link
        href="/subskills"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        <ArrowLeft size={13} /> Subskills
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <BookOpen size={20} style={{ color: "var(--accent-primary)" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Reading Subskills
          </h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Luyện từng kỹ năng Reading theo từng Part — chọn Part để bắt đầu.
        </p>
      </div>

      {/* Part cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        {PARTS.map((p) => {
          if (!p.available || !p.slug) {
            return (
              <div
                key={p.part}
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius-lg, 12px)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  opacity: 0.55,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Layers size={16} style={{ color: "var(--text-muted)" }} />
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {p.part}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                  {p.title}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  {p.description}
                </div>
                <span style={{
                  display: "inline-block",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "2px 8px",
                }}>
                  Coming soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={p.part}
              href={`/subskills/reading/${p.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.5rem",
                borderRadius: "var(--radius-lg, 12px)",
                border: "1.5px solid var(--accent-primary)",
                background: "var(--bg-elevated)",
                boxShadow: "var(--shadow-sm)",
                textDecoration: "none",
                transition: "box-shadow 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Layers size={16} style={{ color: "var(--accent-primary)" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent-primary)" }}>
                  {p.part}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
                {p.title}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.5, flex: 1 }}>
                {p.description}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  {p.totalTenses} chủ điểm
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: 600 }}>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
