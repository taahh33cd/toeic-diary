// Chỉ dùng ở server (Prisma).
import { prisma } from "@/lib/db/prisma";
import { findItem } from "./index";
import {
  P7Q_ITEM_PART,
  P7Q_PART,
  STEP_BIT,
  type BestScore,
  type P7QType,
  type StepKey,
} from "./types";

export type P7QProgress = {
  best: Record<string, BestScore>;
  /** Tỉ lệ đúng theo bước, tính trên lần làm gần nhất của mỗi câu */
  steps: { key: StepKey; correct: number; total: number }[];
  /** Điểm trung bình theo dạng câu */
  types: { type: P7QType; avg: number; count: number }[];
  /** Câu mà lần làm gần nhất còn sai ít nhất 1 bước */
  wrongIds: string[];
  doneCount: number;
};

export async function getP7QProgress(userId: string): Promise<P7QProgress> {
  const rows = await prisma.subskillAttempt
    .findMany({
      where: { userId, part: { in: [P7Q_PART, P7Q_ITEM_PART] } },
      orderBy: { completedAt: "desc" },
      select: { part: true, questionWord: true, exerciseIndex: true, score: true, passed: true },
    })
    .catch(() => []);

  const best: Record<string, BestScore> = {};
  const latest = new Map<string, { steps: number; score: number; passed: boolean }>();
  for (const r of rows) {
    if (r.part === P7Q_PART) {
      const cur = best[r.questionWord];
      if (!cur || r.score > cur.score) best[r.questionWord] = { score: r.score, passed: r.passed };
    } else if (!latest.has(r.questionWord)) {
      // rows đã sắp mới → cũ: dòng đầu tiên gặp là lần gần nhất
      latest.set(r.questionWord, { steps: r.exerciseIndex, score: r.score, passed: r.passed });
    }
  }

  const stepAcc: Record<StepKey, { correct: number; total: number }> = {
    dich: { correct: 0, total: 0 },
    "tu-khoa": { correct: 0, total: 0 },
    dang: { correct: 0, total: 0 },
    "chien-luoc": { correct: 0, total: 0 },
  };
  const typeAcc = new Map<P7QType, { sum: number; count: number }>();
  const wrongIds: string[] = [];

  for (const [id, a] of latest) {
    const found = findItem(id);
    if (!found) continue;
    const { item } = found;
    for (const key of Object.keys(STEP_BIT) as StepKey[]) {
      if (key === "dang" && !item.typeOptions) continue; // bước này chỉ có ở bài tổng hợp
      stepAcc[key].total++;
      if (a.steps & STEP_BIT[key]) stepAcc[key].correct++;
    }
    const t = typeAcc.get(item.type) ?? { sum: 0, count: 0 };
    t.sum += a.score;
    t.count++;
    typeAcc.set(item.type, t);
    if (!a.passed) wrongIds.push(id);
  }

  return {
    best,
    steps: (Object.keys(stepAcc) as StepKey[]).map((key) => ({ key, ...stepAcc[key] })),
    types: [...typeAcc].map(([type, v]) => ({ type, avg: Math.round(v.sum / v.count), count: v.count })),
    wrongIds,
    doneCount: latest.size,
  };
}
