// ─────────────────────────────────────
// IPA grading — pure, single-correct multiple choice. No AI.
// ─────────────────────────────────────

import type { IpaItem } from "./types";

export function ipaItemCorrect(item: IpaItem, answer: number | null): boolean {
  return answer !== null && answer === item.correct;
}

/** score = % items answered correctly */
export function scoreIpa(items: IpaItem[], answers: (number | null)[]): number {
  if (items.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < items.length; i++) {
    if (ipaItemCorrect(items[i], answers[i] ?? null)) correct++;
  }
  return Math.round((correct / items.length) * 100);
}
