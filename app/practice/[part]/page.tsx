import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { ArrowLeft, ChevronRight } from "lucide-react";

const PART_INFO: Record<string, {
  icon: string; label: string; sub: string; partNumber: number; gradient: string;
}> = {
  "part-1": { icon: "📷", label: "Part 1", sub: "Photographs",       partNumber: 1, gradient: "from-rose-500 to-pink-600"     },
  "part-2": { icon: "💬", label: "Part 2", sub: "Question–Response", partNumber: 2, gradient: "from-orange-500 to-amber-600"  },
  "part-3": { icon: "🗣️", label: "Part 3", sub: "Conversations",     partNumber: 3, gradient: "from-indigo-500 to-violet-600" },
  "part-4": { icon: "📢", label: "Part 4", sub: "Talks",             partNumber: 4, gradient: "from-emerald-500 to-teal-600"  },
};

const CARD_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-blue-500 to-cyan-600",
  "from-violet-500 to-purple-600",
  "from-green-500 to-emerald-600",
  "from-yellow-500 to-orange-600",
  "from-red-500 to-rose-600",
  "from-sky-500 to-blue-600",
];

export default async function PartPracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ part: string }>;
  searchParams: Promise<{ set?: string }>;
}) {
  const { part } = await params;
  const { set: selectedSet } = await searchParams;
  const info = PART_INFO[part];
  if (!info) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/practice/${part}`);

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { displayName: true } })
    .catch(() => null);

  // All lessons for this part with timestamps (exclude part2-practice sets)
  const lessons = await prisma.lesson.findMany({
    where: {
      part: {
        partNumber: info.partNumber,
        testSet: { series: { slug: { not: "part2-practice" } } },
      },
      sentences: { some: { startTime: { gt: 0 } } },
    },
    include: {
      part: {
        select: {
          testSet: {
            select: {
              id: true, name: true, slug: true, orderIndex: true,
              series: { select: { id: true, name: true, slug: true, orderIndex: true } },
            },
          },
        },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  lessons.sort(
    (a, b) =>
      (a.part.testSet.series.orderIndex ?? 0) - (b.part.testSet.series.orderIndex ?? 0) ||
      (a.part.testSet.orderIndex ?? 0) - (b.part.testSet.orderIndex ?? 0) ||
      a.orderIndex - b.orderIndex
  );

  // Progress for all lessons
  const lessonIds = lessons.map((l) => l.id);
  const progress = lessonIds.length > 0
    ? await prisma.userProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessonIds }, level: 1 },
        select: { lessonId: true, bestScore: true },
      })
    : [];
  const progressMap = Object.fromEntries(progress.map((p) => [p.lessonId, p.bestScore]));
  const completedCount = progress.filter((p) => p.bestScore >= 70).length;

  // --- Filtered view: show lessons for a specific test set ---
  if (selectedSet) {
    const filteredLessons = lessons.filter((l) => l.part.testSet.slug === selectedSet);
    const setName = filteredLessons[0]?.part.testSet.name ?? selectedSet;

    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        <Header userEmail={user.email} userDisplayName={profile?.displayName} />
        <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8">
          <Link
            href={`/practice/${part}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={15} />
            {info.label} — Tất cả bộ đề
          </Link>

          <div className={`relative rounded-[var(--radius-xl)] overflow-hidden mb-8 bg-gradient-to-br ${info.gradient} p-6 md:p-8`}>
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="text-4xl mb-3">{info.icon}</div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-1">{setName}</h1>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                  {filteredLessons.filter((l) => (progressMap[l.id] ?? 0) >= 70).length}/{filteredLessons.length} bài ≥70
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Danh sách bài luyện tập</h2>
            <span className="text-sm text-[var(--text-muted)]">{filteredLessons.length} bài</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLessons.map((lesson, i) => {
              const bestScore = progressMap[lesson.id];
              const done = bestScore !== undefined && bestScore >= 70;
              const percent = bestScore !== undefined ? Math.min(bestScore, 100) : 0;
              return (
                <Link
                  key={lesson.id}
                  href={`/practice/${part}/${lesson.id}`}
                  className="card card-interactive p-5 flex flex-col gap-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-display font-bold text-sm">{lesson.questionStart ?? i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight truncate">{lesson.title}</div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-4">
                    <ProgressRing percent={percent} size={60} strokeWidth={5} color={done ? "var(--accent-green)" : "var(--accent-primary)"} />
                    <div className="flex-1 text-xs text-[var(--text-secondary)]">
                      {bestScore !== undefined ? `Điểm: ${bestScore}/100` : "Chưa làm"}
                    </div>
                  </div>
                  <div>
                    <div className="progress-bar" style={{ height: "4px" }}>
                      <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-1.5 text-right text-xs font-medium">
                      {bestScore === undefined ? (
                        <span className="text-[var(--accent-primary)]">Bắt đầu →</span>
                      ) : done ? (
                        <span className="text-[var(--accent-green)]">✅ Hoàn thành</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Đang học</span>
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

  // --- Default view: grouped overview ---

  // Build series → testSet groups with aggregate progress
  type TestSetGroup = {
    id: string; name: string; slug: string; orderIndex: number;
    total: number; completed: number;
  };
  type SeriesGroup = {
    id: string; name: string; slug: string; orderIndex: number;
    testSets: TestSetGroup[];
  };
  const seriesMap = new Map<string, SeriesGroup>();
  const testSetMap = new Map<string, TestSetGroup>();

  for (const lesson of lessons) {
    const ts = lesson.part.testSet;
    const sr = ts.series;
    if (!seriesMap.has(sr.id)) {
      seriesMap.set(sr.id, { id: sr.id, name: sr.name, slug: sr.slug, orderIndex: sr.orderIndex ?? 0, testSets: [] });
    }
    if (!testSetMap.has(ts.id)) {
      const group: TestSetGroup = { id: ts.id, name: ts.name, slug: ts.slug, orderIndex: ts.orderIndex ?? 0, total: 0, completed: 0 };
      testSetMap.set(ts.id, group);
      seriesMap.get(sr.id)!.testSets.push(group);
    }
    const group = testSetMap.get(ts.id)!;
    group.total++;
    if ((progressMap[lesson.id] ?? -1) >= 70) group.completed++;
  }
  const seriesGroups = [...seriesMap.values()]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({ ...s, testSets: s.testSets.sort((a, b) => a.orderIndex - b.orderIndex) }));

  // Part 2: fetch practice series (loại câu hỏi)
  let practiceGroups: Array<{ id: string; name: string; slug: string; total: number; completed: number }> = [];
  if (info.partNumber === 2) {
    const practiceSeries = await prisma.testSeries.findUnique({
      where: { slug: "part2-practice" },
      include: {
        testSets: {
          orderBy: { orderIndex: "asc" },
          select: { id: true, name: true, slug: true },
        },
      },
    }).catch(() => null);

    if (practiceSeries) {
      const practiceSetIds = practiceSeries.testSets.map((t) => t.id);
      const practiceLessons = await prisma.lesson.findMany({
        where: { part: { testSetId: { in: practiceSetIds } } },
        select: { id: true, part: { select: { testSetId: true } } },
      });
      const practiceLessonIds = practiceLessons.map((l) => l.id);
      const practiceProgress = practiceLessonIds.length > 0
        ? await prisma.userProgress.findMany({
            where: { userId: user.id, lessonId: { in: practiceLessonIds }, level: 1 },
            select: { lessonId: true, bestScore: true },
          })
        : [];
      const practiceProgressMap = Object.fromEntries(practiceProgress.map((p) => [p.lessonId, p.bestScore]));

      practiceGroups = practiceSeries.testSets.map((ts) => {
        const tsLessons = practiceLessons.filter((l) => l.part.testSetId === ts.id);
        const completed = tsLessons.filter((l) => (practiceProgressMap[l.id] ?? -1) >= 70).length;
        return { id: ts.id, name: ts.name, slug: ts.slug, total: tsLessons.length, completed };
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Luyện tập theo Part
        </Link>

        {/* Header banner */}
        <div className={`relative rounded-[var(--radius-xl)] overflow-hidden mb-8 bg-gradient-to-br ${info.gradient} p-6 md:p-8`}>
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="text-4xl mb-3">{info.icon}</div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-1">
              {info.label} — {info.sub}
            </h1>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white">
                {completedCount}/{lessons.length} bài hoàn thành (Level 1 ≥70)
              </span>
            </div>
          </div>
        </div>

        {/* Part 2: Theo loại câu hỏi */}
        {practiceGroups.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Theo loại câu hỏi</h2>
              <Link href="/series/part2-practice" className="text-sm text-[var(--accent-primary)] hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {practiceGroups.map((group, i) => {
                const percent = group.total > 0 ? (group.completed / group.total) * 100 : 0;
                return (
                  <Link
                    key={group.id}
                    href={`/test/${group.slug}`}
                    className="card card-interactive p-5 flex flex-col gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-display font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">{group.name}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{group.total} bài</div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-4">
                      <ProgressRing percent={percent} size={60} strokeWidth={5} color={percent === 100 ? "var(--accent-green)" : "var(--accent-primary)"} />
                      <div className="flex-1 text-xs text-[var(--text-secondary)]">
                        {group.completed}/{group.total} bài ≥70
                      </div>
                    </div>
                    <div>
                      <div className="progress-bar" style={{ height: "4px" }}>
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-1.5 text-right text-xs font-medium">
                        {percent === 0 ? (
                          <span className="text-[var(--accent-primary)]">Bắt đầu →</span>
                        ) : percent === 100 ? (
                          <span className="text-[var(--accent-green)]">✅ Hoàn thành</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">Đang học</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Theo bộ đề — grouped by series */}
        <section>
          <div className="mb-6">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Theo bộ đề</h2>
          </div>

          {seriesGroups.length === 0 ? (
            <div className="rounded-2xl border py-20 flex flex-col items-center text-center border-[var(--border)] bg-[var(--bg-elevated)]">
              <div className="text-5xl mb-4">{info.icon}</div>
              <p className="text-base font-medium mb-1 text-[var(--text-primary)]">Chưa có bài luyện tập nào</p>
              <p className="text-sm max-w-xs text-[var(--text-muted)]">Nội dung đang được chuẩn bị. Quay lại sau nhé!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {seriesGroups.map((series) => (
                <div key={series.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display font-semibold text-base text-[var(--text-secondary)]">{series.name}</h3>
                    <span className="text-sm text-[var(--text-muted)]">{series.testSets.length} bộ</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {series.testSets.map((group, i) => {
                const percent = group.total > 0 ? (group.completed / group.total) * 100 : 0;
                return (
                  <Link
                    key={group.id}
                    href={`/practice/${part}?set=${group.slug}`}
                    className="card card-interactive p-5 flex flex-col gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-display font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">{group.name}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">{group.total} bài</div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-4">
                      <ProgressRing percent={percent} size={60} strokeWidth={5} color={percent === 100 ? "var(--accent-green)" : "var(--accent-primary)"} />
                      <div className="flex-1 text-xs text-[var(--text-secondary)]">
                        {group.completed}/{group.total} bài ≥70
                      </div>
                    </div>
                    <div>
                      <div className="progress-bar" style={{ height: "4px" }}>
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-1.5 text-right text-xs font-medium">
                        {percent === 0 ? (
                          <span className="text-[var(--accent-primary)]">Bắt đầu →</span>
                        ) : percent === 100 ? (
                          <span className="text-[var(--accent-green)]">✅ Hoàn thành</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">Đang học</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
