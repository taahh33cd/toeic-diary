import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TOPICS } from "@/lib/grammar/topics";
import { grammarQuestions } from "@/lib/grammar/questions";
import { ChevronRight, BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Ngữ pháp" };

// Pre-compute topic+test stats server-side so no client JS needed
function buildTopicStats(
  correctSet: Set<string>,
  seenSet: Set<string>
) {
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

export default async function GrammarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/grammar");

  const [profile, attempts] = await Promise.all([
    prisma.profile
      .findUnique({ where: { id: user.id }, select: { displayName: true } })
      .catch(() => null),
    prisma.grammarAttempt
      .findMany({ where: { userId: user.id }, select: { questionId: true, isCorrect: true } })
      .catch(() => []),
  ]);

  // Build sets for quick lookup
  const seenSet = new Set(attempts.map((a) => a.questionId));
  const correctSet = new Set(
    attempts.filter((a) => a.isCorrect).map((a) => a.questionId)
  );

  const topicStats = buildTopicStats(correctSet, seenSet);
  const totalQs = grammarQuestions.length;
  const totalCorrect = correctSet.size;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-10">
        {/* Page heading */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              📝 Luyện ngữ pháp
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Trắc nghiệm ngữ pháp TOEIC — 11 chủ đề, {grammarQuestions.length.toLocaleString()} câu hỏi
            </p>
          </div>
          <div className="flex items-center gap-3">
            {seenSet.size > 0 && (
              <span className="badge badge-primary text-xs">
                {totalCorrect}/{totalQs} đúng
              </span>
            )}
            <Link href="/grammar/review" className="btn btn-secondary btn-sm">
              <BookOpen size={14} /> Ngân hàng câu sai
            </Link>
          </div>
        </div>

        {/* Topic accordion (details/summary — no JS needed) */}
        <div className="flex flex-col gap-3">
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
                className="card overflow-hidden group"
                style={{ borderColor: "var(--border)" }}
              >
                <summary
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none list-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="text-xl shrink-0">{topic.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{topic.name}</span>
                      <span
                        className="badge badge-muted text-xs"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {tests.length} đề · {tQs} câu
                      </span>
                    </div>
                    {hasProgress && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full flex-1 max-w-[160px]"
                          style={{ background: "var(--bg-secondary)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: scoreColor }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: scoreColor }}>
                          {pct}%
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="shrink-0 transition-transform group-open:rotate-90"
                    style={{ color: "var(--text-muted)" }}
                  />
                </summary>

                {/* Test list */}
                <div
                  className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {tests.map((t) => {
                    const tPct =
                      t.size > 0 ? Math.round((t.correctCount / t.size) * 100) : 0;
                    const status: "done-hi" | "done-lo" | "untouched" =
                      t.done && tPct >= 80
                        ? "done-hi"
                        : t.done
                        ? "done-lo"
                        : "untouched";

                    return (
                      <Link
                        key={t.testNumber}
                        href={`/grammar/${topic.slug}/${t.testNumber}`}
                        className="group/btn flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all hover:border-[var(--accent-primary)] hover:shadow-sm"
                        style={{
                          background:
                            status === "done-hi"
                              ? "rgba(16,185,129,0.07)"
                              : status === "done-lo"
                              ? "rgba(245,158,11,0.07)"
                              : "var(--bg-secondary)",
                          borderColor:
                            status === "done-hi"
                              ? "rgba(16,185,129,0.3)"
                              : status === "done-lo"
                              ? "rgba(245,158,11,0.3)"
                              : "var(--border)",
                        }}
                      >
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          Test {t.testNumber}
                          <span
                            className="ml-1 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            ({t.size} câu)
                          </span>
                        </span>
                        {t.done ? (
                          <span
                            className="text-xs font-bold"
                            style={{
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
                            size={13}
                            className="opacity-0 group-hover/btn:opacity-100 transition-opacity"
                            style={{ color: "var(--accent-primary)" }}
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
      </main>

      <Footer />
    </div>
  );
}
