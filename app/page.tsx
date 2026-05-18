import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Flame, BookCheck, Star, ChevronRight, Headphones } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let profile = null;
  let seriesList: any[] = [];
  let totalCompleted = 0;
  let avgScore = 0;
  let seriesProgress: Record<string, { total: number; completed: number }> = {};

  try {
    const [profileData, seriesData, progressCounts] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: user.id },
        select: { displayName: true, currentStreak: true },
      }),
      prisma.testSeries.findMany({
        orderBy: { orderIndex: "asc" },
        include: {
          testSets: {
            select: { id: true },
          },
        },
      }),
      prisma.userProgress.groupBy({
        by: ["lessonId"],
        where: { userId: user.id, status: "completed", score: { gte: 70 } },
        _count: true,
      }),
    ]);

    profile = profileData;
    seriesList = seriesData;
    totalCompleted = progressCounts.length;
    const completedLessonIds = new Set(progressCounts.map((p) => p.lessonId));

    const allProgress = await prisma.userProgress.findMany({
      where: { userId: user.id, status: "completed" },
      select: { score: true },
    });
    avgScore = allProgress.length > 0
      ? Math.round(allProgress.reduce((sum, p) => sum + p.score, 0) / allProgress.length)
      : 0;

    // Progress per series
    const allTestSetIds = seriesList.flatMap((s: any) => s.testSets.map((t: any) => t.id));
    if (allTestSetIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { part: { testSetId: { in: allTestSetIds } } },
        select: {
          id: true,
          part: {
            select: {
              testSet: { select: { id: true, seriesId: true } },
            },
          },
        },
      });

      for (const lesson of lessons) {
        const sid = lesson.part.testSet.seriesId;
        if (!seriesProgress[sid]) seriesProgress[sid] = { total: 0, completed: 0 };
        seriesProgress[sid].total++;
        if (completedLessonIds.has(lesson.id)) seriesProgress[sid].completed++;
      }
    }
  } catch (err) {
    console.error("DB error:", err);
  }

  const displayName = profile?.displayName ?? user.email?.split("@")[0] ?? "bạn";
  const streak = profile?.currentStreak ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8">

        {/* Hero Banner */}
        <div className="relative rounded-[var(--radius-xl)] overflow-hidden mb-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 md:p-8">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute right-24 top-4 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-1">
              Xin chào, {displayName}! 👋
            </h2>
            <p className="text-indigo-200 text-sm md:text-base mb-6 max-w-md">
              Luyện nghe chủ động — phương pháp hiệu quả nhất để tăng điểm TOEIC Listening.
            </p>
            <div className="flex flex-wrap gap-3">
              <StatChip icon={<Flame size={16} />} label={`${streak} ngày streak`} color="bg-orange-400/20 text-orange-200" />
              <StatChip icon={<BookCheck size={16} />} label={`${totalCompleted} bài hoàn thành`} color="bg-green-400/20 text-green-200" />
              <StatChip icon={<Star size={16} />} label={avgScore > 0 ? `Điểm TB: ${avgScore}` : "Bắt đầu luyện tập!"} color="bg-yellow-400/20 text-yellow-200" />
            </div>
          </div>
        </div>

        {/* Luyện tập theo Part */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Headphones size={20} className="text-[var(--accent-primary)]" />
            <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
              Luyện tập theo Part
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                { part: 1, icon: "🖼️", name: "Photographs", desc: "6 câu / đề" },
                { part: 2, icon: "💬", name: "Question-Response", desc: "25 câu / đề" },
                { part: 3, icon: "🗣️", name: "Conversations", desc: "39 câu / đề" },
                { part: 4, icon: "📢", name: "Talks", desc: "30 câu / đề" },
              ] as const
            ).map(({ part, icon, name, desc }) => (
              <Link
                key={part}
                href={`/practice/part-${part}`}
                className="card card-interactive p-4 flex flex-col gap-2 group"
              >
                <div className="text-2xl">{icon}</div>
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">Part {part}</div>
                  <div className="text-xs text-[var(--text-secondary)] leading-tight">{name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{desc}</div>
                </div>
                <div className="flex items-center gap-1 mt-auto text-xs text-[var(--accent-primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Luyện tập <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Series list */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
            📚 Chọn bộ đề
          </h3>
          <span className="text-sm text-[var(--text-muted)]">{seriesList.length} bộ đề</span>
        </div>

        {seriesList.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {seriesList.map((series) => {
              const prog = seriesProgress[series.id] ?? { total: 0, completed: 0 };
              const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
              const testCount = series.testSets.length;

              return (
                <Link
                  key={series.id}
                  href={`/series/${series.slug}`}
                  className="card card-interactive p-6 flex flex-col gap-5 animate-slide-up group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${series.color} flex items-center justify-center flex-shrink-0 text-2xl shadow-lg`}>
                      {series.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-lg text-[var(--text-primary)] leading-tight">
                        {series.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {series.publisher}{series.year ? ` · ${series.year}` : ""}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Description */}
                  {series.description && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {series.description}
                    </p>
                  )}

                  {/* Stats + progress */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                      <span>{testCount} đề thi</span>
                      <span>{prog.completed}/{prog.total} bài ≥70</span>
                    </div>
                    <div className="progress-bar" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-mono font-bold ${percent > 0 ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`}>
                        {percent}%
                      </span>
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
        )}
      </main>

      <Footer />
    </div>
  );
}

function StatChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
      {icon}
      {label}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">Chưa có bộ đề nào</h3>
      <p className="text-sm text-[var(--text-secondary)]">
        Admin cần import nội dung để bắt đầu.
      </p>
    </div>
  );
}
