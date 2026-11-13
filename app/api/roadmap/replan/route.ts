import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { canUseRoadmap } from "@/lib/roadmap/access";
import { manualReplanLeft, replanWeek } from "@/lib/roadmap/replan";

/**
 * POST /api/roadmap/replan — học viên bấm "Tính lại lộ trình".
 *
 * Có hạn mức (mặc định 2 lần/30 ngày) vì mỗi lần là một lượt gọi AI. Hết hạn
 * mức thì trả 429 kèm số lần còn lại để giao diện nói cho đúng, chứ không im
 * lặng không làm gì.
 *
 * GET trả số lần còn lại, để nút hiện được "còn 1 lần tháng này".
 */

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ left: await manualReplanLeft(user.id) });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile
    .findUnique({
      where: { id: user.id },
      select: { createdAt: true, roadmapEnabled: true },
    })
    .catch(() => null);
  if (!canUseRoadmap(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await replanWeek(user.id, "manual");

  if (!result.ok) {
    const status =
      result.error === "quota" ? 429 : result.error === "plan_finished" ? 409 : 404;
    return NextResponse.json(
      { error: result.error, left: await manualReplanLeft(user.id) },
      { status },
    );
  }

  return NextResponse.json({
    weekIndex: result.weekIndex,
    adjustment: result.adjustment.kind,
    reason: result.adjustment.reason,
    tasks: result.tasks,
    aiUsed: result.aiUsed,
    left: await manualReplanLeft(user.id),
  });
}
