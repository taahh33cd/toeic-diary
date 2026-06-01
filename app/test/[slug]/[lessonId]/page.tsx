import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PracticeClient } from "@/components/practice/PracticeClient";
import { ensureMinBlanks } from "@/lib/generateBlanks";
import { ChevronLeft } from "lucide-react";
import { isUsageExempt } from "@/lib/access";
import { UsageGate } from "@/components/shared/UsageGate";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [lesson, profile] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        sentences: {
          orderBy: { orderIndex: "asc" },
          include: {
            blanks: { orderBy: { position: "asc" } },
          },
        },
        blanks: false,
        part: { select: { partNumber: true, testSetId: true } },
      },
    }),
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { displayName: true, role: true, studentCode: true, enrolledCourses: true, freeUsageSeconds: true },
    }),
  ]);

  if (!lesson) notFound();

  // Verify lesson belongs to this test slug
  const testSet = await prisma.testSet.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!testSet || lesson.part.testSetId !== testSet.id) notFound();

  const nextLesson = await prisma.lesson.findFirst({
    where: { partId: lesson.partId, orderIndex: { gt: lesson.orderIndex } },
    orderBy: { orderIndex: "asc" },
    select: { id: true },
  });
  const nextLessonUrl = nextLesson ? `/test/${slug}/${nextLesson.id}` : null;

  const progressRows = await prisma.userProgress.findMany({
    where: { userId: user.id, lessonId },
    select: { level: true, status: true, score: true, bestScore: true, attempts: true },
  });
  const progressByLevel = Object.fromEntries(
    progressRows.map((p) => [p.level, p])
  ) as Record<number, { status: string; score: number; bestScore: number; attempts: number }>;

  // Serialize for client
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

  if (lesson.part.partNumber === 2) {
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
    partNumber: lesson.part.partNumber,
    correctOption: lesson.correctOption ?? null,
    explanation: lesson.explanation ?? null,
    sentences,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <UsageGate initialSeconds={profile?.freeUsageSeconds ?? 0} isExempt={isUsageExempt(profile)} />
      <Header userEmail={user.email} userDisplayName={profile?.displayName} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-6">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href={`/test/${slug}`} className="hover:text-[var(--text-primary)] transition-colors">
            {testSet.name}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">{lesson.title}</span>
        </nav>

        {/* Lesson header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">
            {lesson.title}
          </h1>
          {lesson.questionStart && lesson.questionEnd && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Part {lesson.part.partNumber} · Questions {lesson.questionStart}–{lesson.questionEnd}
            </p>
          )}
        </div>

        <PracticeClient
          lesson={lessonData}
          userId={user.id}
          progressByLevel={progressByLevel}
          nextLessonUrl={nextLessonUrl}
        />
      </main>

      <Footer />
    </div>
  );
}
