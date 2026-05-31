import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reading Practice - Part 7" };

const TYPE_CONFIG = [
  {
    type: "single",
    label: "Đoạn đơn",
    labelEn: "Single Passage",
    desc: "1 đoạn văn · 2–4 câu hỏi",
    color: "#0056b3",
    bg: "#e3f2fd",
    icon: "📄",
  },
  {
    type: "double",
    label: "Đoạn đôi",
    labelEn: "Double Passage",
    desc: "2 đoạn văn liên quan · 5 câu hỏi",
    color: "#1a6b2a",
    bg: "#e8f5e9",
    icon: "📑",
  },
  {
    type: "triple",
    label: "Đoạn ba",
    labelEn: "Triple Passage",
    desc: "3 đoạn văn liên quan · 5 câu hỏi",
    color: "#6a1b9a",
    bg: "#f3e5f5",
    icon: "📚",
  },
];

export default async function ReadingPracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const counts = await prisma.readingPassage
    .groupBy({ by: ["type"], _count: { id: true } })
    .catch(() => []);

  const countMap = Object.fromEntries(counts.map((c) => [c.type, c._count.id]));

  const attempted = user
    ? await prisma.readingAttempt
        .groupBy({ by: ["passageId"], where: { userId: user.id } })
        .catch(() => [])
    : [];

  const attemptedIds = new Set(attempted.map((a) => a.passageId));

  // Count attempted per type by joining (simplified: just show total attempted)
  const attemptedCount = attemptedIds.size;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2rem)",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              marginBottom: "1.25rem",
            }}
          >
            ← Trang chủ
          </Link>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Reading Practice
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Luyện đọc hiểu TOEIC Part 7 — {Object.values(countMap).reduce((a, b) => a + b, 0)} bài · {attemptedCount} bài đã làm
          </p>
        </div>

        {/* Type cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
            gap: "1rem",
          }}
        >
          {TYPE_CONFIG.map(({ type, label, labelEn, desc, color, bg, icon }) => {
            const total = countMap[type] ?? 0;
            return (
              <Link
                key={type}
                href={`/reading-practice/${type}`}
                style={{
                  display: "block",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.5rem",
                  textDecoration: "none",
                  boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    marginBottom: "1rem",
                  }}
                >
                  {icon}
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "0.2rem",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.75rem",
                    fontStyle: "italic",
                  }}
                >
                  {labelEn}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                  {desc}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color,
                    background: bg,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {total} bài
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
