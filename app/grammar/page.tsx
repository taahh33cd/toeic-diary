import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { TOPICS } from "@/lib/grammar/topics";
import { grammarQuestions } from "@/lib/grammar/questions";
import { ChevronRight, BookMarked, Flame, BookCheck } from "lucide-react";

export const metadata: Metadata = { title: "Ngữ pháp" };

function buildTopicStats(correctSet: Set<string>, seenSet: Set<string>) {
  return TOPICS.map((topic) => {
    const topicQs = grammarQuestions.filter((q) => q.grammar_type === topic.id);
    const tests: {
      testNumber: number;
      size: number;
      correctCount: number;
      done: boolean;
    }[] = [];

    let cursor = 0;
    for (let i = 0; i < topic.testSizes.length; i++) {
      const size = topic.testSizes[i];
      const slice = topicQs.slice(cursor, cursor + size);
      if (slice.length === 0) break;
      const sliceIds = slice.map((q) => q.id);
      const sliceCorrect = sliceIds.filter((id) => correctSet.has(id)).length;
      const sliceSeen = sliceIds.filter((id) => seenSet.has(id)).length;
      tests.push({
        testNumber: i + 1,
        size: slice.length,
        correctCount: sliceCorrect,
        done: sliceSeen === slice.length,
      });
      cursor += size;
    }

    const totalQs = topicQs.length;
    const topicCorrect = topicQs.filter((q) => correctSet.has(q.id)).length;

    return { topic, tests, totalQs, topicCorrect };
  });
}

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

export default async function GrammarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout handles redirect

  const [profile, attempts] = await Promise.all([
    prisma.profile
      .findUnique({ where: { id: user.id }, select: { displayName: true } })
      .catch(() => null),
    prisma.grammarAttempt
      .findMany({
        where: { userId: user.id },
        select: { questionId: true, isCorrect: true, createdAt: true },
      })
      .catch(() => []),
  ]);

  const seenSet = new Set(attempts.map((a) => a.questionId));
  const correctSet = new Set(attempts.filter((a) => a.isCorrect).map((a) => a.questionId));

  // Streak
  const dateSet = new Set(attempts.map((a) => a.createdAt.toISOString().slice(0, 10)));
  const sortedDates = [...dateSet].sort().reverse();
  const streak = calcStreak(sortedDates);

  const topicStats = buildTopicStats(correctSet, seenSet);
  const totalQs = grammarQuestions.length;
  const totalCorrect = correctSet.size;

  // Completed tests = tests where every question has been seen
  const completedTests = topicStats.reduce(
    (sum, { tests }) => sum + tests.filter((t) => t.done).length,
    0
  );

  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "bạn";

  return (
    <div style={{ padding: "2rem 2rem 3rem", maxWidth: 860, margin: "0 auto" }}>

      {/* Welcome */}
      <section style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: "1.2",
                marginBottom: "0.4rem",
              }}
            >
              Xin chào, {displayName}! 👋
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Luyện ngữ pháp mỗi ngày — nền tảng vững chắc cho điểm TOEIC của bạn.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
            {/* Streak card */}
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "0.75rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Flame size={20} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  Ngày Streak
                </p>
                <p
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  {streak} ngày
                </p>
              </div>
            </div>

            {/* Completed card */}
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "0.75rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <BookCheck size={20} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  Đã hoàn thành
                </p>
                <p
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    lineHeight: 1.2,
                  }}
                >
                  {completedTests} bài
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page heading */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.35rem",
          }}
        >
          Tổng quan
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {totalQs.toLocaleString()} câu hỏi · 11 chủ đề ngữ pháp TOEIC
        </p>

        {/* Stats strip */}
        {seenSet.size > 0 && (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              padding: "0.75rem 1rem",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--accent-primary)",
                  lineHeight: 1,
                }}
              >
                {Math.round((totalCorrect / totalQs) * 100)}%
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
                TỔNG ĐÚNG
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 32,
                background: "var(--border)",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {totalCorrect.toLocaleString()}
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  /{totalQs.toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
                CÂU ĐÃ ĐÚNG
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Link
                href="/grammar/review"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  color: "var(--accent-primary)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <BookMarked size={13} />
                Ngân hàng câu sai
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Topic list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {topicStats.map(({ topic, tests, totalQs: tQs, topicCorrect }) => {
          const pct = tQs > 0 ? Math.round((topicCorrect / tQs) * 100) : 0;
          const hasProgress = topicCorrect > 0;
          const scoreColor =
            pct >= 80
              ? "var(--accent-green)"
              : pct >= 50
              ? "var(--accent-yellow)"
              : "var(--accent-red)";

          return (
            <details
              key={topic.slug}
              id={topic.slug}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  cursor: "pointer",
                  listStyle: "none",
                  userSelect: "none",
                }}
              >
                {/* Color dot */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: topic.color,
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {topic.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        background: "var(--bg-secondary)",
                        padding: "2px 7px",
                        borderRadius: 999,
                      }}
                    >
                      {tests.length} đề · {tQs} câu
                    </span>
                    {hasProgress && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: scoreColor,
                        }}
                      >
                        {pct}%
                      </span>
                    )}
                  </div>

                  {hasProgress && (
                    <div
                      style={{
                        marginTop: 6,
                        height: 3,
                        background: "var(--bg-secondary)",
                        borderRadius: 999,
                        maxWidth: 200,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: scoreColor,
                          borderRadius: 999,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  )}
                </div>

                <ChevronRight
                  size={15}
                  style={{
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    transition: "transform 0.2s ease",
                  }}
                  className="group-open:rotate-90"
                />
              </summary>

              {/* Test grid */}
              <div
                style={{
                  padding: "0.65rem 1rem 0.85rem",
                  borderTop: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "0.5rem",
                }}
              >
                {tests.map((t) => {
                  const tPct =
                    t.size > 0 ? Math.round((t.correctCount / t.size) * 100) : 0;
                  const status =
                    t.done && tPct >= 80
                      ? "hi"
                      : t.done
                      ? "lo"
                      : "untouched";

                  return (
                    <Link
                      key={t.testNumber}
                      href={`/grammar/${topic.slug}/${t.testNumber}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.7rem",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${
                          status === "hi"
                            ? "rgba(52,211,153,0.3)"
                            : status === "lo"
                            ? "rgba(251,191,36,0.3)"
                            : "var(--border)"
                        }`,
                        background:
                          status === "hi"
                            ? "rgba(52,211,153,0.07)"
                            : status === "lo"
                            ? "rgba(251,191,36,0.07)"
                            : "var(--bg-secondary)",
                        textDecoration: "none",
                        transition: "border-color 0.12s, box-shadow 0.12s",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        Test {t.testNumber}
                        <span
                          style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: 4 }}
                        >
                          ({t.size})
                        </span>
                      </span>
                      {t.done ? (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color:
                              tPct >= 80
                                ? "var(--accent-green)"
                                : "var(--accent-yellow)",
                          }}
                        >
                          {tPct}%
                        </span>
                      ) : (
                        <ChevronRight
                          size={12}
                          style={{ color: "var(--text-muted)", opacity: 0.5 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
