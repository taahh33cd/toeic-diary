import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Clock, Trophy, Play, CheckCircle2, Circle } from "lucide-react";

const PART_LABELS: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: "Part 1 \u2013 Photographs", icon: "📷", color: "from-rose-500 to-pink-600" },
  2: { label: "Part 2 \u2013 Question-Response", icon: "💬", color: "from-amber-500 to-orange-600" },
  3: { label: "Part 3 \u2013 Conversations", icon: "🗣️", color: "from-indigo-500 to-violet-600" },
  4: { label: "Part 4 \u2013 Talks", icon: "📢", color: "from-emerald-500 to-teal-600" },
};

const LEVEL_LABELS: Record<number, string> = {
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
};

function formatDuration(seconds: number) {
  if (!seconds || seconds === 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
}

function statusBadge(status: string, score: number) {
  if (status === "completed" && score >= 70)
    return { label: "✓ Đạt", cls: "bg-[var(--accent-green)]/15 text-[var(--accent-green)]" };
  if (status === "completed")
    return { label: `${score}đ`, cls: "bg-orange-500/15 text-orange-400" };
  if (status === "in_progress")
    return { label: "Đang học", cls: "bg-yellow-500/15 text-yellow-400" };
  return null;
}

export default async function TestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const testSet = await prisma.testSet.findUnique({
    where: { slug },
    include: {
      parts: {
        orderBy: { partNumber: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              questionStart: true,
              questionEnd: true,
              audioDuration: true,
              orderIndex: true,
            },
          },
        },
      },
    },
  });

  if (!testSet) notFound();

  // Fetch user progress for all lessons in this test
  const lessonIds = testSet.parts.flatMap((p) => p.lessons.map((l) => l.id));
  const progressRows = lessonIds.length
    ? await prisma.userProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessonIds } },
        select: { lessonId: true, level: true, status: true, score: true, bestScore: true },
      })
    : [];

  // Map: lessonId → level → progress
  const progressMap = new Map<string, Map<number, { status: string; score: number; bestScore: number }>>();
  for (const row of progressRows) {
    if (!progressMap.has(row.lessonId)) progressMap.set(row.lessonId, new Map());
    progressMap.get(row.lessonId)!.set(row.level, {
      status: row.status,
      score: row.score,
      bestScore: row.bestScore,
    });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { displayName: true },
  });

  // Stats
  const totalLessons = lessonIds.length;
  const completedLessons = new Set(
    progressRows.filter((p) => p.status === "completed" && p.score >= 70).map((p) => p.lessonId)
  ).size;

  const activeParts = testSet.parts.filter((p) => p.lessons.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Trang chủ
        </Link>

        {/* Header banner */}
        <div className="relative rounded-[var(--radius-xl)] overflow-hidden mb-8 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 md:p-8">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
          <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="text-indigo-300 text-sm font-medium mb-1 uppercase tracking-wider">
              ETS {testSet.year}
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-4">
              {testSet.name}
            </h1>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                <Trophy size={14} />
                {completedLessons}/{totalLessons} bài đạt ≥70
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                <Play size={14} />
                {activeParts.length} Part
              </div>
            </div>
          </div>
        </div>

        {/* Parts + Lessons */}
        <div className="space-y-10">
          {activeParts.map((part) => {
            const meta = PART_LABELS[part.partNumber] ?? {
              label: `Part ${part.partNumber}`,
              icon: "📝",
              color: "from-gray-500 to-gray-600",
            };
            const partCompleted = part.lessons.filter((l) => {
              const lp = progressMap.get(l.id);
              if (!lp) return false;
              return Array.from(lp.values()).some((p) => p.status === "completed" && p.score >= 70);
            }).length;

            return (
              <section key={part.id}>
                {/* Part header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-lg flex-shrink-0`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
                      {meta.label}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {partCompleted}/{part.lessons.length} bài hoàn thành
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar mb-5" style={{ height: "3px" }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${part.lessons.length > 0 ? (partCompleted / part.lessons.length) * 100 : 0}%` }}
                  />
                </div>

                {/* Lessons grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {part.lessons.map((lesson) => {
                    const lp = progressMap.get(lesson.id);
                    // Best status across all levels
                    const levels = lp ? Array.from(lp.entries()) : [];
                    const bestLevel = levels.reduce(
                      (best, [lvl, p]) =>
                        p.status === "completed" && p.bestScore >= 70 && lvl > best ? lvl : best,
                      0
                    );
                    const anyCompleted = levels.some(([, p]) => p.status === "completed" && p.score >= 70);
                    const anyStarted = levels.some(([, p]) => p.status !== "not_started");
                    const overallStatus = anyCompleted ? "completed" : anyStarted ? "in_progress" : "not_started";
                    const topScore = levels.reduce((max, [, p]) => Math.max(max, p.bestScore), 0);
                    const badge = statusBadge(overallStatus, topScore);
                    const duration = formatDuration(lesson.audioDuration);

                    return (
                      <Link
                        key={lesson.id}
                        href={`/test/${slug}/${lesson.id}`}
                        className="card card-interactive p-4 flex flex-col gap-3 group animate-slide-up"
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">
                              {lesson.title}
                            </div>
                            {lesson.questionStart && lesson.questionEnd && (
                              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                Questions {lesson.questionStart}–{lesson.questionEnd}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {badge && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                            <ChevronRight
                              size={15}
                              className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors"
                            />
                          </div>
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between">
                          {/* Level dots */}
                          <div className="flex items-center gap-1.5">
                            {(part.partNumber <= 2 ? [1, 2] : [1, 2, 3, 4]).map((lvl) => {
                              const lv = lp?.get(lvl);
                              const done = lv?.status === "completed" && lv.score >= 70;
                              const started = lv && lv.status !== "not_started";
                              return (
                                <div
                                  key={lvl}
                                  title={`Level ${lvl}`}
                                  className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                                    done
                                      ? "bg-[var(--accent-green)]/15 text-[var(--accent-green)]"
                                      : started
                                      ? "bg-yellow-500/15 text-yellow-400"
                                      : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                                  }`}
                                >
                                  {done ? (
                                    <CheckCircle2 size={10} />
                                  ) : (
                                    <Circle size={10} />
                                  )}
                                  {LEVEL_LABELS[lvl]}
                                </div>
                              );
                            })}
                          </div>

                          {duration && (
                            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <Clock size={11} />
                              {duration}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
