"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { recordXp, type RecordXpResult } from "@/lib/xp";

interface SaveProgressInput {
  lessonId: string;
  level: number;
  score: number;
  status: "in_progress" | "completed";
  userAnswer?: string;
  timeSpentSeconds?: number;
}

export async function saveProgress(input: SaveProgressInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Ensure profile exists (auto-create if first time)
  await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, displayName: user.email?.split("@")[0] ?? null },
    update: {},
  });

  const existing = await prisma.userProgress.findUnique({
    where: { userId_lessonId_level: { userId: user.id, lessonId: input.lessonId, level: input.level } },
    select: { bestScore: true, attempts: true },
  });

  const bestScore = Math.max(existing?.bestScore ?? 0, input.score);

  await prisma.userProgress.upsert({
    where: { userId_lessonId_level: { userId: user.id, lessonId: input.lessonId, level: input.level } },
    create: {
      userId: user.id,
      lessonId: input.lessonId,
      level: input.level,
      score: input.score,
      bestScore,
      status: input.status,
      userAnswer: input.userAnswer,
      timeSpentSeconds: input.timeSpentSeconds,
      attempts: 1,
      completedAt: input.status === "completed" ? new Date() : null,
    },
    update: {
      score: input.score,
      bestScore,
      status: input.status,
      userAnswer: input.userAnswer,
      timeSpentSeconds: input.timeSpentSeconds,
      attempts: { increment: 1 },
      completedAt: input.status === "completed" ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  // Award XP only on first-time completion (not retries that already completed)
  let xpResult: RecordXpResult | null = null;
  const wasAlreadyCompleted =
    existing && (existing.attempts ?? 0) > 0 && (existing.bestScore ?? 0) > 0;
  if (input.status === "completed" && !wasAlreadyCompleted) {
    xpResult = await recordXp(user.id, "dictation_lesson", undefined, {
      lessonId: input.lessonId,
      level: input.level,
      score: input.score,
    });
    if (input.score === 100) {
      xpResult = await recordXp(user.id, "dictation_perfect", undefined, {
        lessonId: input.lessonId,
      });
    } else if (input.score >= 80) {
      xpResult = await recordXp(user.id, "dictation_high_score", undefined, {
        lessonId: input.lessonId,
        score: input.score,
      });
    }
  }

  return { bestScore, xp: xpResult };
}
