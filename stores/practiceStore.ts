"use client";

import { create } from "zustand";

type PracticeStatus = "idle" | "practicing" | "submitted" | "completed";

interface PracticeState {
  // Session info
  lessonId: string | null;
  level: 1 | 2 | 3 | 4 | null;
  status: PracticeStatus;

  // Answers
  answers: Record<string, string>; // blankId → answer (L1), sentenceIndex → text (L2), "summary" → text (L3/4)

  // Results
  score: number | null;
  startTime: number | null; // Date.now() when started
  attempts: number;

  // Actions
  startSession: (lessonId: string, level: 1 | 2 | 3 | 4) => void;
  setAnswer: (key: string, value: string) => void;
  setScore: (score: number) => void;
  submit: () => void;
  reset: () => void;
}

/**
 * Practice Store — quản lý trạng thái phiên luyện tập hiện tại.
 */
export const usePracticeStore = create<PracticeState>()((set, get) => ({
  lessonId: null,
  level: null,
  status: "idle",
  answers: {},
  score: null,
  startTime: null,
  attempts: 0,

  startSession: (lessonId, level) =>
    set({
      lessonId,
      level,
      status: "practicing",
      answers: {},
      score: null,
      startTime: Date.now(),
    }),

  setAnswer: (key, value) =>
    set((state) => ({
      answers: { ...state.answers, [key]: value },
    })),

  setScore: (score) => set({ score }),

  submit: () =>
    set((state) => ({
      status: "submitted",
      attempts: state.attempts + 1,
    })),

  reset: () =>
    set({
      status: "idle",
      answers: {},
      score: null,
      startTime: null,
    }),
}));

// Helpers
export const getTimeSpent = (startTime: number | null): number => {
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
};
