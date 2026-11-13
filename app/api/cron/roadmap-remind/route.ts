import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";
import { vnToday } from "@/lib/roadmap/vn-date";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GET /api/cron/roadmap-remind — 19:00 giờ VN (`0 12 * * *` UTC).
 *
 * Nhắc những ai còn việc lộ trình chưa làm hôm nay. Chọn 19:00 vì đó là lúc
 * người đi làm/đi học đã về mà chưa đi ngủ — nhắc lúc 9 giờ sáng thì tin nằm
 * im tới tối, nhắc lúc 22 giờ thì chỉ làm người ta thấy có lỗi.
 *
 * Cron riêng chứ không ghép vào `daily-student`: cron đó chỉ quét học viên có
 * `studentCode`, trong khi lộ trình mở cho mọi tài khoản.
 *
 * KHÔNG gọi `maintainPlan` ở đây: việc đó có ghi DB và đã chạy ở cron nửa đêm
 * cùng mỗi lần mở trang. Cron này chỉ đọc rồi gửi tin.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date(`${vnToday()}T00:00:00Z`);

  const pending = await prisma.studyTask.groupBy({
    by: ["userId"],
    where: { date: today, status: "pending", priority: "core", plan: { status: "active" } },
    _count: { _all: true },
    _sum: { estMinutes: true },
  });

  if (pending.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  // Ai đã làm được việc nào hôm nay rồi thì nhắc bằng giọng khác — "còn 1 việc
  // nữa" khác hẳn "hôm nay bạn chưa học".
  const doneRows = await prisma.studyTask.groupBy({
    by: ["userId"],
    where: { date: today, status: "done", plan: { status: "active" } },
    _count: { _all: true },
  });
  const doneBy = new Map(doneRows.map((r) => [r.userId, r._count._all]));

  let notified = 0;
  for (const row of pending) {
    const left = row._count._all;
    const minutes = row._sum.estMinutes ?? 0;
    const done = doneBy.get(row.userId) ?? 0;

    const title =
      done > 0 ? `Còn ${left} việc nữa là xong hôm nay` : `Hôm nay bạn có ${left} việc`;
    const body =
      done > 0
        ? `Khoảng ${minutes} phút nữa thôi.`
        : `Khoảng ${minutes} phút. Làm một việc cũng hơn là bỏ cả ngày.`;

    const res = await sendPushToUser(row.userId, { title, body, url: "/roadmap" });
    if (res.sent > 0) notified++;
  }

  return NextResponse.json({ ok: true, candidates: pending.length, notified });
}
