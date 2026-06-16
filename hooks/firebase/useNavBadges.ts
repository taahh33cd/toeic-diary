"use client";

import { useMemo } from "react";
import { useHomework } from "./useHomework";
import { useSubmissions } from "./useSubmissions";
import { useDayLinks } from "./useDayLinks";
import { useVocab } from "./useVocab";
import { useStudent } from "./useStudent";
import type { VocabWord, Homework } from "@/lib/firebase/types";

const SRS_INTERVALS = [1, 3, 7, 14, 30, 90, 180];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isVocabDue(word: VocabWord, today: string): boolean {
  if (!word.lastReview) return true;
  const interval = SRS_INTERVALS[Math.min(word.repCount, SRS_INTERVALS.length - 1)];
  return addDays(word.lastReview, interval) <= today;
}

function calcHwIsDone(
  hw: Homework,
  submissions: Record<string, { ticked?: boolean; url?: string }>,
  dayLinks: Record<string, { link?: string }>
): boolean {
  let total = 0;
  for (const sec of (["vocab", "listening", "reading", "practice", "other"] as const)) {
    total += hw[sec]?.length ?? 0;
  }
  if (total === 0) return false;
  if (dayLinks[hw.id]?.link) return true;
  let done = 0;
  for (const sec of (["vocab", "listening", "reading", "practice", "other"] as const)) {
    const items = hw[sec] ?? [];
    for (let i = 0; i < items.length; i++) {
      const sub = submissions[`${hw.id}_${sec}_${i}`];
      if (sub?.ticked || sub?.url) done++;
    }
  }
  return done === total;
}

export interface NavBadges {
  taskCount: number;
  vocabDueCount: number;
  vocabRemind: boolean;
  feeDue: boolean;
}

export function useNavBadges(code: string | null | undefined): NavBadges {
  const { homework } = useHomework(code);
  const { submissions } = useSubmissions(code);
  const { dayLinks } = useDayLinks(code);
  const { words } = useVocab(code);
  const { student } = useStudent(code);

  const taskCount = useMemo(() => {
    const t = todayStr();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return homework.filter((hw) => {
      if (hw.date > t) return false;
      if (hw.date < cutoffStr) return false;
      return !calcHwIsDone(hw, submissions, dayLinks);
    }).length;
  }, [homework, submissions, dayLinks]);

  const vocabDueCount = useMemo(() => {
    const t = todayStr();
    return words.filter((w) => isVocabDue(w, t)).length;
  }, [words]);

  const vocabRemind = useMemo(() => {
    if (vocabDueCount > 0) return false;
    if (words.length === 0) return false;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const maxReview =
      words
        .map((w) => w.lastReview ?? "")
        .filter(Boolean)
        .sort()
        .pop() ?? "";
    return !maxReview || maxReview < cutoffStr;
  }, [words, vocabDueCount]);

  const feeDue = useMemo(() => {
    if (!student) return false;
    if (student.courseType === "package") return false;
    return (student.paidAmount ?? 0) < (student.totalFee ?? 0);
  }, [student]);

  return { taskCount, vocabDueCount, vocabRemind, feeDue };
}
