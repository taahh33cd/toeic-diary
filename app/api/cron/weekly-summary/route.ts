import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Week window in ICT (UTC+7): last 7 days
  const nowUtc = new Date();
  const weekStart = new Date(nowUtc.getTime() - 7 * 24 * 60 * 60 * 1000);

  const students = await prisma.profile.findMany({
    where: { studentCode: { not: null } },
    select: { id: true, currentStreak: true, longestStreak: true },
  });

  if (students.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  const studentIds = students.map((s) => s.id);

  // XP earned this week, grouped by user
  const xpRows = await prisma.xpEvent.groupBy({
    by: ["userId"],
    where: { userId: { in: studentIds }, createdAt: { gte: weekStart } },
    _sum: { xp: true },
  });

  // Lessons completed this week, grouped by user
  const lessonRows = await prisma.userProgress.groupBy({
    by: ["userId"],
    where: {
      userId: { in: studentIds },
      status: "completed",
      completedAt: { gte: weekStart },
    },
    _count: { id: true },
  });

  const xpMap = new Map(xpRows.map((r) => [r.userId, r._sum.xp ?? 0]));
  const lessonMap = new Map(lessonRows.map((r) => [r.userId, r._count.id]));

  let notified = 0;

  await Promise.allSettled(
    students.map(async (student) => {
      const xp = xpMap.get(student.id) ?? 0;
      const lessons = lessonMap.get(student.id) ?? 0;

      // Skip students with zero activity this week
      if (xp === 0 && lessons === 0) return;

      const streakPart =
        student.currentStreak > 0 ? ` • 🔥 ${student.currentStreak} ngày liên tiếp` : "";

      await sendPushToUser(student.id, {
        title: "📊 Tổng kết tuần của bạn",
        body: `+${xp} XP • ${lessons} bài hoàn thành${streakPart}`,
        url: "/journal/achievements",
      });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
