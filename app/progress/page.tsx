import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeatmapCalendar } from "@/components/progress/HeatmapCalendar";
import { LevelMatrix } from "@/components/progress/LevelMatrix";
import { AchievementBadge } from "@/components/progress/AchievementBadge";
import { ACHIEVEMENTS, type Achievement } from "@/lib/achievements";
import { Flame, Clock, Star, BookCheck, TrendingUp, RotateCcw } from "lucide-react";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, allProgress, allLessons, seriesList] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { displayName: true, currentStreak: true, toeicTarget: true },
    }),
    prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            audioUrl: true,
            part: {
              select: {
                partNumber: true,
                testSet: { select: { slug: true, seriesId: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        part: {
          select: {
            partNumber: true,
            testSet: { select: { slug: true } },
          },
        },
      },
    }),
    prisma.testSeries.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        testSets: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  ]);

  // ── Overview stats ───────────────────────────────────────────────────────
  const completedProgress = allProgress.filter((p) => p.status === "completed" && p.score >= 70);
  const uniqueCompletedLessons = new Set(completedProgress.map((p) => p.lessonId));
  const totalCompletedLessons = uniqueCompletedLessons.size;
  const totalLessons = allLessons.length;

  const allScores = completedProgress.map((p) => p.score);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  const totalTimeSeconds = allProgress.reduce((s, p) => s + (p.timeSpentSeconds ?? 0), 0);
  const totalTimeHours = (totalTimeSeconds / 3600).toFixed(1);

  const totalAttempts = allProgress.reduce((s, p) => s + p.attempts, 0);

  // ── Heatmap ─────────────────────────────────────────────────────────────
  const activityMap: Record<string, number> = {};
  for (const p of completedProgress) {
    const day = (p.completedAt ?? p.updatedAt).toISOString().split("T")[0];
    activityMap[day] = (activityMap[day] ?? 0) + 1;
  }

  // ── Level matrix ─────────────────────────────────────────────────────────
  // matrix[partNumber][level] = { completed, total }
  const lessonsByPart: Record<number, string[]> = {};
  for (const lesson of allLessons) {
    const pn = lesson.part.partNumber;
    if (!lessonsByPart[pn]) lessonsByPart[pn] = [];
    lessonsByPart[pn].push(lesson.id);
  }

  const LEVELS_BY_PART: Record<number, number[]> = { 1: [1, 2], 2: [1, 2], 3: [1, 2, 3, 4], 4: [1, 2, 3, 4] };
  const matrix: Record<number, Record<number, { completed: number; total: number }>> = {};
  for (const part of [1, 2, 3, 4]) {
    matrix[part] = {};
    for (const lvl of LEVELS_BY_PART[part]) {
      const total = lessonsByPart[part]?.length ?? 0;
      const completed = new Set(
        completedProgress
          .filter((p) => p.level === lvl && lessonsByPart[part]?.includes(p.lessonId))
          .map((p) => p.lessonId)
      ).size;
      matrix[part][lvl] = { completed, total };
    }
  }

  // ── Weak lessons (lowest bestScore, attempted) ──────────────────────────
  const lessonBestScore: Record<string, { bestScore: number; title: string; slug: string; partNumber: number }> = {};
  for (const p of allProgress) {
    if (p.attempts === 0) continue;
    const lid = p.lessonId;
    const existing = lessonBestScore[lid];
    if (!existing || p.bestScore < existing.bestScore) {
      lessonBestScore[lid] = {
        bestScore: p.bestScore,
        title: p.lesson.title,
        slug: p.lesson.part.testSet.slug,
        partNumber: p.lesson.part.partNumber,
      };
    }
  }
  const weakLessons = Object.entries(lessonBestScore)
    .filter(([, v]) => v.bestScore < 70)
    .sort(([, a], [, b]) => a.bestScore - b.bestScore)
    .slice(0, 8)
    .map(([id, v]) => ({ id, ...v }));

  // ── Achievements ─────────────────────────────────────────────────────────
  const streak = profile?.currentStreak ?? 0;
  const hasPerfect = allProgress.some((p) => p.bestScore === 100);
  const partsWithCompletion = new Set(
    completedProgress.map((p) => p.lesson.part.partNumber)
  );
  const completedTestSets = new Set<string>();
  for (const series of seriesList) {
    for (const ts of series.testSets) {
      const tsLessons = allLessons.filter((l) => l.part.testSet.slug === ts.slug);
      const tsCompleted = tsLessons.every((l) => uniqueCompletedLessons.has(l.id));
      if (tsCompleted && tsLessons.length > 0) completedTestSets.add(ts.id);
    }
  }

  // Max lessons in a single day
  const maxInDay = Math.max(0, ...Object.values(activityMap));

  const achievements: Achievement[] = ACHIEVEMENTS.map((a) => {
    switch (a.id) {
      case "first_lesson":
        return { ...a, unlocked: totalCompletedLessons >= 1 };
      case "ten_lessons":
        return { ...a, unlocked: totalCompletedLessons >= 10, progress: Math.min(100, (totalCompletedLessons / 10) * 100) };
      case "fifty_lessons":
        return { ...a, unlocked: totalCompletedLessons >= 50, progress: Math.min(100, (totalCompletedLessons / 50) * 100) };
      case "hundred":
        return { ...a, unlocked: totalCompletedLessons >= 100, progress: Math.min(100, (totalCompletedLessons / 100) * 100) };
      case "streak7":
        return { ...a, unlocked: streak >= 7, progress: Math.min(100, (streak / 7) * 100) };
      case "streak30":
        return { ...a, unlocked: streak >= 30, progress: Math.min(100, (streak / 30) * 100) };
      case "perfect":
        return { ...a, unlocked: hasPerfect };
      case "all_parts":
        return { ...a, unlocked: partsWithCompletion.size >= 4, progress: (partsWithCompletion.size / 4) * 100 };
      case "speed_demon":
        return { ...a, unlocked: maxInDay >= 5, progress: Math.min(100, (maxInDay / 5) * 100) };
      case "full_test":
        return { ...a, unlocked: completedTestSets.size >= 1 };
      default:
        return { ...a, unlocked: false };
    }
  }).sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // ── Series progress ───────────────────────────────────────────────────────
  const seriesProgressData = seriesList.map((series) => {
    const tsIds = series.testSets.map((t) => t.id);
    const seriesLessons = allLessons.filter((l) =>
      series.testSets.some((t) => t.slug === l.part.testSet.slug)
    );
    const completedCount = seriesLessons.filter((l) => uniqueCompletedLessons.has(l.id)).length;
    const pct = seriesLessons.length > 0 ? Math.round((completedCount / seriesLessons.length) * 100) : 0;
    return { ...series, completedCount, total: seriesLessons.length, pct };
  });

  const PART_ICONS: Record<number, string> = { 1: "🖼️", 2: "💬", 3: "🗣️", 4: "📢" };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8 space-y-10">

        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-1">Tiến độ học tập</h1>
          <p className="text-sm text-[var(--text-muted)]">Tổng quan chi tiết quá trình luyện nghe TOEIC của bạn</p>
        </div>

        {/* ── Overview stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<BookCheck size={18} />} label="Bài hoàn thành" value={`${totalCompletedLessons}/${totalLessons}`} color="text-emerald-400" />
          <StatCard icon={<Star size={18} />} label="Điểm trung bình" value={avgScore > 0 ? `${avgScore}` : "—"} color="text-yellow-400" />
          <StatCard icon={<Flame size={18} />} label="Streak hiện tại" value={`${streak} ngày`} color="text-orange-400" />
          <StatCard icon={<Clock size={18} />} label="Thời gian học" value={`${totalTimeHours}h`} color="text-blue-400" />
        </div>

        {/* ── Heatmap ── */}
        <Section title="📅 Lịch học tập" subtitle="26 tuần gần nhất">
          <HeatmapCalendar activityMap={activityMap} />
        </Section>

        {/* ── Level matrix ── */}
        <Section title="📊 Tiến độ theo Level" subtitle="% bài đạt ≥70 cho từng Part × Level">
          <LevelMatrix matrix={matrix} />
        </Section>

        {/* ── Series progress ── */}
        <Section title="📚 Tiến độ theo bộ đề" subtitle="">
          <div className="space-y-4">
            {seriesProgressData.map((series) => (
              <div key={series.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${series.color} flex items-center justify-center text-lg flex-shrink-0`}>
                    {series.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[var(--text-primary)]">{series.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{series.completedCount}/{series.total} bài ≥70 · {series.pct}%</div>
                  </div>
                  <Link href={`/series/${series.slug}`} className="text-xs text-[var(--accent-primary)] hover:underline">
                    Xem đề →
                  </Link>
                </div>
                <div className="progress-bar" style={{ height: "6px" }}>
                  <div className="progress-bar-fill" style={{ width: `${series.pct}%` }} />
                </div>
                {/* Per test set */}
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {series.testSets.map((ts, i) => {
                    const tsLessons = allLessons.filter((l) => l.part.testSet.slug === ts.slug);
                    const done = tsLessons.filter((l) => uniqueCompletedLessons.has(l.id)).length;
                    const pct = tsLessons.length > 0 ? Math.round((done / tsLessons.length) * 100) : 0;
                    return (
                      <Link key={ts.id} href={`/test/${ts.slug}`} className="group text-center">
                        <div className={`h-1.5 rounded-full mb-1 transition-all ${pct === 100 ? "bg-emerald-400" : pct > 0 ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-tertiary)]"}`}
                          style={{ width: "100%" }} />
                        <div className="text-[9px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                          T{i + 1}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Weak lessons ── */}
        {weakLessons.length > 0 && (
          <Section title="🔁 Bài cần ôn lại" subtitle="Bài đã thử nhưng chưa đạt ≥70">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {weakLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/test/${lesson.slug}/${lesson.id}`}
                  className="card card-interactive p-4 flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-400/20 flex items-center justify-center flex-shrink-0 text-base">
                    {PART_ICONS[lesson.partNumber]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{lesson.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Best score: <span className="text-orange-400 font-mono font-bold">{lesson.bestScore}</span></div>
                  </div>
                  <RotateCcw size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* ── Achievements ── */}
        <Section title={`🏆 Thành tích (${unlockedCount}/${achievements.length})`} subtitle="">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((a) => (
              <AchievementBadge key={a.id} achievement={a} />
            ))}
          </div>
        </Section>

        {/* ── Extra stats ── */}
        <Section title="📈 Thống kê thêm" subtitle="">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MiniStat label="Tổng lần thử" value={totalAttempts.toString()} />
            <MiniStat label="Bài đã mở" value={new Set(allProgress.map((p) => p.lessonId)).size.toString()} />
            <MiniStat label="Thành tích mở khóa" value={`${unlockedCount}/${achievements.length}`} />
            <MiniStat label="Điểm cao nhất" value={allScores.length > 0 ? Math.max(...allScores).toString() : "—"} />
            <MiniStat label="Ngày hoạt động" value={Object.values(activityMap).filter((n) => n > 0).length.toString()} />
            <MiniStat label="Bài/ngày TB" value={
              (() => {
                const activeDays = Object.values(activityMap).filter((n) => n > 0).length;
                return activeDays > 0 ? (totalCompletedLessons / activeDays).toFixed(1) : "—";
              })()
            } />
          </div>
        </Section>

      </main>
      <Footer />
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="card p-5">{children}</div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className={`${color}`}>{icon}</div>
      <div className="font-display font-bold text-2xl text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="font-display font-bold text-xl text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
    </div>
  );
}
