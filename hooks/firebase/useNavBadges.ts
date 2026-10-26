"use client";

import { useMemo } from "react";
import { useHomework } from "./useHomework";
import { useSubmissions } from "./useSubmissions";
import { useDayLinks } from "./useDayLinks";
import { useStudent } from "./useStudent";
import { useVocabDue } from "@/hooks/useVocabDue";
import { hwIsDone } from "@/lib/journal/homework";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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
  const { student } = useStudent(code);
  const { stats: vocab } = useVocabDue(!!code);

  const taskCount = useMemo(() => {
    const t = todayStr();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return homework.filter((hw) => {
      if (hw.date > t) return false;
      if (hw.date < cutoffStr) return false;
      return !hwIsDone(hw, submissions, dayLinks);
    }).length;
  }, [homework, submissions, dayLinks]);

  const vocabDueCount = vocab.dueCount;

  // Dấu nhắc nhẹ do server tính (hết từ đến hạn nhưng 3 ngày không ôn).
  const vocabRemind = vocab.remind;

  const feeDue = useMemo(() => {
    if (!student) return false;
    if (student.courseType === "package") return false;
    return (student.paidAmount ?? 0) < (student.totalFee ?? 0);
  }, [student]);

  return { taskCount, vocabDueCount, vocabRemind, feeDue };
}
