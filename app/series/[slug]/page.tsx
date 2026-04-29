import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { ChevronRight, ArrowLeft } from "lucide-react";

const TEST_COLORS = [
  { bg: "from-indigo-500 to-purple-600" },
  { bg: "from-emerald-500 to-teal-600" },
  { bg: "from-orange-500 to-amber-600" },
  { bg: "from-rose-500 to-pink-600" },
  { bg: "from-blue-500 to-cyan-600" },
  { bg: "from-violet-500 to-purple-600" },
  { bg: "from-green-500 to-emerald-600" },
  { bg: "from-yellow-500 to-orange-600" },
  { bg: "from-red-500 to-rose-600" },
  { bg: "from-sky-500 to-blue-600" },
];

const PART_ICONS: Record<number, string> = { 1: "🖼️", 2: "💬", 3: "🗣️", 4: "📢" };

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

  // Progress per test set
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Tất cả bộ đề
        </Link>

        {/* Series header */}
        <div className={`relative rounded-[var(--radius-xl)] overflow-hidden mb-8 bg-gradient-to-br ${series.color} p-6 md:p-8`}>
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <div className="text-4xl mb-3">{series.icon}</div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-1">
              {series.name}
            </h1>
            {series.description && (
              <p className="text-white/70 text-sm md:text-base mb-4 max-w-lg">
                {series.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                {series.publisher}
              </span>
              {series.year && (
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                  {series.year}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                {completedTests}/{totalTests} đề hoàn thành
              </span>
            </div>
          </div>
        </div>

        {/* Test sets grid */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
            Danh sách đề thi
          </h2>
          <span className="text-sm text-[var(--text-muted)]">{totalTests} đề</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {series.testSets.map((test, i) => {
            const prog = testProgress[test.id] ?? { total: 0, completed: 0 };
            const percent = prog.total > 0 ? (prog.completed / prog.total) * 100 : 0;
            const color = TEST_COLORS[i % TEST_COLORS.length];

            return (
              <Link
                key={test.id}
                href={`/test/${test.slug}`}
                className="card card-interactive p-5 flex flex-col gap-4 animate-slide-up group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-display font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">
                      {test.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {test.parts.length} Parts
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center gap-4">
                  <ProgressRing percent={percent} size={60} strokeWidth={5} />
                  <div className="flex-1">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">
                      {prog.completed}/{prog.total} bài ≥70
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {test.parts.map((p) => (
                        <span key={p.id} className="text-xs text-[var(--text-muted)]">
                          {PART_ICONS[p.partNumber]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="progress-bar" style={{ height: "4px" }}>
                    <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="mt-1.5 text-right">
                    {percent === 0 ? (
                      <span className="text-xs text-[var(--accent-primary)] font-medium">Bắt đầu →</span>
                    ) : percent === 100 ? (
                      <span className="text-xs text-[var(--accent-green)] font-medium">✅ Hoàn thành</span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Đang học</span>
                    )}
                  </div>
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
