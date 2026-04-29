"use server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

export interface SmartSuggestion {
  kind: "review_lesson" | "weak_part" | "first_lesson";
  emoji: string;
  title: string;
  desc: string;
  href: string;
}

/**
 * Heuristics — no ML:
 *   1. Lessons với bestScore < 70 → đề xuất ôn lại
 *   2. Part có avgScore thấp nhất → gợi ý focus
 *   3. Nếu chưa có lesson nào → gợi ý bắt đầu Part 1
 */
export async function getSmartSuggestions(): Promise<SmartSuggestion[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const completed = await prisma.userProgress.findMany({
    where: { userId: user.id, status: "completed" },
    select: {
      lessonId: true,
      bestScore: true,
      lesson: {
        select: {
          id: true,
          title: true,
          part: { select: { partNumber: true, title: true } },
        },
      },
    },
  });

  if (completed.length === 0) {
    return [
      {
        kind: "first_lesson",
        emoji: "🎧",
        title: "Bắt đầu hành trình",
        desc: "Thử bài đầu tiên ở Part 1 — chỉ 5 phút",
        href: "/practice",
      },
    ];
  }

  const suggestions: SmartSuggestion[] = [];

  // 1. Bài cần ôn lại (điểm < 70), lấy 2 bài thấp nhất
  const weak = [...completed]
    .filter((c) => c.bestScore < 70)
    .sort((a, b) => a.bestScore - b.bestScore)
    .slice(0, 2);
  for (const w of weak) {
    suggestions.push({
      kind: "review_lesson",
      emoji: "🔄",
      title: `Ôn lại: ${w.lesson.title}`,
      desc: `Lần trước được ${w.bestScore} điểm — luyện lại để củng cố`,
      href: `/practice`,
    });
  }

  // 2. Part yếu nhất (avg)
  const byPart = new Map<number, { sum: number; count: number; title: string }>();
  for (const c of completed) {
    const p = c.lesson.part.partNumber;
    const acc = byPart.get(p) ?? { sum: 0, count: 0, title: c.lesson.part.title };
    acc.sum += c.bestScore;
    acc.count += 1;
    byPart.set(p, acc);
  }
  if (byPart.size > 0) {
    const partsWithAvg = [...byPart.entries()]
      .map(([p, v]) => ({ part: p, avg: v.sum / v.count, title: v.title }))
      .sort((a, b) => a.avg - b.avg);
    const weakest = partsWithAvg[0];
    if (weakest.avg < 80) {
      suggestions.push({
        kind: "weak_part",
        emoji: "🎯",
        title: `Tập trung Part ${weakest.part}`,
        desc: `Trung bình ${Math.round(weakest.avg)}/100 — cần luyện thêm`,
        href: `/practice`,
      });
    }
  }

  return suggestions.slice(0, 3);
}
