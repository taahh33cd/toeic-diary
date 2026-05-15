import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, ChevronRight } from "lucide-react";

const PART_INFO: Record<string, { icon: string; label: string; sub: string; partNumber: number; color: string; border: string; bg: string }> = {
  "part-1": { icon: "📷", label: "Part 1", sub: "Photographs",       partNumber: 1, color: "#e55a6b", border: "rgba(229,90,107,0.3)",  bg: "rgba(229,90,107,0.08)" },
  "part-2": { icon: "💬", label: "Part 2", sub: "Question–Response", partNumber: 2, color: "#d97706", border: "rgba(217,119,6,0.3)",   bg: "rgba(217,119,6,0.08)"  },
  "part-3": { icon: "🗣️", label: "Part 3", sub: "Conversations",     partNumber: 3, color: "#6366f1", border: "rgba(99,102,241,0.3)",  bg: "rgba(99,102,241,0.08)" },
  "part-4": { icon: "📢", label: "Part 4", sub: "Talks",             partNumber: 4, color: "#10b981", border: "rgba(16,185,129,0.3)",  bg: "rgba(16,185,129,0.08)" },
};

export default async function PartPracticePage({
  params,
}: {
  params: Promise<{ part: string }>;
}) {
  const { part } = await params;
  const info = PART_INFO[part];
  if (!info) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/practice/${part}`);

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { displayName: true } })
    .catch(() => null);

  // Fetch ETS test lessons for this part that have timestamps (faster-whisper)
  const lessons = await prisma.lesson.findMany({
    where: {
      part: { partNumber: info.partNumber },
      sentences: { some: { startTime: { gt: 0 } } },
    },
    include: {
      part: {
        select: {
          testSet: { select: { name: true, orderIndex: true } },
        },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  // Sort by testSet.orderIndex then lesson.orderIndex
  lessons.sort(
    (a, b) =>
      (a.part.testSet.orderIndex ?? 0) - (b.part.testSet.orderIndex ?? 0) ||
      a.orderIndex - b.orderIndex
  );

  const lessonIds = lessons.map((l) => l.id);
  const progress =
    lessonIds.length > 0
      ? await prisma.userProgress.findMany({
          where: { userId: user.id, lessonId: { in: lessonIds }, level: 1 },
          select: { lessonId: true, bestScore: true },
        })
      : [];
  const progressMap = Object.fromEntries(progress.map((p) => [p.lessonId, p.bestScore]));
  const completedCount = progress.filter((p) => p.bestScore >= 70).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-80 transition-opacity"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={15} />
          Luyện tập theo Part
        </Link>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl border mb-8"
          style={{ background: info.bg, borderColor: info.border }}
        >
          <span className="text-3xl">{info.icon}</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: info.color }}>
              {info.label} — {info.sub}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {completedCount}/{lessons.length} bài hoàn thành (Level 1 ≥70)
            </p>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div
            className="rounded-2xl border py-20 flex flex-col items-center text-center"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
          >
            <div className="text-5xl mb-4">{info.icon}</div>
            <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              Chưa có bài luyện tập nào
            </p>
            <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
              Nội dung đang được chuẩn bị. Quay lại sau nhé!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {lessons.map((lesson, i) => {
              const bestScore = progressMap[lesson.id];
              const done = bestScore !== undefined && bestScore >= 70;
              return (
                <Link
                  key={lesson.id}
                  href={`/practice/${part}/${lesson.id}`}
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:border-[var(--accent-primary)] hover:shadow-sm"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      background: done ? "rgba(16,185,129,0.15)" : "var(--bg-tertiary)",
                      color: done ? "#10b981" : "var(--text-muted)",
                    }}
                  >
                    {done ? "✓" : (lesson.questionStart ?? i + 1)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {lesson.title}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {lesson.part.testSet.name}
                    </div>
                  </div>

                  {bestScore !== undefined && (
                    <span
                      className="text-xs font-mono font-bold flex-shrink-0 tabular-nums"
                      style={{ color: done ? "#10b981" : "#f59e0b" }}
                    >
                      {bestScore}
                    </span>
                  )}

                  <ChevronRight
                    size={15}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: "var(--text-muted)" }}
                  />
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
