/**
 * lib/srs.ts — Leitner-box spaced repetition.
 *
 * Pure functions, no DB. Used by /journal/vocab and /journal/paraphrase.
 * Storage location is Firebase RTDB (`students/{code}/vocab/{wordId}`),
 * fields: { repCount: number, nextReview: ISOstring, lastReviewed: ISOstring }.
 */

// Days between reviews per Leitner box level. Wrong answer → reset to box 0.
export const LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60] as const;
export const MASTERED_REP = 5;

export type ReviewOutcome = "correct" | "wrong";

export interface SrsState {
  repCount: number;
  nextReview: string; // ISO date
  lastReviewed?: string;
}

export function initSrs(now: Date = new Date()): SrsState {
  return {
    repCount: 0,
    nextReview: addDays(now, LEITNER_INTERVALS_DAYS[0]).toISOString(),
  };
}

export function reviewCard(
  prev: SrsState,
  outcome: ReviewOutcome,
  now: Date = new Date()
): SrsState {
  const nextRep =
    outcome === "wrong" ? 0 : Math.min(prev.repCount + 1, MASTERED_REP);
  const intervalDays =
    LEITNER_INTERVALS_DAYS[Math.min(nextRep, LEITNER_INTERVALS_DAYS.length - 1)];
  return {
    repCount: nextRep,
    nextReview: addDays(now, intervalDays).toISOString(),
    lastReviewed: now.toISOString(),
  };
}

export function isDue(state: SrsState, now: Date = new Date()): boolean {
  return new Date(state.nextReview).getTime() <= now.getTime();
}

export function isMastered(state: SrsState): boolean {
  return state.repCount >= MASTERED_REP;
}

export type DueColor = "due" | "soon" | "ok";
export function dueColor(state: SrsState, now: Date = new Date()): DueColor {
  const ms = new Date(state.nextReview).getTime() - now.getTime();
  if (ms <= 0) return "due";
  if (ms <= 24 * 60 * 60 * 1000) return "soon";
  return "ok";
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
