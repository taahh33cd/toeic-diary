import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { syncRoadmapAfterAttempt } from "@/lib/roadmap/hook";
import { findItem, getLesson, REVIEW_SLUG } from "@/lib/subskills/part7-questions";
import { P7Q_ITEM_PART, P7Q_PART } from "@/lib/subskills/part7-questions/types";

type Body = {
  lesson: string;
  score: number;
  passed: boolean;
  items: { id: string; steps: number; score: number; passed: boolean }[];
};

/** Lưu 1 lượt làm bài: 1 dòng cho bài + 1 dòng cho mỗi câu (để báo dạng yếu & ôn câu sai). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (
    !body ||
    (body.lesson !== REVIEW_SLUG && !getLesson(body.lesson)) ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 50
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const items = body.items.filter((i) => findItem(i.id));

  await prisma.subskillAttempt.createMany({
    data: [
      // Bài ôn tập không có điểm bài riêng, chỉ cập nhật từng câu.
      ...(body.lesson === REVIEW_SLUG
        ? []
        : [{
            userId: user.id,
            part: P7Q_PART,
            questionWord: body.lesson,
            exerciseIndex: 0,
            score: clamp(body.score),
            passed: !!body.passed,
          }]),
      ...items.map((i) => ({
        userId: user.id,
        part: P7Q_ITEM_PART,
        questionWord: i.id,
        exerciseIndex: Math.max(0, Math.min(15, Math.trunc(Number(i.steps) || 0))),
        score: clamp(i.score),
        passed: !!i.passed,
      })),
    ],
  });

  if (body.passed && body.lesson !== REVIEW_SLUG) await syncRoadmapAfterAttempt(user.id);

  return NextResponse.json({ ok: true });
}
