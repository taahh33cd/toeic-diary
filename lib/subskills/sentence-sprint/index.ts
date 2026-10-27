// Subskill Đặt câu nhanh — hai nhánh (Viết / Nói) chạy trên cùng một bộ từ.
//
// Cả hai nhánh dùng chung ngữ liệu để học viên không phải học hai lần: câu mẫu
// tập ghép ở nhánh Viết đúng là câu phải bật ra ở nhánh Nói.

import { officeTopic } from "./data/office";
import { meetingTopic } from "./data/meeting";
import { SPRINT_LEVELS } from "./levels";
import type {
  Branch,
  ComposeItem,
  FrameItem,
  OrderItem,
  PickItem,
  SentenceTopic,
  SprintLevel,
} from "./types";

export { SPRINT_LEVELS, BRANCHES } from "./levels";
export { attemptPart } from "./types";

export const TOPICS: SentenceTopic[] = [officeTopic, meetingTopic];

export function getTopic(slug: string): SentenceTopic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

export function getLevel(branch: Branch, slug: string): SprintLevel | undefined {
  return SPRINT_LEVELS.find((l) => l.branch === branch && l.slug === slug);
}

export function levelsOf(branch: Branch): SprintLevel[] {
  return SPRINT_LEVELS.filter((l) => l.branch === branch);
}

/**
 * Lấy `count` mục bắt đầu từ `offset`, vòng lại đầu nếu hết.
 *
 * Mỗi cấp nhận một offset khác nhau nên hai cấp liền nhau không hỏi lại đúng
 * những từ đó — nhưng vẫn tất định, để server và client dựng ra cùng một đề.
 */
function take<T>(arr: T[], count: number, offset: number): T[] {
  const n = arr.length;
  if (n === 0) return [];
  return Array.from({ length: Math.min(count, n) }, (_, i) => arr[(i + offset) % n]);
}

/** Offset theo cấp, để các cấp không trùng danh sách từ. */
const OFFSETS: Record<string, number> = { l1: 0, l2: 4, l3: 8, l4: 2, l5: 6 };

export function buildFrameItems(topic: SentenceTopic, level: SprintLevel): FrameItem[] {
  return take(topic.entries, level.count, OFFSETS[level.slug] ?? 0).map((e, i) => ({
    id: `${topic.slug}-${level.slug}-${i}`,
    word: e.en,
    pos: e.pos,
    vi: e.vi,
    frame: e.frame,
    answers: e.frameAnswers,
    model: e.model,
    why: e.why,
  }));
}

export function buildPickItems(topic: SentenceTopic, level: SprintLevel): PickItem[] {
  return take(topic.entries, level.count, OFFSETS[level.slug] ?? 0).map((e, i) => {
    // Vị trí đáp án chạy vòng 0-1-2 để học viên không đoán theo thói quen.
    const correct = (i % 3) as 0 | 1 | 2;
    const texts: string[] = [e.wrong[0].text, e.wrong[1].text];
    const notes: string[] = [e.wrong[0].why, e.wrong[1].why];
    texts.splice(correct, 0, e.model);
    notes.splice(correct, 0, e.why);
    return {
      id: `${topic.slug}-${level.slug}-${i}`,
      word: e.en,
      vi: e.vi,
      options: texts as [string, string, string],
      correct,
      notes: notes as [string, string, string],
    };
  });
}

export function buildOrderItems(topic: SentenceTopic, level: SprintLevel): OrderItem[] {
  return take(topic.entries, level.count, OFFSETS[level.slug] ?? 0).map((e, i) => ({
    id: `${topic.slug}-${level.slug}-${i}`,
    word: e.en,
    vi: e.vi,
    chunks: e.chunks,
    model: e.model,
    situation: e.situation,
  }));
}

/** Cấp tự đặt câu với MỘT từ. `withSituation` = false khi chỉ hiện trơ từ. */
export function buildComposeItems(
  topic: SentenceTopic,
  level: SprintLevel,
  withSituation: boolean,
): ComposeItem[] {
  return take(topic.entries, level.count, OFFSETS[level.slug] ?? 0).map((e, i) => ({
    id: `${topic.slug}-${level.slug}-${i}`,
    words: [e.en],
    vi: [e.vi],
    situation: withSituation ? e.situation : "",
    model: e.model,
    collocations: e.collocations,
    minSentences: 1,
  }));
}

/**
 * Cấp cuối — ép dùng 2–3 từ một lượt.
 *
 * `prefer` quyết định lấy combo ít từ trước hay nhiều từ trước: cấp "một câu
 * nhiều từ" nên lấy combo 2 từ, còn cấp "chuỗi 2–3 câu" cần combo 3 từ. Sắp
 * xếp ổn định để server và client dựng ra cùng một đề.
 */
export function buildComboItems(
  topic: SentenceTopic,
  level: SprintLevel,
  minSentences: number,
  prefer: "few" | "many" = "few",
): ComposeItem[] {
  const vocab = new Map(topic.entries.map((e) => [e.en, e.vi]));
  const pool = [...topic.combos].sort((a, b) =>
    prefer === "few" ? a.words.length - b.words.length : b.words.length - a.words.length,
  );
  return take(pool, level.count, 0).map((c, i) => ({
    id: `${topic.slug}-${level.slug}-${i}`,
    words: c.words,
    vi: c.words.map((w) => vocab.get(w) ?? ""),
    situation: c.situation,
    model: c.model,
    collocations: [],
    minSentences,
  }));
}
