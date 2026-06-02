import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Users with an active streak who haven't been active today (ICT UTC+7)
  const nowUtc = new Date();
  const todayIct = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
  const todayStart = new Date(
    Date.UTC(todayIct.getUTCFullYear(), todayIct.getUTCMonth(), todayIct.getUTCDate()) - 7 * 60 * 60 * 1000
  );

  const users = await prisma.profile.findMany({
    where: {
      currentStreak: { gt: 0 },
      OR: [
        { lastActiveDate: null },
        { lastActiveDate: { lt: todayStart } },
      ],
    },
    select: { id: true, currentStreak: true },
  });

  await Promise.allSettled(
    users.map((u) =>
      sendPushToUser(u.id, {
        title: `🔥 Giữ streak ${u.currentStreak} ngày của bạn!`,
        body: "Còn vài tiếng nữa là hết ngày — học 1 bài ngắn để không mất chuỗi nhé!",
        url: "/journal",
      })
    )
  );

  return NextResponse.json({ ok: true, notified: users.length });
}
