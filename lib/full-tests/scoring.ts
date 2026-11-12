// Chấm điểm — dùng được cả ở server và client (không import JSON đề).
import { calcEtsScore, type EtsResult } from "@/lib/ets-scale";
import { ALL_PARTS, partMeta, type Section } from "./parts";
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
  /** Điểm Listening 5–495 — có khi làm đủ Part 1–4 */
  listening: number | null;
  /** Điểm Reading 5–495 — có khi làm đủ Part 5–7 */
  reading: number | null;
  /** Có câu bị loại khỏi phần được quy đổi ⇒ điểm là ước tính theo tỷ lệ */
  estimated: boolean;
  /** Tổng 10–990 — chỉ khi làm đủ cả 7 part */
  scaled: EtsResult | null;
}

/** Số câu tối thiểu được chấm trong một phần để còn quy đổi (trên 100). */
const MIN_GRADABLE = 80;

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

  // Quy đổi riêng từng phần khi đã làm đủ các part của phần đó. Câu bị loại
  // (thiếu đáp án / thiếu nội dung) thì quy số câu đúng về thang 100 theo tỷ lệ.
  function section(sec: Section): { raw: number; estimated: boolean } | null {
    const ps = ALL_PARTS.filter((p) => partMeta(p).section === sec);
    if (!ps.every((p) => chosen.has(p))) return null;
    const ok = ps.reduce((a, p) => a + (byPart.get(p)?.correct ?? 0), 0);
    const total = ps.reduce((a, p) => a + (byPart.get(p)?.gradable ?? 0), 0);
    if (total < MIN_GRADABLE) return null;
    return { raw: Math.round((ok * 100) / total), estimated: total < 100 };
  }
  const ls = section("listening");
  const rd = section("reading");
  const conv = calcEtsScore(ls?.raw ?? 0, 0, 0, 0, rd?.raw ?? 0, 0, 0);
  const listening = ls ? conv.ls : null;
  const reading = rd ? conv.rd : null;

  return {
    parts: list,
    correct,
    gradable,
    answered,
    accuracy: gradable ? correct / gradable : 0,
    listening,
    reading,
    estimated: Boolean(ls?.estimated || rd?.estimated),
    scaled: listening !== null && reading !== null
      ? { ls: listening, rd: reading, total: listening + reading }
      : null,
  };
}
