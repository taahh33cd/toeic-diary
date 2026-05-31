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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profile, counts, attempted, allAttempts] = await Promise.all([
    user
      ? prisma.profile.findUnique({
          where: { id: user.id },
          select: { displayName: true },
        })
      : Promise.resolve(null),
    prisma.readingPassage
      .groupBy({ by: ["type"], _count: { id: true } })
      .catch(() => []),
    user
      ? prisma.readingAttempt
          .findMany({
            where: { userId: user.id },
            select: { passageId: true },
            distinct: ["passageId"],
          })
          .catch(() => [])
      : Promise.resolve([]),
    user
      ? prisma.readingAttempt
          .findMany({
            where: { userId: user.id },
            select: { completedAt: true },
            orderBy: { completedAt: "desc" },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.type, c._count.id]));
  const doneIds  = new Set(attempted.map((a) => a.passageId));
  const totalAll = Object.values(countMap).reduce((a, b) => a + b, 0);

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

  const displayName =
    profile?.displayName ?? user?.email?.split("@")[0] ?? "bạn";
  const completedCount = doneIds.size;
  const streak = calcReadingStreak(allAttempts.map((a) => a.completedAt));

  return (
    <div
      className="page-enter"
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
      {/* Welcome card */}
      <div
        className="animate-slide-up"
        style={{
          width: "100%",
          background: "#6B4C2A",
          borderRadius: 14,
          padding: "24px 32px",
          marginBottom: "2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 4px 16px rgba(107,76,42,0.18)",
        }}
      >
        {/* Left: greeting */}
        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,253,246,0.60)",
            }}
          >
            READING PRACTICE · TOEIC PART 7
          </p>
          <h2
            style={{
              fontFamily: "var(--font-reading-display)",
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              fontWeight: 700,
              color: "#FFFDF6",
              margin: "0 0 4px",
              lineHeight: 1.25,
            }}
          >
            Xin chào, {displayName}! 👋
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "rgba(255,253,246,0.68)",
              lineHeight: 1.5,
            }}
          >
            Luyện đọc hiểu mỗi ngày — nền tảng vững chắc cho điểm TOEIC.
          </p>
        </div>

        {/* Right: stats — horizontal chips like dictation homepage */}
        <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
          {[
            { label: "NGÀY STREAK",    value: `${streak} ngày`,              icon: "🔥" },
            { label: "BÀI HOÀN THÀNH", value: `${completedCount} bài`,       icon: null },
            { label: "TỔNG BÀI",       value: `${totalAll.toLocaleString()}`, icon: null },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,253,246,0.13)",
                border: "1px solid rgba(255,253,246,0.2)",
                borderRadius: 10,
                padding: "14px 22px",
                minWidth: 110,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon && (
                <div style={{ fontSize: "1rem", marginBottom: 4 }}>{icon}</div>
              )}
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#FFFDF6",
                  lineHeight: 1,
                  marginBottom: 5,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "0.08em",
                  color: "rgba(255,253,246,0.55)",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative top rule */}
      <div style={{ width: "100%", marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            TOEIC Part 7
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
      </div>

      {/* Type cards */}
      <div
        className="stagger-children animate-slide-up"
        style={{
          width: "100%",
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
          const done  = doneCountByType[type] ?? 0;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <Link
              key={type}
              href={`/reading-practice/${type}`}
              className="r-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1.4rem 1.6rem",
                background:
                  idx % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                textDecoration: "none",
                borderBottom:
                  idx < TYPES.length - 1 ? "1px solid var(--border)" : "none",
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    marginBottom: "0.2rem",
                  }}
                >
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
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    {sub}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: done > 0 ? "0.6rem" : 0,
                  }}
                >
                  {desc}
                </p>

                {done > 0 && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
                  >
                    <div
                      style={{
                        flex: 1,
                        maxWidth: 140,
                        height: 3,
                        background: "var(--border)",
                        borderRadius: 999,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--accent-primary)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      {done}/{total}
                    </span>
                  </div>
                )}
              </div>

              {/* Count badge + arrow */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.4rem",
                  flexShrink: 0,
                }}
              >
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
                <span className="r-arrow" style={{ fontSize: "0.8rem", color: "var(--accent-primary)" }}>
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom rule */}
      <div style={{ width: "100%", marginTop: "3rem" }}>
        <div style={{ height: 1, background: "var(--border)" }} />
        <p
          style={{
            marginTop: "0.75rem",
            textAlign: "center",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
          }}
        >
          TOEIC DICTATION DIARY
        </p>
      </div>
    </div>
  );
}

function calcReadingStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const daySet = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  const days   = Array.from(daySet).sort().reverse();
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round(
      (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86_400_000
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
