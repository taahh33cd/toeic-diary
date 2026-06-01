import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import { isUsageExempt } from "@/lib/access";
import { UsageGate } from "@/components/shared/UsageGate";

const PART_INFO: Record<string, {
  icon: string; label: string; sub: string; partNumber: number;
}> = {
  "part-1": { icon: "📷", label: "Part 1", sub: "Photographs",       partNumber: 1 },
  "part-2": { icon: "💬", label: "Part 2", sub: "Question–Response", partNumber: 2 },
  "part-3": { icon: "🗣️", label: "Part 3", sub: "Conversations",     partNumber: 3 },
  "part-4": { icon: "📢", label: "Part 4", sub: "Talks",             partNumber: 4 },
};

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const CIRCUMFERENCE = 2 * Math.PI * 18;

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

function FileIcon() {
  return (
    <div className="p-2.5 bg-[#4DA8DA]/10 rounded-lg text-[#4DA8DA] flex-shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
    .findUnique({ where: { id: user.id }, select: { displayName: true, role: true, studentCode: true, enrolledCourses: true, freeUsageSeconds: true } })
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

  // ── Filtered view: lessons for a specific test set ────────────────────────
  if (selectedSet) {
    const filteredLessons = lessons.filter((l) => l.part.testSet.slug === selectedSet);
    const setName = filteredLessons[0]?.part.testSet.name ?? selectedSet;
    const doneCount = filteredLessons.filter((l) => (progressMap[l.id] ?? -1) >= 70).length;

    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
        <UsageGate initialSeconds={profile?.freeUsageSeconds ?? 0} isExempt={isUsageExempt(profile)} />
        <Header userEmail={user.email} userDisplayName={profile?.displayName} />

        <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-10">

          {/* Hero — matches series page */}
          <section className="bg-[#4DA8DA] rounded-2xl p-8 md:p-10 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <nav className="flex items-center gap-1 text-xs text-white/80 mb-3">
                <Link href="/practice" className="hover:opacity-80 transition-opacity">Luyện tập</Link>
                <span className="text-white/60">›</span>
                <Link href={`/practice/${part}`} className="hover:opacity-80 transition-opacity">{info.label}</Link>
                <span className="text-white/60">›</span>
                <span className="text-white/90">{setName}</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">{setName}</h1>
              <p className="text-white/80 text-sm">{info.icon} {info.label} — {info.sub}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/30 bg-white/10 min-w-[90px]">
                <span className="text-2xl font-bold text-white">{filteredLessons.length}</span>
                <span className="text-xs text-white/80 mt-0.5">Tổng bài</span>
              </div>
              <div className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/30 bg-white/10 min-w-[90px]">
                <span className="text-2xl font-bold text-white">{doneCount}</span>
                <span className="text-xs text-white/80 mt-0.5">Hoàn thành</span>
              </div>
            </div>
          </section>

          <Link
            href={`/practice/${part}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            {info.label} — Tất cả bộ đề
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLessons.map((lesson) => {
              const bestScore = progressMap[lesson.id];
              const done = bestScore !== undefined && bestScore >= 70;
              const started = bestScore !== undefined;
              const percent = started ? Math.min(bestScore!, 100) : 0;

              const statusLabel = done
                ? "Hoàn thành"
                : started
                ? `${bestScore}/100 điểm`
                : "Chưa bắt đầu";
              const statusColor = done
                ? "text-emerald-600"
                : started
                ? "text-[#4DA8DA]"
                : "text-[var(--text-muted)] opacity-60";
              const ctaLabel = done ? "Ôn lại" : started ? "Tiếp tục" : "Bắt đầu";

              return (
                <Link
                  key={lesson.id}
                  href={`/practice/${part}/${lesson.id}`}
                  className="group bg-[var(--bg-elevated)] border border-[var(--border)] border-t-2 border-t-[#4DA8DA] rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all"
                  style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <FileIcon />
                      <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 leading-snug">{lesson.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4">{info.label} — {info.sub}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="px-2.5 py-1 bg-[var(--bg-secondary)]/60 rounded text-[var(--text-secondary)] text-xs font-medium flex items-center gap-1">
                        <span>🎧</span> {info.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2.5">
                      <CircleProgress percent={percent} />
                      <span className="text-xs text-[var(--text-muted)]">
                        {done ? "Hoàn thành" : started ? "Đang học" : "Chưa học"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-bold text-[#4DA8DA] group-hover:gap-2 transition-all">
                      {ctaLabel}
                      <span className="text-base">{started && !done ? "▶" : "→"}</span>
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

  // ── Default view: grouped overview ────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  function TestSetCard({ group, href }: { group: { id: string; name: string; slug: string; total: number; completed: number }; href: string }) {
    const percent = group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0;
    const isComplete = percent === 100 && group.total > 0;
    const isStarted = group.completed > 0;

    const statusLabel = isComplete
      ? "Hoàn thành"
      : isStarted
      ? `${group.completed}/${group.total} bài ≥70`
      : "Chưa bắt đầu";
    const statusColor = isComplete
      ? "text-emerald-600"
      : isStarted
      ? "text-[#4DA8DA]"
      : "text-[var(--text-muted)] opacity-60";
    const ctaLabel = isComplete ? "Ôn lại" : isStarted ? "Tiếp tục" : "Bắt đầu";

    return (
      <Link
        href={href}
        className="group bg-[var(--bg-elevated)] border border-[var(--border)] border-t-2 border-t-[#4DA8DA] rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all"
        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
      >
        <div>
          <div className="flex justify-between items-start mb-5">
            <FileIcon />
            <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{group.name}</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">{group.total} bài luyện tập</p>
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="px-2.5 py-1 bg-[var(--bg-secondary)]/60 rounded text-[var(--text-secondary)] text-xs font-medium flex items-center gap-1">
              <span>🎧</span> {info.label}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <CircleProgress percent={percent} />
            <span className="text-xs text-[var(--text-muted)]">
              {isComplete ? "Hoàn thành" : isStarted ? "Đang học" : "Chưa học"}
            </span>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-[#4DA8DA] group-hover:gap-2 transition-all">
            {ctaLabel}
            <span className="text-base">{isStarted && !isComplete ? "▶" : "→"}</span>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <UsageGate initialSeconds={profile?.freeUsageSeconds ?? 0} isExempt={isUsageExempt(profile)} />
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 md:px-6 py-10">

        {/* Hero banner — matches series page style */}
        <section className="bg-[#4DA8DA] rounded-2xl p-8 md:p-10 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <nav className="flex items-center gap-1 text-xs text-white/80 mb-3">
              <Link href="/practice" className="hover:opacity-80 transition-opacity">Luyện tập theo Part</Link>
              <span className="text-white/60">›</span>
              <span className="text-white/90">{info.label} — {info.sub}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
              {info.label} — {info.sub}
            </h1>
            <p className="text-white/80 text-sm">{info.icon} Luyện tập nghe theo từng bộ đề</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/30 bg-white/10 min-w-[90px]">
              <span className="text-2xl font-bold text-white">{lessons.length}</span>
              <span className="text-xs text-white/80 mt-0.5">Tổng bài</span>
            </div>
            <div className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/30 bg-white/10 min-w-[90px]">
              <span className="text-2xl font-bold text-white">{completedCount}</span>
              <span className="text-xs text-white/80 mt-0.5">Hoàn thành</span>
            </div>
          </div>
        </section>

        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Luyện tập theo Part
        </Link>

        {/* Part 2: Theo loại câu hỏi */}
        {practiceGroups.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Theo loại câu hỏi</h2>
              <Link href="/series/part2-practice" className="text-sm text-[#4DA8DA] hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {practiceGroups.map((group) => (
                <TestSetCard key={group.id} group={group} href={`/test/${group.slug}`} />
              ))}
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
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display font-semibold text-base text-[var(--text-secondary)]">{series.name}</h3>
                    <span className="text-sm text-[var(--text-muted)]">{series.testSets.length} bộ</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {series.testSets.map((group) => (
                      <TestSetCard key={group.id} group={group} href={`/practice/${part}?set=${group.slug}`} />
                    ))}
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
