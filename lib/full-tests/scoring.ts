// Chấm điểm — dùng được cả ở server và client (không import JSON đề).
import { calcEtsScore, type EtsResult } from "@/lib/ets-scale";
import { ALL_PARTS } from "./parts";
import type { FullTest, PartNumber } from "./types";

export interface PartScore {
  part: PartNumber;
  correct: number;
  answered: number;
  /** Số câu được tính điểm (đã loại câu thiếu đáp án / câu lỗi) */
  gradable: number;
  accuracy: number;
}

export interface ScoreResult {
  parts: PartScore[];
  correct: number;
  gradable: number;
  answered: number;
  accuracy: number;
  /** Chỉ quy đổi khi làm đủ 7 part và đề đủ đáp án */
  scaled: EtsResult | null;
}

/**
 * Chấm bài. `answers` là map số câu → chữ cái đã chọn.
 * Câu không có đáp án gốc hoặc câu lỗi bị loại khỏi mẫu số.
 */
export function scoreAttempt(
  test: FullTest,
  answers: Record<number, string>,
  parts: PartNumber[],
): ScoreResult {
  const chosen = new Set(parts);
  const byPart = new Map<PartNumber, PartScore>();
  for (const p of parts) {
    byPart.set(p, { part: p, correct: 0, answered: 0, gradable: 0, accuracy: 0 });
  }

  for (const group of test.groups) {
    if (!chosen.has(group.part)) continue;
    const acc = byPart.get(group.part)!;
    for (const q of group.questions) {
      if (q.broken || !q.answer) continue;
      acc.gradable++;
      const picked = answers[q.number];
      if (picked) acc.answered++;
      if (picked === q.answer) acc.correct++;
    }
  }

  const list = parts.map((p) => {
    const s = byPart.get(p)!;
    s.accuracy = s.gradable ? s.correct / s.gradable : 0;
    return s;
  });

  const correct = list.reduce((a, s) => a + s.correct, 0);
  const gradable = list.reduce((a, s) => a + s.gradable, 0);
  const answered = list.reduce((a, s) => a + s.answered, 0);

  const full = ALL_PARTS.every((p) => chosen.has(p));
  const complete = full && gradable === 200;
  const at = (p: PartNumber) => byPart.get(p)?.correct ?? 0;

  return {
    parts: list,
    correct,
    gradable,
    answered,
    accuracy: gradable ? correct / gradable : 0,
    scaled: complete ? calcEtsScore(at(1), at(2), at(3), at(4), at(5), at(6), at(7)) : null,
  };
}
