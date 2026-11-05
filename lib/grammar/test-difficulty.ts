import { TOPICS } from "./topics";
import { grammarQuestions } from "./questions";
import type { GrammarQuestion } from "./types";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

/**
 * Độ khó của CẢ một đề, để hiện ở danh sách đề.
 *
 * Mỗi đề vốn trộn cả câu dễ lẫn câu khó (scripts/grammar/build-questions.mjs sắp
 * dễ -> khó trong từng đề), nên nhãn ở đây là mức trung bình: easy=0, medium=1,
 * hard=2 rồi lấy trung bình cộng.
 *
 * Ngưỡng cắt lấy theo phân vị 1/3 - 2/3 của 189 đề chứ không ghim số, để data
 * đổi thì nhãn tự chia lại — ghim 0.8/1.32 là thêm vài đề khó vào bank xong cả
 * khu thành "Dễ" mà không ai biết.
 */
const WEIGHT: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

function meanWeight(slice: GrammarQuestion[]): number {
  if (!slice.length) return 0;
  let sum = 0;
  for (const q of slice) sum += WEIGHT[(q.difficulty ?? "medium") as Difficulty];
  return sum / slice.length;
}

/** `{ [topicId]: [độ khó test 1, test 2, …] }`, tính một lần lúc nạp module. */
export const TEST_DIFFICULTY: Record<string, Difficulty[]> = (() => {
  const means: { topicId: string; values: number[] }[] = [];

  for (const topic of TOPICS) {
    const topicQs = grammarQuestions.filter((q) => q.grammar_type === topic.id);
    const values: number[] = [];
    let cursor = 0;
    for (const size of topic.testSizes) {
      const slice = topicQs.slice(cursor, cursor + size);
      if (!slice.length) break;
      values.push(meanWeight(slice));
      cursor += size;
    }
    means.push({ topicId: topic.id, values });
  }

  const all = means.flatMap((m) => m.values).sort((a, b) => a - b);
  const at = (f: number) => all[Math.floor(f * (all.length - 1))] ?? 0;
  const easyMax = at(1 / 3);
  const mediumMax = at(2 / 3);

  const out: Record<string, Difficulty[]> = {};
  for (const { topicId, values } of means) {
    out[topicId] = values.map((v) => (v <= easyMax ? "easy" : v <= mediumMax ? "medium" : "hard"));
  }
  return out;
})();
