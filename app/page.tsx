import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Flame, BookCheck, ChevronRight, Headphones, Image, MessageSquare, Users, Megaphone, BookOpen } from "lucide-react";

const SOFT_DEPTH = "0 10px 30px -10px rgba(14,165,233,0.1), 0 4px 6px -2px rgba(14,165,233,0.05)";

const PARTS = [
  { part: 1, Icon: Image,         name: "Photographs",       desc: "6 câu / đề" },
  { part: 2, Icon: MessageSquare, name: "Question-Response", desc: "25 câu / đề" },
  { part: 3, Icon: Users,         name: "Conversations",     desc: "39 câu / đề" },
  { part: 4, Icon: Megaphone,     name: "Talks",             desc: "30 câu / đề" },
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let profile = null;
  let seriesList: any[] = [];
  let totalCompleted = 0;
  let seriesProgress: Record<string, { total: number; completed: number }> = {};

  try {
    const [profileData, seriesData, progressCounts] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: user.id },
        select: { displayName: true, currentStreak: true },
      }),
      prisma.testSeries.findMany({
        orderBy: { orderIndex: "asc" },
        include: { testSets: { select: { id: true } } },
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

    const allTestSetIds = seriesList.flatMap((s: any) => s.testSets.map((t: any) => t.id));
    if (allTestSetIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: { part: { testSetId: { in: allTestSetIds } } },
        select: {
          id: true,
          part: { select: { testSet: { select: { id: true, seriesId: true } } } },
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

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-10">

        {/* Welcome */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-[var(--text-primary)] leading-[48px] tracking-[-0.02em] mb-2">
                Xin chào, {displayName}! 👋
              </h1>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-7">
                Luyện nghe chủ động — phương pháp hiệu quả nhất để nâng cấp kỹ năng nghe TOEIC của bạn mỗi ngày.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div
                className="bg-[var(--bg-elevated)] px-6 py-3 rounded-xl border border-[var(--border)] flex items-center gap-3"
                style={{ boxShadow: SOFT_DEPTH }}
              >
                <Flame size={22} className="text-[#0ea5e9]" style={{ fill: "rgba(14,165,233,0.15)" }} />
                <div>
                  <p className="text-xs font-semibold tracking-[0.05em] text-[var(--text-secondary)] uppercase">Ngày Streak</p>
                  <p className="text-2xl font-bold text-[#0ea5e9] leading-8">{streak} ngày</p>
                </div>
              </div>
              <div
                className="bg-[var(--bg-elevated)] px-6 py-3 rounded-xl border border-[var(--border)] flex items-center gap-3"
                style={{ boxShadow: SOFT_DEPTH }}
              >
                <BookCheck size={22} className="text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs font-semibold tracking-[0.05em] text-[var(--text-secondary)] uppercase">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-[var(--text-muted)] leading-8">{totalCompleted} bài</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parts */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Headphones size={20} className="text-[#0ea5e9]" />
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Luyện tập theo Part</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PARTS.map(({ part, Icon, name, desc }) => (
              <Link
                key={part}
                href={`/practice/part-${part}`}
                className="group flex flex-col items-start p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl transition-all hover:-translate-y-0.5 text-left"
                style={{ boxShadow: SOFT_DEPTH }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center mb-3">
                  <Icon size={22} className="text-[#0ea5e9]" />
                </div>
                <p className="text-base font-bold text-[var(--text-primary)]">Part {part}</p>
                <p className="text-sm text-[var(--text-secondary)]">{name}</p>
                <p className="text-xs font-semibold tracking-[0.05em] text-[var(--text-muted)] uppercase mt-2">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Series */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-[#0ea5e9]" />
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Chọn bộ đề</h2>
            </div>
            <span className="text-sm text-[var(--text-muted)]">{seriesList.length} bộ đề</span>
          </div>

          {seriesList.length === 0 ? (
            <div
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-12 text-center"
              style={{ boxShadow: SOFT_DEPTH }}
            >
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Chưa có bộ đề nào</h3>
              <p className="text-sm text-[var(--text-secondary)]">Admin cần import nội dung để bắt đầu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {seriesList.map((series) => {
                const prog = seriesProgress[series.id] ?? { total: 0, completed: 0 };
                const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
                const testCount = series.testSets.length;
                const isComplete = percent === 100 && prog.total > 0;
                const isStarted = prog.completed > 0;

                return (
                  <Link
                    key={series.id}
                    href={`/series/${series.slug}`}
                    className="group flex flex-col p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ boxShadow: SOFT_DEPTH }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center border border-[#0ea5e9]/20 flex-shrink-0">
                          <span className="text-2xl">{series.icon ?? "📚"}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[var(--text-primary)] leading-snug">{series.name}</h3>
                          <p className="text-xs font-semibold tracking-[0.05em] text-[var(--text-secondary)] uppercase mt-0.5">
                            {series.publisher}{series.year ? ` · ${series.year}` : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-[#0ea5e9] transition-colors flex-shrink-0 mt-1" />
                    </div>

                    {/* Description */}
                    {series.description && (
                      <p className="text-sm text-[var(--text-secondary)] leading-5 mb-6 line-clamp-2">{series.description}</p>
                    )}

                    {/* Progress */}
                    <div className="mt-auto">
                      <div className="flex justify-between text-[13px] text-[var(--text-muted)] font-medium mb-2">
                        <span>{testCount} đề thi</span>
                        <span>{prog.completed}/{prog.total} bài ≥70</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-[#0ea5e9] rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#0ea5e9]">{percent}%</span>
                        {isComplete ? (
                          <span className="text-sm font-semibold text-emerald-600">✓ Hoàn thành</span>
                        ) : isStarted ? (
                          <span className="text-sm text-[var(--text-muted)]">Đang học</span>
                        ) : (
                          <span className="text-sm font-bold text-[#0ea5e9] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                            Bắt đầu →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
