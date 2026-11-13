import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";
import { replanWeek } from "@/lib/roadmap/replan";
import { vnDateKey, vnToday } from "@/lib/roadmap/vn-date";

export const runtime = "nodejs";
/** Sinh tuần mới cho nhiều học viên, mỗi người một lượt gọi AI — cần thoáng giờ. */
export const maxDuration = 300;

/**
 * GET /api/cron/roadmap-weekly — Chủ nhật 21:00 giờ VN (`0 14 * * 0` UTC).
 *
 * Tổng kết tuần vừa rồi và sinh tuần kế cho mọi lộ trình đang chạy. Không phải
 * chỗ duy nhất làm việc này — mở trang lộ trình cũng chạy (lib/roadmap/maintain.ts).
 * Cron chỉ để sáng thứ Hai học viên mở lên là tuần mới đã nằm sẵn ở đó.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = vnToday();

  const plans = await prisma.studyPlan.findMany({
    where: { status: "active" },
    select: {
      userId: true,
      weeks: { orderBy: { weekIndex: "desc" }, take: 1, select: { endDate: true } },
    },
  });

  let created = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const p of plans) {
    // Tuần chưa hết thì bỏ qua: cron chạy hằng tuần nhưng học viên bắt đầu lộ
    // trình vào các ngày khác nhau, nên không phải ai cũng tới hạn cùng lúc.
    const end = p.weeks[0]?.endDate;
    if (!end || vnDateKey(end) >= today) {
      skipped++;
      continue;
    }
    try {
      const r = await replanWeek(p.userId, "replan_weekly");
      if (r.ok) {
        created++;
        // Báo tin ở ĐÂY chứ không trong replanWeek: hàm đó còn được gọi khi học
        // viên đang mở trang, lúc ấy họ nhìn thấy tuần mới rồi, đẩy thêm một
        // thông báo chỉ làm phiền.
        await sendPushToUser(p.userId, {
          title: `Tuần ${r.weekIndex} đã sẵn sàng`,
          body: r.adjustment.reason,
          url: "/roadmap",
        }).catch(() => {});
      } else skipped++;
    } catch (e) {
      failures.push(`${p.userId.slice(0, 8)}: ${e instanceof Error ? e.message : "?"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    plans: plans.length,
    created,
    skipped,
    failures: failures.slice(0, 10),
  });
}
