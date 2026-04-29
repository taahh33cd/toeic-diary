"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { getLevel3Feedback, getLevel4Feedback, Level3Feedback, Level4Feedback } from "@/lib/ai/gemini";
import { saveProgress } from "./saveProgress";

interface Level3Input {
  level: 3;
  dbLevel?: number; // UI level to store in DB (defaults to 3)
  lessonId: string;
  transcript: string;
  userSummary: string;
  timeSpentSeconds?: number;
}

interface Level4Input {
  level: 4;
  lessonId: string;
  sentences: { content: string; speaker: string | null }[];
  userTranscript: string;
  timeSpentSeconds?: number;
}

type Input = Level3Input | Level4Input;

export async function getAiFeedback(input: Input): Promise<Level3Feedback | Level4Feedback> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Ensure profile exists before any FK writes
  await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, displayName: user.email?.split("@")[0] ?? null },
    update: {},
  });

  let feedback: Level3Feedback | Level4Feedback;
  let userText: string;

  try {
    if (input.level === 3) {
      feedback = await getLevel3Feedback(input.transcript, input.userSummary);
      userText = input.userSummary;
    } else {
      feedback = await getLevel4Feedback(input.sentences, input.userTranscript);
      userText = input.userTranscript;
    }
  } catch (e: any) {
    console.error("[getAiFeedback] Gemini error:", e?.message ?? e);
    throw e;
  }

  const score = feedback.accuracyScore;

  const dbLevel = input.level === 3 ? (input.dbLevel ?? 3) : input.level;

  // Save AI feedback record
  await prisma.aiFeedback.create({
    data: {
      userId: user.id,
      lessonId: input.lessonId,
      level: dbLevel,
      userSummary: userText,
      accuracyScore: score,
      feedbackData: feedback as object,
    },
  });

  // Save progress
  await saveProgress({
    lessonId: input.lessonId,
    level: dbLevel,
    score,
    status: score >= 70 ? "completed" : "in_progress",
    userAnswer: userText,
    timeSpentSeconds: input.timeSpentSeconds,
  });

  return feedback;
}
