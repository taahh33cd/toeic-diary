import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tiến độ Reading — Reading Practice" };

const TYPE_LABEL: Record<string, string> = {
  single: "Đoạn đơn",
  double: "Đoạn đôi",
  triple: "Đoạn ba",
};

export default async function ReadingProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [attempts, passages] = await Promise.all([
    prisma.readingAttempt.findMany({
      where: { userId: user.id },
      select: {
        passageId: true,
        score: true,
        completedAt: true,
        durationSeconds: true,
        passage: { select: { type: true, orderIndex: true, category: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.readingPassage.findMany({
      select: { id: true, type: true },
    }),
  ]);

  // Best score per passage
  const bestScore: Record<string, number> = {};
  for (const a of attempts) {
    if (bestScore[a.passageId] == null || a.score > bestScore[a.passageId]) {
      bestScore[a.passageId] = a.score;
    }
  }

  // Total passages per type
  const totalByType: Record<string, number> = {};
  for (const p of passages) {
    totalByType[p.type] = (totalByType[p.type] ?? 0) + 1;
  }

  // Completed (attempted) per type
  const donePassages = Object.keys(bestScore);
  const doneByType: Record<string, number> = {};
  for (const id of donePassages) {
    const p = passages.find((x) => x.id === id);
    if (p) doneByType[p.type] = (doneByType[p.type] ?? 0) + 1;
  }

  // Average score per type (best scores only)
  const avgByType: Record<string, number> = {};
  for (const type of ["single", "double", "triple"]) {
    const scores = donePassages
      .map((id) => {
        const p = passages.find((x) => x.id === id);
        return p?.type === type ? bestScore[id] : null;
      })
      .filter((s): s is number => s != null);
    avgByType[type] = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  }

  // 10 most recent attempts
  const recent = attempts.slice(0, 10);

  const totalDone  = donePassages.length;
  const totalAll   = passages.length;
  const overallAvg =
    totalDone > 0
      ? Math.round(
          Object.values(bestScore).reduce((a, b) => a + b, 0) / totalDone
        )
      : 0;

  return (
    <div
      style={{
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem)",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Overall summary */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-reading-display)",
            fontSize: "clamp(1.3rem, 3vw, 1.7rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.25rem",
          }}
        >
          Tiến độ học tập
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
          {totalDone}/{totalAll} bài đã hoàn thành
          {totalDone > 0 && ` · Điểm trung bình: ${overallAvg}%`}
        </p>
      </div>

      {/* Per-type stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {["single", "double", "triple"].map((type) => {
          const done  = doneByType[type] ?? 0;
          const total = totalByType[type] ?? 0;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          const avg   = avgByType[type];

          return (
            <div
              key={type}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.2rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--accent-primary)",
                  marginBottom: "0.5rem",
                }}
              >
                {TYPE_LABEL[type]}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                  marginBottom: "0.2rem",
                }}
              >
                {done}
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    marginLeft: 4,
                  }}
                >
                  / {total} bài
                </span>
              </div>
              {avg > 0 && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.6rem",
                  }}
                >
                  Trung bình: {avg}%
                </div>
              )}
              <div
                style={{
                  height: 4,
                  background: "var(--border)",
                  borderRadius: 999,
                  marginTop: done > 0 ? 0 : "0.6rem",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background:
                      pct >= 80
                        ? "var(--accent-green)"
                        : pct >= 40
                        ? "var(--accent-primary)"
                        : "var(--border)",
                    borderRadius: 999,
                    transition: "width 0.4s",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent attempts */}
      {recent.length > 0 && (
        <>
          <div
            style={{
              height: 1,
              background: "var(--border)",
              marginBottom: "1.5rem",
            }}
          />
          <h2
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "1rem",
            }}
          >
            Lịch sử gần đây
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {recent.map((a, i) => {
              const scoreColor =
                a.score >= 80
                  ? "var(--accent-green)"
                  : a.score >= 50
                  ? "var(--accent-yellow)"
                  : "var(--accent-red)";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.9rem",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)", marginRight: 8 }}>
                      {TYPE_LABEL[a.passage.type]}
                    </span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {a.passage.category
                        ? `${a.passage.category} · Bài ${a.passage.orderIndex}`
                        : `Bài ${a.passage.orderIndex}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {new Date(a.completedAt).toLocaleDateString("vi-VN")}
                    </span>
                    <span
                      title="Thời gian làm bài"
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 44,
                        textAlign: "right",
                      }}
                    >
                      {a.durationSeconds != null ? `⏱ ${formatDuration(a.durationSeconds)}` : "—"}
                    </span>
                    <span
                      style={{ fontWeight: 700, color: scoreColor, minWidth: 38, textAlign: "right" }}
                    >
                      {a.score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {totalDone === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Chưa có bài nào được hoàn thành.{" "}
          <a href="/reading-practice" style={{ color: "var(--accent-primary)" }}>
            Bắt đầu luyện tập →
          </a>
        </div>
      )}
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
