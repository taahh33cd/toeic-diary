import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-10">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6e7881] hover:text-[#0b1c30] transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Tất cả bộ đề
        </Link>

        {/* Series header */}
        <div className="bg-white border border-[#bec8d2] rounded-xl p-6 md:p-8 mb-8"
          style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={26} className="text-[#0ea5e9]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-[#0b1c30] leading-tight">
                {series.name}
              </h1>
              {series.description && (
                <p className="text-sm text-[#6e7881] mt-1">{series.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#006591] border border-[#0ea5e9]/20">
              {series.publisher}
            </span>
            {series.year && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#006591] border border-[#0ea5e9]/20">
                {series.year}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#006591] border border-[#0ea5e9]/20">
              {completedTests}/{totalTests} đề hoàn thành
            </span>
          </div>
        </div>

        {/* Test sets grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#0b1c30]">Danh sách đề thi</h2>
          <span className="text-sm text-[#6e7881]">{totalTests} đề</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {series.testSets.map((test, i) => {
            const prog = testProgress[test.id] ?? { total: 0, completed: 0 };
            const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            const isComplete = percent === 100 && prog.total > 0;

            return (
              <Link
                key={test.id}
                href={`/test/${test.slug}`}
                className="group bg-white border border-[#bec8d2] rounded-xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
              >
                {/* Top row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#0ea5e9]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#0b1c30] leading-tight truncate">
                      {test.name}
                    </div>
                    <div className="text-xs text-[#6e7881] mt-0.5">
                      {test.parts.map((p) => PART_ICONS[p.partNumber]).join(" ")}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#bec8d2] group-hover:text-[#0ea5e9] transition-colors flex-shrink-0" />
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-[#6e7881] mb-1.5">
                    <span>{prog.completed}/{prog.total} bài ≥70</span>
                    <span className={isComplete ? "text-emerald-600 font-semibold" : "font-medium text-[#006591]"}>
                      {isComplete ? "✓ Hoàn thành" : percent === 0 ? "Bắt đầu →" : `${percent}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0ea5e9] rounded-full transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
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
