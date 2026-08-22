import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, BookOpen } from "lucide-react";
import { TOPIC_METAS } from "@/lib/subskills/translation";

export const metadata: Metadata = { title: "Part 7 — Đọc & Dịch" };

export default function ReadingPart7Page() {
  const topics = TOPIC_METAS.filter((t) => t.part7);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 5vw, 3rem)",
        maxWidth: 900,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <Link
        href="/subskills/reading"
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
        <ArrowLeft size={14} /> Reading Subskills
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
        <BookOpen size={22} style={{ color: "var(--accent-primary)" }} />
        <h1 style={{ fontSize: "1.55rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Part 7 — Đọc & Dịch
        </h1>
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 700, margin: "0 0 1.5rem" }}>
        Đọc lướt nhanh mà vẫn sai Part 7 thường không phải vì thiếu từ vựng, mà vì câu dài bị hiểu lệch. Các nhóm
        dưới đây lấy đúng ngữ liệu kiểu Part 7 — email, thông báo, memo — để chữa từng kiểu hiểu lệch một.
      </p>

      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 1.25rem" }}>
        Toàn bộ nhóm nằm trong khu{" "}
        <Link href="/subskills/translation" style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
          Dịch Anh–Việt
        </Link>
        ; đây là các nhóm gắn trực tiếp với kỹ năng làm Part 7.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {topics.map((topic) => {
          const card = (
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "1.05rem 1.1rem",
                height: "100%",
                boxSizing: "border-box",
                opacity: topic.available ? 1 : 0.55,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.45rem" }}>
                <h2 style={{ fontSize: "0.96rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {topic.name}
                </h2>
                {!topic.available && <Lock size={13} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />}
              </div>
              <p style={{ fontSize: "0.79rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                {topic.problem}
              </p>
              {!topic.available && (
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.55rem 0 0" }}>
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
