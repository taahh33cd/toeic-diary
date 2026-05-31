import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";

const CIRCUMFERENCE = 2 * Math.PI * 18; // r=18

function CircleProgress({ percent }: { percent: number }) {
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  return (
    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="transparent" stroke="var(--bg-secondary)" strokeWidth="2.5" />
        <circle
          cx="20" cy="20" r="18"
          fill="transparent"
          stroke="#4DA8DA"
          strokeWidth="2.5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-[10px] font-bold text-[#4DA8DA]">{percent}%</span>
    </div>
  );
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const series = await prisma.testSeries.findUnique({
    where: { slug },
    include: {
      testSets: {
        orderBy: { orderIndex: "asc" },
        include: {
          parts: {
            select: { id: true, partNumber: true, totalLessons: true },
            orderBy: { partNumber: "asc" },
          },
        },
      },
    },
  });

  if (!series) notFound();

  let testProgress: Record<string, { total: number; completed: number }> = {};
  let completedLessonIds = new Set<string>();

  try {
    const progressCounts = await prisma.userProgress.groupBy({
      by: ["lessonId"],
      where: { userId: user.id, status: "completed", score: { gte: 70 } },
      _count: true,
    });
    completedLessonIds = new Set(progressCounts.map((p) => p.lessonId));

    const testSetIds = series.testSets.map((t) => t.id);
    if (testSetIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { part: { testSetId: { in: testSetIds } } },
        select: { id: true, part: { select: { testSetId: true } } },
      });
      for (const lesson of lessons) {
        const tsId = lesson.part.testSetId;
        if (!testProgress[tsId]) testProgress[tsId] = { total: 0, completed: 0 };
        testProgress[tsId].total++;
        if (completedLessonIds.has(lesson.id)) testProgress[tsId].completed++;
      }
    }
  } catch (err) {
    console.error("DB error:", err);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { displayName: true },
  }).catch(() => null);

  const totalTests = series.testSets.length;
  const completedTests = series.testSets.filter((t) => {
    const prog = testProgress[t.id];
    return prog && prog.total > 0 && prog.completed === prog.total;
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-10">

        {/* Hero */}
        <section className="bg-[#4DA8DA] rounded-2xl p-8 md:p-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <nav className="flex items-center gap-1 text-xs text-white/80 mb-3">
              <Link href="/" className="hover:opacity-80 transition-opacity">Thư viện</Link>
              <span className="text-white/60">›</span>
              <span className="text-white/90">{series.name}</span>
            </nav>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">{series.name}</h1>
            {series.description && (
              <p className="text-white/90 text-base max-w-xl">{series.description}</p>
            )}
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/30 bg-white/10 min-w-[90px]">
              <span className="text-2xl font-bold text-white">{totalTests}</span>
              <span className="text-xs text-white/80 mt-0.5">Total Tests</span>
            </div>
            <div className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/30 bg-white/10 min-w-[90px]">
              <span className="text-2xl font-bold text-white">{completedTests}</span>
              <span className="text-xs text-white/80 mt-0.5">Hoàn thành</span>
            </div>
          </div>
        </section>

        {/* Back link below hero */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Tất cả bộ đề
        </Link>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {series.testSets.map((test) => {
            const prog = testProgress[test.id] ?? { total: 0, completed: 0 };
            const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            const isComplete = percent === 100 && prog.total > 0;
            const isStarted = prog.completed > 0;

            const statusLabel = isComplete
              ? "Hoàn thành"
              : isStarted
              ? `${prog.completed}/${prog.total} bài ≥70`
              : "Chưa bắt đầu";

            const statusColor = isComplete
              ? "text-emerald-600"
              : isStarted
              ? "text-[#4DA8DA]"
              : "text-[var(--text-muted)] opacity-60";

            const ctaLabel = isComplete ? "Ôn lại" : isStarted ? "Tiếp tục" : "Bắt đầu";
            const ctaIcon = isStarted && !isComplete ? "play_arrow" : "arrow_forward";

            const listeningParts = test.parts.filter((p) => p.partNumber <= 4);
            const readingParts = test.parts.filter((p) => p.partNumber > 4);

            return (
              <Link
                key={test.id}
                href={`/test/${test.slug}`}
                className="group bg-[var(--bg-elevated)] border border-[var(--border)] border-t-2 border-t-[#4DA8DA] rounded-xl p-5 flex flex-col justify-between hover:shadow-sm transition-all"
                style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              >
                <div>
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-2.5 bg-[#4DA8DA]/10 rounded-lg text-[#4DA8DA]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{test.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    {test.year && `EST ${test.year} • `}200 Questions • 120 Mins
                  </p>

                  {/* Part chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {listeningParts.length > 0 && (
                      <div className="px-2.5 py-1 bg-[var(--bg-secondary)]/60 rounded text-[var(--text-secondary)] text-xs font-medium flex items-center gap-1">
                        <span>🎧</span> Part 1–{listeningParts[listeningParts.length - 1].partNumber}
                      </div>
                    )}
                    {readingParts.length > 0 && (
                      <div className="px-2.5 py-1 bg-[var(--bg-secondary)]/60 rounded text-[var(--text-secondary)] text-xs font-medium flex items-center gap-1">
                        <span>📖</span> Part 5–7
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <CircleProgress percent={percent} />
                    <span className="text-xs text-[var(--text-muted)]">
                      {isComplete ? "Hoàn thành" : isStarted ? "Đang học" : "Chưa học"}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold text-[#4DA8DA] group-hover:gap-2 transition-all">
                    {ctaLabel}
                    <span className="text-base">
                      {ctaIcon === "play_arrow" ? "▶" : "→"}
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
