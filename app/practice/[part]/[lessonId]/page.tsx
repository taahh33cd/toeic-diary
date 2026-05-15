import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PracticeClient } from "@/components/practice/PracticeClient";
import { ensureMinBlanks } from "@/lib/generateBlanks";

const PART_INFO: Record<string, { label: string; partNumber: number }> = {
  "part-1": { label: "Part 1", partNumber: 1 },
  "part-2": { label: "Part 2", partNumber: 2 },
  "part-3": { label: "Part 3", partNumber: 3 },
  "part-4": { label: "Part 4", partNumber: 4 },
};

export default async function PartLessonPage({
  params,
}: {
  params: Promise<{ part: string; lessonId: string }>;
}) {
  const { part, lessonId } = await params;
  const info = PART_INFO[part];
  if (!info) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/practice/${part}/${lessonId}`);

  const [lesson, profile] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        sentences: {
          orderBy: { orderIndex: "asc" },
          include: { blanks: { orderBy: { position: "asc" } } },
        },
        blanks: false,
        part: {
          select: {
            partNumber: true,
            testSet: { select: { name: true } },
          },
        },
      },
    }),
    prisma.profile
      .findUnique({ where: { id: user.id }, select: { displayName: true } })
      .catch(() => null),
  ]);

  if (!lesson) notFound();
  if (lesson.part.partNumber !== info.partNumber) notFound();

  const [progressRows, nextLesson] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId: user.id, lessonId },
      select: { level: true, status: true, score: true, bestScore: true, attempts: true },
    }),
    prisma.lesson.findFirst({
      where: { partId: lesson.partId, orderIndex: { gt: lesson.orderIndex } },
      orderBy: { orderIndex: "asc" },
      select: { id: true },
    }),
  ]);
  const nextLessonUrl = nextLesson ? `/practice/${part}/${nextLesson.id}` : null;
  const progressByLevel = Object.fromEntries(progressRows.map((p) => [p.level, p])) as Record<
    number,
    { status: string; score: number; bestScore: number; attempts: number }
  >;

  let sentences = lesson.sentences.map((s) => ({
    id: s.id,
    orderIndex: s.orderIndex,
    content: s.content,
    startTime: s.startTime,
    endTime: s.endTime,
    speaker: s.speaker,
    optionLabel: s.optionLabel ?? null,
    blanks: s.blanks.map((b) => ({
      id: b.id,
      position: b.position,
      answer: b.answer,
      hint: b.hint,
    })),
  }));

  // Level 1 Part 2: ensure every sentence (Q + A + B + C) has ≥2 blanks
  if (info.partNumber === 2) {
    sentences = ensureMinBlanks(sentences, 2);
  }

  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    questionStart: lesson.questionStart,
    questionEnd: lesson.questionEnd,
    transcriptFull: lesson.transcriptFull,
    audioUrl: lesson.audioUrl,
    audioDuration: lesson.audioDuration,
    partNumber: info.partNumber,
    correctOption: lesson.correctOption ?? null,
    explanation: lesson.explanation ?? null,
    sentences,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8">
        <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-6 flex-wrap">
          <Link href="/practice" className="hover:text-[var(--text-primary)] transition-colors">
            Luyện tập
          </Link>
          <span>/</span>
          <Link href={`/practice/${part}`} className="hover:text-[var(--text-primary)] transition-colors">
            {info.label}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">{lesson.title}</span>
        </nav>

        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {lesson.title}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {lesson.part.testSet.name} · {info.label}
            {lesson.questionStart && lesson.questionEnd
              ? ` · Q${lesson.questionStart}–${lesson.questionEnd}`
              : ""}
          </p>
        </div>

        <PracticeClient lesson={lessonData} userId={user.id} progressByLevel={progressByLevel} nextLessonUrl={nextLessonUrl} />
      </main>

      <Footer />
    </div>
  );
}
