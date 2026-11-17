/**
 * lib/shadow/progress.ts — tiến độ Shadow (server-only, Prisma).
 *
 * Luật (docs/shadow-spec.md):
 *   - Câu đạt tính 1 lần mỗi ngày giờ VN (unique userId + sentenceId + day).
 *   - Đủ SHADOW_STREAK_MIN câu đạt trong ngày → cộng XP `shadow_day`, recordXp lo streak.
 *   - Bài "xong" khi mọi câu ⭐ của lượt đó đều đã đạt (ngày nào cũng được) → ShadowLesson.
 */

import { prisma } from "@/lib/db/prisma";
import { vnToday } from "@/lib/roadmap/vn-date";
import { recordXp, type RecordXpResult } from "@/lib/xp";
import { STAR_COUNT } from "./stars";

export const SHADOW_STREAK_MIN = 5;

export const SHADOW_EVENT_TYPES = [
  "shadow_open",
  "shadow_record",
  "shadow_sentence_done",
  "shadow_lesson_done",
] as const;
export type ShadowEventType = (typeof SHADOW_EVENT_TYPES)[number];

/** Cột DATE: Prisma nhận Date lúc 00:00 UTC của ngày đó. */
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

export interface ShadowLessonState {
  /** Câu đã đạt ít nhất một lần (mọi ngày). */
  doneSentenceIds: string[];
  lessonDone: boolean;
  todayCount: number;
  streakGoal: number;
}

export interface ShadowRecordResult extends ShadowLessonState {
  /** false nếu câu này đã được tính hôm nay rồi. */
  counted: boolean;
  newlyLessonDone: boolean;
  /** Có khi lần này làm đủ mốc streak trong ngày. */
  xp: RecordXpResult | null;
}

function todayCount(userId: string, day: string) {
  return prisma.shadowProgress.count({ where: { userId, day: asDate(day) } });
}

export async function getShadowLessonState(userId: string, lessonId: string): Promise<ShadowLessonState> {
  const day = vnToday();
  const [rows, lesson, count] = await Promise.all([
    prisma.shadowProgress.findMany({
      where: { userId, lessonId },
      distinct: ["sentenceId"],
      select: { sentenceId: true },
    }),
    prisma.shadowLesson.findUnique({ where: { userId_lessonId: { userId, lessonId } }, select: { id: true } }),
    todayCount(userId, day),
  ]);
  return {
    doneSentenceIds: rows.map((r) => r.sentenceId),
    lessonDone: !!lesson,
    todayCount: count,
    streakGoal: SHADOW_STREAK_MIN,
  };
}

export function logShadowEvent(
  userId: string,
  type: ShadowEventType,
  lessonId: string,
  sentenceId?: string | null,
  metadata?: Record<string, unknown>
) {
  return prisma.shadowEvent.create({
    data: { userId, type, lessonId, sentenceId: sentenceId ?? null, metadata: metadata as never },
  });
}

/**
 * Ghi một câu đạt. Trả null nếu câu không thuộc bài (request giả/cũ).
 * `starIds`: các câu ⭐ của lượt hiện tại — để xét bài xong.
 */
export async function recordShadowSentence(
  userId: string,
  input: { lessonId: string; sentenceId: string; starIds?: string[] }
): Promise<ShadowRecordResult | null> {
  const { lessonId, sentenceId } = input;
  const starIds = [...new Set(input.starIds ?? [])].slice(0, STAR_COUNT);
  const sentences = await prisma.sentence.findMany({
    where: { lessonId, id: { in: [sentenceId, ...starIds] } },
    select: { id: true, lesson: { select: { part: { select: { partNumber: true } } } } },
  });
  const found = new Set(sentences.map((s) => s.id));
  if (!found.has(sentenceId)) return null;
  const part = sentences[0].lesson.part.partNumber;

  const day = vnToday();
  const { count: inserted } = await prisma.shadowProgress.createMany({
    data: [{ userId, sentenceId, lessonId, part, day: asDate(day) }],
    skipDuplicates: true,
  });
  const counted = inserted === 1;
  if (counted) await logShadowEvent(userId, "shadow_sentence_done", lessonId, sentenceId, { day });

  // ── Streak: đủ mốc trong ngày thì cộng XP một lần ─────────────────────────
  const count = await todayCount(userId, day);
  let xp: RecordXpResult | null = null;
  if (counted && count >= SHADOW_STREAK_MIN) {
    const already = await prisma.xpEvent.findFirst({
      where: { userId, source: "shadow_day", metadata: { path: ["day"], equals: day } },
      select: { id: true },
    });
    if (!already) xp = await recordXp(userId, "shadow_day", undefined, { day, sentences: count });
  }

  // ── Bài xong: mọi câu ⭐ (thuộc bài) đều đã đạt ít nhất một lần ──────────────
  const validStars = starIds.filter((id) => found.has(id));
  let newlyLessonDone = false;
  if (validStars.length > 0 && validStars.length === starIds.length) {
    const doneStars = await prisma.shadowProgress.findMany({
      where: { userId, sentenceId: { in: validStars } },
      distinct: ["sentenceId"],
      select: { sentenceId: true },
    });
    if (doneStars.length === validStars.length) {
      const { count: c } = await prisma.shadowLesson.createMany({
        data: [{ userId, lessonId }],
        skipDuplicates: true,
      });
      newlyLessonDone = c === 1;
      if (newlyLessonDone) await logShadowEvent(userId, "shadow_lesson_done", lessonId, null, { stars: validStars });
    }
  }

  const state = await getShadowLessonState(userId, lessonId);
  return { ...state, todayCount: count, counted, newlyLessonDone, xp };
}

/** Tổng quan cho trang tiến độ HV. */
export async function getShadowSummary(userId: string) {
  const day = vnToday();
  const [total, unique, lessons, today, days] = await Promise.all([
    prisma.shadowProgress.count({ where: { userId } }),
    prisma.shadowProgress.findMany({ where: { userId }, distinct: ["sentenceId"], select: { sentenceId: true } }),
    prisma.shadowLesson.count({ where: { userId } }),
    todayCount(userId, day),
    prisma.shadowProgress.groupBy({ by: ["day"], where: { userId }, _count: { _all: true } }),
  ]);
  return {
    totalSentences: total,
    uniqueSentences: unique.length,
    lessonsDone: lessons,
    todayCount: today,
    streakGoal: SHADOW_STREAK_MIN,
    activeDays: days.length,
    streakDays: days.filter((d) => d._count._all >= SHADOW_STREAK_MIN).length,
  };
}
