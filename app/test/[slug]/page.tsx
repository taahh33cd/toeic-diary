import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronLeft, ChevronRight, Clock, Trophy, CheckCircle2, Circle } from "lucide-react";

const PART_LABELS: Record<number, { label: string; icon: string }> = {
  1: { label: "Part 1 – Photographs", icon: "📷" },
  2: { label: "Part 2 – Question-Response", icon: "💬" },
  3: { label: "Part 3 – Conversations", icon: "🗣️" },
  4: { label: "Part 4 – Talks", icon: "📢" },
};

const LEVEL_LABELS: Record<number, string> = { 1: "L1", 2: "L2", 3: "L3", 4: "L4" };

function formatDuration(seconds: number) {
  if (!seconds || seconds === 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
}

function statusBadge(status: string, score: number) {
  if (status === "completed" && score >= 70)
    return { label: "✓ Đạt", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  if (status === "completed")
    return { label: `${score}đ`, cls: "bg-orange-50 text-orange-700 border border-orange-200" };
  if (status === "in_progress")
    return { label: "Đang học", cls: "bg-yellow-50 text-yellow-700 border border-yellow-200" };
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

  const lessonIds = testSet.parts.flatMap((p) => p.lessons.map((l) => l.id));
  const progressRows = lessonIds.length
    ? await prisma.userProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessonIds } },
        select: { lessonId: true, level: true, status: true, score: true, bestScore: true },
      })
    : [];

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

  const totalLessons = lessonIds.length;
  const completedLessons = new Set(
    progressRows.filter((p) => p.status === "completed" && p.score >= 70).map((p) => p.lessonId)
  ).size;

  const activeParts = testSet.parts.filter((p) => p.lessons.length > 0);
  const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-10">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6e7881] hover:text-[#0b1c30] transition-colors mb-8"
        >
          <ChevronLeft size={15} />
          Trang chủ
        </Link>

        {/* Header card */}
        <div className="bg-white border border-[#bec8d2] rounded-xl p-6 md:p-8 mb-8"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1">
              {testSet.year && (
                <p className="text-xs font-semibold text-[#0ea5e9] uppercase tracking-wider mb-1">
                  ETS {testSet.year}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-[#0b1c30] leading-tight mb-4">
                {testSet.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#eff4ff] text-[#006591] border border-[#0ea5e9]/20">
                  <Trophy size={12} />
                  {completedLessons}/{totalLessons} bài ≥70
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#eff4ff] text-[#006591] border border-[#0ea5e9]/20">
                  {activeParts.length} Part
                </span>
              </div>
            </div>

            {/* Overall progress ring */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#e5eeff" strokeWidth="6" />
                <circle
                  cx="36" cy="36" r="30"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - overallPercent / 100)}`}
                  transform="rotate(-90 36 36)"
                />
                <text x="36" y="40" textAnchor="middle" className="text-xs font-bold" fill="#0b1c30" fontSize="14" fontWeight="700">
                  {overallPercent}%
                </text>
              </svg>
              <span className="text-xs text-[#6e7881]">Tiến độ</span>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-5">
            <div className="w-full h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0ea5e9] rounded-full transition-all duration-700"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Parts + Lessons */}
        <div className="space-y-8">
          {activeParts.map((part) => {
            const meta = PART_LABELS[part.partNumber] ?? {
              label: `Part ${part.partNumber}`,
              icon: "📝",
            };
            const partCompleted = part.lessons.filter((l) => {
              const lp = progressMap.get(l.id);
              if (!lp) return false;
              return Array.from(lp.values()).some((p) => p.status === "completed" && p.score >= 70);
            }).length;
            const partPercent = part.lessons.length > 0
              ? Math.round((partCompleted / part.lessons.length) * 100)
              : 0;

            return (
              <section key={part.id}>
                {/* Part header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center text-lg flex-shrink-0">
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-base text-[#0b1c30]">{meta.label}</h2>
                    <p className="text-xs text-[#6e7881]">
                      {partCompleted}/{part.lessons.length} bài hoàn thành
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#0ea5e9]">{partPercent}%</span>
                </div>

                {/* Part progress bar */}
                <div className="w-full h-1 bg-[#e5eeff] rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-[#0ea5e9] rounded-full transition-all duration-700"
                    style={{ width: `${partPercent}%` }}
                  />
                </div>

                {/* Lessons grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {part.lessons.map((lesson) => {
                    const lp = progressMap.get(lesson.id);
                    const levels = lp ? Array.from(lp.entries()) : [];
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
                        className="group bg-white border border-[#bec8d2] rounded-xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
                        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-[#0b1c30] leading-tight">
                              {lesson.title}
                            </div>
                            {lesson.questionStart && lesson.questionEnd && (
                              <div className="text-xs text-[#6e7881] mt-0.5">
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
                              className="text-[#bec8d2] group-hover:text-[#0ea5e9] transition-colors"
                            />
                          </div>
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between">
                          {/* Level badges */}
                          <div className="flex items-center gap-1.5">
                            {(part.partNumber <= 2 ? [1, 2] : [1, 2, 3, 4]).map((lvl) => {
                              const lv = lp?.get(lvl);
                              const done = lv?.status === "completed" && lv.score >= 70;
                              const started = lv && lv.status !== "not_started";
                              return (
                                <div
                                  key={lvl}
                                  title={`Level ${lvl}`}
                                  className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                                    done
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : started
                                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                      : "bg-[#eff4ff] text-[#6e7881] border border-[#bec8d2]"
                                  }`}
                                >
                                  {done ? <CheckCircle2 size={10} /> : <Circle size={10} />}
                                  {LEVEL_LABELS[lvl]}
                                </div>
                              );
                            })}
                          </div>

                          {duration && (
                            <div className="flex items-center gap-1 text-xs text-[#6e7881]">
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
