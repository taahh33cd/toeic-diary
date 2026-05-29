import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TOPICS } from "@/lib/grammar/topics";
import { grammarQuestions } from "@/lib/grammar/questions";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Ngân hàng câu sai — Ngữ pháp" };

/** Find which test number a question belongs to within its topic */
function getTestNumber(topic: (typeof TOPICS)[number], questionId: string): number {
  const topicQs = grammarQuestions.filter((q) => q.grammar_type === topic.id);
  const idx = topicQs.findIndex((q) => q.id === questionId);
  if (idx === -1) return 1;
  let cursor = 0;
  for (let i = 0; i < topic.testSizes.length; i++) {
    cursor += topic.testSizes[i];
    if (idx < cursor) return i + 1;
  }
  return topic.testSizes.length;
}

export default async function GrammarReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/grammar/review");

  const attempts = await prisma.grammarAttempt
    .findMany({
      where: { userId: user.id },
      select: { questionId: true, isCorrect: true, topicSlug: true },
    })
    .catch(() => []);

  // Questions never answered correctly
  const everCorrect = new Set<string>();
  const seenTopicSlug: Record<string, string> = {};

  for (const a of attempts) {
    if (a.isCorrect) everCorrect.add(a.questionId);
    if (!seenTopicSlug[a.questionId]) seenTopicSlug[a.questionId] = a.topicSlug;
  }

  const wrongIds = Object.keys(seenTopicSlug).filter((id) => !everCorrect.has(id));

  if (wrongIds.length === 0) {
    return (
      <div style={{ padding: "4rem 2rem", maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <CheckCircle2 size={48} style={{ color: "var(--accent-green)", margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
          Chưa có câu sai nào!
        </h2>
        <p style={{ fontSize: "0.85rem", marginBottom: "1.5rem", color: "var(--text-muted)" }}>
          Làm thêm bài để xây dựng ngân hàng câu cần ôn lại.
        </p>
        <Link href="/grammar" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
          <ArrowLeft size={14} /> Về danh sách đề
        </Link>
      </div>
    );
  }

  // Per-topic accuracy from all attempts
  const topicAcc: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    if (!topicAcc[a.topicSlug]) topicAcc[a.topicSlug] = { correct: 0, total: 0 };
    topicAcc[a.topicSlug].total++;
    if (a.isCorrect) topicAcc[a.topicSlug].correct++;
  }

  const qMap = Object.fromEntries(grammarQuestions.map((q) => [q.id, q]));

  const byTopic = TOPICS.map((topic) => {
    const qs = wrongIds
      .filter((id) => seenTopicSlug[id] === topic.slug && qMap[id])
      .map((id) => ({ q: qMap[id], testNumber: getTestNumber(topic, id) }));
    const acc = topicAcc[topic.slug];
    const pct = acc && acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : null;
    return { topic, qs, pct };
  }).filter((t) => t.qs.length > 0);

  return (
    <div style={{ padding: "2rem 2rem 3rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Heading */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "0.25rem",
          }}
        >
          Ngân hàng câu sai
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {wrongIds.length} câu chưa trả lời đúng lần nào
        </p>
      </div>

      {/* Topic accordions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
          gap: "0.75rem",
          alignItems: "start",
        }}
      >
        {byTopic.map(({ topic, qs, pct }) => {
          const pctColor =
            pct === null
              ? "var(--text-muted)"
              : pct >= 80
              ? "var(--accent-green)"
              : pct >= 50
              ? "#d97706"
              : "var(--accent-red)";

          return (
            <details
              key={topic.slug}
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

                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {topic.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#b83232",
                      background: "rgba(184,50,50,0.08)",
                      padding: "2px 7px",
                      borderRadius: 999,
                    }}
                  >
                    {qs.length} câu sai
                  </span>
                  {pct !== null && (
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: pctColor }}>
                      {pct}% đúng
                    </span>
                  )}
                </div>

                <ChevronRight
                  size={15}
                  style={{ color: "var(--text-muted)", flexShrink: 0, transition: "transform 0.2s ease" }}
                />
              </summary>

              {/* Question list */}
              <div
                style={{
                  padding: "0.65rem 1rem 0.85rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                {qs.map(({ q, testNumber }) => (
                  <div
                    key={q.id}
                    style={{
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.75rem 0.9rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.55rem",
                    }}
                  >
                    {/* Question text */}
                    <p
                      style={{
                        fontSize: "0.82rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-primary)",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {q.question}
                    </p>

                    {/* Options */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.3rem",
                      }}
                    >
                      {(["A", "B", "C", "D"] as const).map((key) => (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            color: "var(--text-secondary)",
                            padding: "0.3rem 0.5rem",
                            background: "var(--bg-elevated)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
                            ({key})
                          </span>
                          {q.options[key]}
                        </div>
                      ))}
                    </div>

                    {/* Link to quiz */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Link
                        href={`/grammar/${topic.slug}/${testNumber}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--accent-primary)",
                          textDecoration: "none",
                          padding: "0.25rem 0.6rem",
                          border: "1px solid var(--border-focus)",
                          borderRadius: "var(--radius-sm)",
                          opacity: 0.85,
                        }}
                      >
                        Làm lại Test {testNumber}
                        <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
