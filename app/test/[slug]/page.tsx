import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronLeft, Clock } from "lucide-react";

const PART_META: Record<number, { label: string; icon: string }> = {
  1: { label: "Part 1 - Photographs", icon: "🖼️" },
  2: { label: "Part 2 - Question-Response", icon: "💬" },
  3: { label: "Part 3 - Conversations", icon: "🗣️" },
  4: { label: "Part 4 - Talks", icon: "📢" },
};

function formatDuration(seconds: number) {
  if (!seconds || seconds === 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
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

  // Find back link — try to get series slug
  const testSetWithSeries = await prisma.testSet.findUnique({
    where: { slug },
    select: { series: { select: { slug: true } } },
  }).catch(() => null);
  const backHref = testSetWithSeries?.series?.slug
    ? `/series/${testSetWithSeries.series.slug}`
    : "/";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-6">

        {/* Back */}
        <div className="mb-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-0.5 text-sm text-[#006591] hover:underline transition-all"
          >
            <ChevronLeft size={16} />
            Trang chủ
          </Link>
        </div>

        {/* Hero */}
        <section className="bg-[#0ea5e9] rounded-xl text-white relative overflow-hidden mb-8 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-lg flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="brightness-0 invert">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div>
                {testSet.year && (
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">ETS {testSet.year}</span>
                )}
                <h2 className="text-2xl font-bold text-white leading-tight">{testSet.name}</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-white text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {completedLessons}/{totalLessons} bài đạt ≥70
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-white text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                {activeParts.length} Part
              </div>
            </div>
          </div>
        </section>

        {/* Parts */}
        <div className="flex flex-col gap-10">
          {activeParts.map((part) => {
            const meta = PART_META[part.partNumber] ?? { label: `Part ${part.partNumber}`, icon: "📝" };

            const partCompleted = part.lessons.filter((l) => {
              const lp = progressMap.get(l.id);
              if (!lp) return false;
              return Array.from(lp.values()).some((p) => p.status === "completed" && p.score >= 70);
            }).length;

            const partPercent = part.lessons.length > 0
              ? Math.round((partCompleted / part.lessons.length) * 100)
              : 0;

            const levelList = part.partNumber <= 2 ? [1, 2] : [1, 2, 3, 4];

            return (
              <section key={part.id}>
                {/* Part header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#e5eeff] rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#0b1c30]">{meta.label}</h3>
                      <p className="text-xs text-[#6e7881]">{partCompleted}/{part.lessons.length} bài hoàn thành</p>
                    </div>
                  </div>
                  {/* Progress separator line */}
                  <div className="h-[2px] flex-grow mx-4 bg-[#bec8d2]/30 relative hidden md:block">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#0ea5e9] transition-all duration-700"
                      style={{ width: `${partPercent}%` }}
                    />
                  </div>
                </div>

                {/* Lessons grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {part.lessons.map((lesson) => {
                    const lp = progressMap.get(lesson.id);
                    const levels = lp ? Array.from(lp.entries()) : [];
                    const anyPassed = levels.some(([, p]) => p.status === "completed" && p.score >= 70);
                    const duration = formatDuration(lesson.audioDuration);

                    return (
                      <Link
                        key={lesson.id}
                        href={`/test/${slug}/${lesson.id}`}
                        className="group bg-white border border-[#bec8d2] rounded-lg p-3 flex items-center justify-between hover:border-[#0ea5e9] transition-all cursor-pointer"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          {/* Title + badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0b1c30] truncate">{lesson.title}</span>
                            {anyPassed && (
                              <span className="flex-shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                ĐẠT
                              </span>
                            )}
                          </div>
                          {/* Question range */}
                          {lesson.questionStart && lesson.questionEnd && (
                            <p className="text-xs text-[#6e7881]">
                              Questions {lesson.questionStart}–{lesson.questionEnd}
                            </p>
                          )}
                          {/* Level badges */}
                          <div className="flex gap-1.5 mt-0.5">
                            {levelList.map((lvl) => {
                              const lv = lp?.get(lvl);
                              const done = lv?.status === "completed" && lv.score >= 70;
                              return (
                                <span
                                  key={lvl}
                                  className={`text-[10px] border px-1.5 py-0.5 rounded font-bold ${
                                    done
                                      ? "border-[#0ea5e9] text-[#0ea5e9]"
                                      : "border-[#bec8d2] text-[#6e7881] opacity-40"
                                  }`}
                                >
                                  L{lvl}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          {duration && (
                            <div className="flex items-center gap-1 text-[#6e7881]">
                              <Clock size={14} />
                              <span className="text-xs">{duration}</span>
                            </div>
                          )}
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            className="text-[#bec8d2] group-hover:text-[#0ea5e9] transition-colors"
                          >
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
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
