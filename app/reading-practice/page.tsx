import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reading Practice" };

const TYPES = [
  {
    type: "single",
    roman: "I",
    label: "Đoạn đơn",
    sub: "Single Passage",
    desc: "Một đoạn văn ngắn, 2–4 câu hỏi. Luyện kỹ năng đọc nhanh và xác định thông tin.",
  },
  {
    type: "double",
    roman: "II",
    label: "Đoạn đôi",
    sub: "Double Passage",
    desc: "Hai đoạn văn liên quan, 5 câu hỏi. Yêu cầu đối chiếu thông tin giữa hai nguồn.",
  },
  {
    type: "triple",
    roman: "III",
    label: "Đoạn ba",
    sub: "Triple Passage",
    desc: "Ba đoạn văn liên quan, 5 câu hỏi. Dạng khó nhất — yêu cầu tổng hợp thông tin.",
  },
] as const;

export default async function ReadingPracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const counts = await prisma.readingPassage
    .groupBy({ by: ["type"], _count: { id: true } })
    .catch(() => []);
  const countMap = Object.fromEntries(counts.map((c) => [c.type, c._count.id]));

  const attempted = user
    ? await prisma.readingAttempt
        .findMany({ where: { userId: user.id }, select: { passageId: true }, distinct: ["passageId"] })
        .catch(() => [])
    : [];
  const doneIds = new Set(attempted.map((a) => a.passageId));

  const doneByType = user
    ? await prisma.readingAttempt
        .findMany({
          where: { userId: user.id },
          select: { passage: { select: { type: true } } },
          distinct: ["passageId"],
        })
        .catch(() => [])
    : [];
  const doneCountByType: Record<string, number> = {};
  for (const a of doneByType) {
    const t = a.passage.type;
    doneCountByType[t] = (doneCountByType[t] ?? 0) + 1;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(2.5rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)",
      }}
    >
      {/* Decorative top rule */}
      <div style={{ width: "100%", maxWidth: 640, marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            TOEIC Part 7
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
      </div>

      {/* Title block */}
      <div style={{ textAlign: "center", marginBottom: "3.5rem", maxWidth: 560 }}>
        <h1
          style={{
            fontFamily: "var(--font-reading-display)",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            marginBottom: "0.75rem",
          }}
        >
          Reading Practice
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            lineHeight: 1.7,
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          Luyện đọc hiểu theo từng dạng bài — từ đoạn đơn đến ba đoạn liên kết.
        </p>

        {doneIds.size > 0 && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 500 }}>
            {doneIds.size} / {Object.values(countMap).reduce((a, b) => a + b, 0)} bài đã hoàn thành
          </p>
        )}
      </div>

      {/* Type cards */}
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {TYPES.map(({ type, roman, label, sub, desc }, idx) => {
          const total = countMap[type] ?? 0;
          const done = doneCountByType[type] ?? 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <Link
              key={type}
              href={`/reading-practice/${type}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.4rem 1.6rem",
                background: idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom: idx < TYPES.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}
            >
              {/* Roman numeral */}
              <div
                style={{
                  fontFamily: "var(--font-reading-display)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--border)",
                  lineHeight: 1,
                  minWidth: 28,
                  paddingTop: 2,
                  userSelect: "none",
                }}
              >
                {roman}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-reading-display)",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    {sub}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: done > 0 ? "0.6rem" : 0 }}>
                  {desc}
                </p>

                {done > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ flex: 1, maxWidth: 140, height: 3, background: "var(--border)", borderRadius: 999 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--accent-primary)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {done}/{total}
                    </span>
                  </div>
                )}
              </div>

              {/* Count badge + arrow */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    padding: "2px 8px",
                    borderRadius: 3,
                    letterSpacing: "0.03em",
                  }}
                >
                  {total} bài
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)" }}>→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom rule */}
      <div style={{ width: "100%", maxWidth: 640, marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}
