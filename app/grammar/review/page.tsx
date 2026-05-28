import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TOPICS } from "@/lib/grammar/topics";
import { grammarQuestions } from "@/lib/grammar/questions";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Ngân hàng câu sai — Ngữ pháp" };

export default async function GrammarReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/grammar/review");

  const [profile, attempts] = await Promise.all([
    prisma.profile
      .findUnique({ where: { id: user.id }, select: { displayName: true } })
      .catch(() => null),
    prisma.grammarAttempt
      .findMany({
        where: { userId: user.id },
        select: { questionId: true, isCorrect: true, topicSlug: true, userAnswer: true },
      })
      .catch(() => []),
  ]);

  // Find questions user has never answered correctly
  const everCorrect = new Set<string>();
  const latestAttempt: Record<string, { userAnswer: string; topicSlug: string }> = {};

  for (const a of attempts) {
    if (a.isCorrect) everCorrect.add(a.questionId);
    if (!latestAttempt[a.questionId]) {
      latestAttempt[a.questionId] = { userAnswer: a.userAnswer, topicSlug: a.topicSlug };
    }
  }

  // Questions attempted but never correct
  const wrongIds = Object.keys(latestAttempt).filter((id) => !everCorrect.has(id));

  if (wrongIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
        <Header userEmail={user.email} userDisplayName={profile?.displayName} />
        <main className="flex-1 max-w-[700px] mx-auto px-4 py-16 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "var(--accent-green)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Chưa có câu sai nào!
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Làm thêm bài để xây dựng ngân hàng câu cần ôn lại.
          </p>
          <Link href="/grammar" className="btn btn-primary">
            <ArrowLeft size={15} /> Về danh sách đề
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Group wrong questions by topic
  const wrongSet = new Set(wrongIds);
  const qMap = Object.fromEntries(grammarQuestions.map((q) => [q.id, q]));

  const byTopic = TOPICS.map((topic) => {
    const qs = wrongIds
      .filter((id) => latestAttempt[id].topicSlug === topic.slug && qMap[id])
      .map((id) => ({ q: qMap[id], userAnswer: latestAttempt[id].userAnswer }));
    return { topic, qs };
  }).filter((t) => t.qs.length > 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-10">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/grammar"
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={14} /> Về danh sách đề
          </Link>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Ngân hàng câu sai
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {wrongIds.length} câu chưa trả lời đúng lần nào
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {byTopic.map(({ topic, qs }) => (
            <section key={topic.slug}>
              <div className="flex items-center gap-2 mb-3">
                <span>{topic.emoji}</span>
                <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {topic.name}
                </h2>
                <span className="badge badge-red" style={{ fontSize: "0.65rem" }}>
                  {qs.length} câu
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {qs.map(({ q, userAnswer }) => (
                  <div
                    key={q.id}
                    className="card p-4"
                    style={{ borderLeft: "3px solid var(--accent-red)" }}
                  >
                    <p
                      className="text-sm font-medium mb-3 leading-relaxed"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                      {(["A", "B", "C", "D"] as const).map((key) => {
                        const isAnswer = key === q.correct_answer;
                        const isWrong = key === userAnswer && !isAnswer;
                        return (
                          <div
                            key={key}
                            className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
                            style={{
                              background: isAnswer
                                ? "rgba(16,185,129,0.1)"
                                : isWrong
                                ? "rgba(239,68,68,0.08)"
                                : "var(--bg-secondary)",
                              color: isAnswer
                                ? "var(--accent-green)"
                                : isWrong
                                ? "var(--accent-red)"
                                : "var(--text-muted)",
                            }}
                          >
                            <span className="font-bold shrink-0">({key})</span>
                            {q.options[key]}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className="text-xs rounded-lg p-3 leading-relaxed"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        Giải thích:{" "}
                      </span>
                      {q.explanation_reason}
                      {q.translation && (
                        <span
                          className="block mt-1 italic"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {q.translation}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
