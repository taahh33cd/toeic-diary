import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, Languages, Layers, ChevronRight } from "lucide-react";
import { TOPIC_METAS } from "@/lib/subskills/translation";

export const metadata: Metadata = { title: "Dịch Anh–Việt — Subskills" };

export default function TranslationHubPage() {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 5vw, 3rem)",
        maxWidth: 1100,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <Link
        href="/subskills"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          textDecoration: "none",
          marginBottom: "1.25rem",
        }}
      >
        <ArrowLeft size={14} /> Subskills
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
        <Languages size={22} style={{ color: "var(--accent-primary)" }} />
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Dịch Anh–Việt
        </h1>
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 720, margin: "0 0 2rem" }}>
        Hiểu tiếng Anh không đồng nghĩa với dịch được. Mỗi nhóm dưới đây chữa một phản xạ hỏng cụ thể, đi từ nhận
        diện đến tự dịch cả đoạn — và cùng lúc luyện đúng kỹ năng đọc mà Part 7 đo.
      </p>

      <Link
        href="/subskills/translation/on-tap"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.8rem 1rem",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        <Layers size={17} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Ôn từ chưa thuộc
          </span>
          <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
            Gom mọi từ bạn đánh dấu chưa thuộc hoặc từng trả lời sai, ở tất cả các nhóm
          </span>
        </span>
        <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {TOPIC_METAS.map((topic, i) => {
          const card = (
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "1.1rem 1.15rem",
                height: "100%",
                boxSizing: "border-box",
                opacity: topic.available ? 1 : 0.55,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: "var(--bg-secondary)",
                    color: "var(--text-muted)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <h2 style={{ fontSize: "0.98rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {topic.name}
                </h2>
                {topic.part7 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(1,62,55,0.08)",
                      color: "var(--accent-primary)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Part 7
                  </span>
                )}
                {!topic.available && <Lock size={13} style={{ color: "var(--text-muted)", marginLeft: topic.part7 ? 0 : "auto" }} />}
              </div>

              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
                {topic.problem}
              </p>

              <div
                style={{
                  marginTop: "auto",
                  padding: "0.6rem 0.7rem",
                  borderRadius: 8,
                  background: "var(--bg-secondary)",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontStyle: "italic", marginBottom: "0.3rem" }}>
                  {topic.sample.en}
                </div>
                <div style={{ color: "#b91c1c" }}>✗ {topic.sample.wrong}</div>
                <div style={{ color: "#15803d" }}>✓ {topic.sample.right}</div>
              </div>

              {!topic.available && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.6rem 0 0" }}>
                  Đang soạn nội dung
                </p>
              )}
            </div>
          );

          return topic.available ? (
            <Link key={topic.slug} href={`/subskills/translation/${topic.slug}`} style={{ textDecoration: "none" }}>
              {card}
            </Link>
          ) : (
            <div key={topic.slug}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
