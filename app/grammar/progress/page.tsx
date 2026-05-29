import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { TOPICS } from "@/lib/grammar/topics";
import { grammarQuestions } from "@/lib/grammar/questions";

export const metadata: Metadata = { title: "Tiến độ — Ngữ pháp" };

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 0;
  const cursor = new Date(dates[0] + "T00:00:00Z");
  for (const d of dates) {
    if (d === cursor.toISOString().slice(0, 10)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else break;
  }
  return streak;
}

export default async function GrammarProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/grammar/progress");

  const attempts = await prisma.grammarAttempt
    .findMany({
      where: { userId: user.id },
      select: { questionId: true, isCorrect: true, topicSlug: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  // Overall stats
  const seenSet = new Set(attempts.map((a) => a.questionId));
  const correctSet = new Set(attempts.filter((a) => a.isCorrect).map((a) => a.questionId));
  const totalSeen = seenSet.size;
  const totalCorrect = correctSet.size;
  const totalQs = grammarQuestions.length;
  const accuracy = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

  // Streak
  const dateSet = new Set(attempts.map((a) => a.createdAt.toISOString().slice(0, 10)));
  const sortedDates = [...dateSet].sort().reverse();
  const streak = calcStreak(sortedDates);

  // Per-topic stats
  const topicMap: Record<string, { seen: Set<string>; correct: Set<string> }> = {};
  for (const a of attempts) {
    if (!topicMap[a.topicSlug]) topicMap[a.topicSlug] = { seen: new Set(), correct: new Set() };
    topicMap[a.topicSlug].seen.add(a.questionId);
    if (a.isCorrect) topicMap[a.topicSlug].correct.add(a.questionId);
  }
  const topicStats = TOPICS.map((topic) => {
    const data = topicMap[topic.slug];
    const topicTotal = grammarQuestions.filter((q) => q.grammar_type === topic.id).length;
    const seen = data?.seen.size ?? 0;
    const correct = data?.correct.size ?? 0;
    const pct = seen > 0 ? Math.round((correct / seen) * 100) : null;
    return { topic, seen, correct, total: topicTotal, pct };
  }).filter((t) => t.seen > 0);

  // Activity — last 28 days
  const activityMap: Record<string, number> = {};
  for (const a of attempts) {
    const day = a.createdAt.toISOString().slice(0, 10);
    activityMap[day] = (activityMap[day] || 0) + 1;
  }
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(Date.now() - (27 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { key, count: activityMap[key] ?? 0 };
  });
  const maxActivity = Math.max(...last28.map((d) => d.count), 1);

  if (attempts.length === 0) {
    return (
      <div style={{ padding: "3rem 2rem", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📊</p>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Chưa có dữ liệu
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Làm bài để theo dõi tiến độ học tập của bạn.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Heading */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
          Tiến độ
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Thống kê học tập ngữ pháp TOEIC của bạn
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Câu đã làm", value: totalSeen.toLocaleString(), sub: `/ ${totalQs.toLocaleString()} câu` },
          { label: "Câu đúng", value: totalCorrect.toLocaleString(), sub: `accuracy ${accuracy}%` },
          { label: "Accuracy", value: `${accuracy}%`, sub: "trên câu đã làm" },
          { label: "Streak", value: `${streak} ngày`, sub: streak > 0 ? "liên tiếp" : "hôm nay chưa làm" },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-lg)",
              padding: "1.1rem 1.25rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              {label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--accent-primary)", lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Activity strip — last 28 days */}
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
          Hoạt động 28 ngày gần nhất
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
          {last28.map(({ key, count }) => (
            <div
              key={key}
              title={`${key}: ${count} lần`}
              style={{
                flex: 1,
                height: count === 0 ? 3 : `${Math.max(6, Math.round((count / maxActivity) * 48))}px`,
                background: count === 0 ? "var(--bg-container)" : "var(--accent-primary)",
                opacity: count === 0 ? 1 : Math.max(0.25, count / maxActivity),
                borderRadius: 2,
                transition: "height 0.3s ease",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>28 ngày trước</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Hôm nay</span>
        </div>
      </div>

      {/* Per-topic breakdown */}
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Theo chủ đề
          </span>
        </div>
        <div>
          {topicStats.map(({ topic, seen, correct, total, pct }, i) => {
            const barColor =
              pct === null ? "var(--bg-container)" :
              pct >= 80 ? "var(--accent-green)" :
              pct >= 50 ? "#ca8a04" :
              "var(--accent-red)";

            return (
              <div
                key={topic.slug}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1.5rem",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                {/* Dot */}
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: topic.color,
                    flexShrink: 0,
                  }}
                />

                {/* Topic name */}
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    minWidth: 160,
                    flexShrink: 0,
                  }}
                >
                  {topic.name}
                </span>

                {/* Progress bar */}
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: "var(--bg-container)",
                    borderRadius: 999,
                    overflow: "hidden",
                    minWidth: 80,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct ?? 0}%`,
                      background: barColor,
                      borderRadius: 999,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>

                {/* Score */}
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: barColor,
                    minWidth: 36,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {pct !== null ? `${pct}%` : "—"}
                </span>

                {/* Counts */}
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {correct}/{seen}
                  <span style={{ color: "var(--bg-container)" }}> · </span>
                  <span style={{ opacity: 0.6 }}>{total} câu</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
