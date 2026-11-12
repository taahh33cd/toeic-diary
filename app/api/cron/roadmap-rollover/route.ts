import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { runRollover } from "@/lib/roadmap/rollover";

export const runtime = "nodejs";

/**
 * GET /api/cron/roadmap-rollover — chạy 00:30 giờ VN hằng ngày.
 *
 * Dồn việc bỏ lỡ của mọi lộ trình đang chạy, để sáng ra học viên mở lên là lịch
 * đã đúng. Không phải chỗ DUY NHẤT làm việc này: trang lộ trình và trang nhiệm
 * vụ cũng tự chạy `runRollover` khi mở. Cron chỉ để lịch đúng sẵn từ trước;
 * cron trượt một hôm cũng không ai thấy gì khác.
 *
 * Lịch trong vercel.json là `30 17 * * *` — Vercel chạy theo UTC, 17:30 UTC =
 * 00:30 giờ VN hôm sau.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.studyPlan.findMany({
    where: { status: "active" },
    select: { userId: true },
  });

  let rolled = 0;
  let missed = 0;
  const failures: string[] = [];

  // Tuần tự, không Promise.all: một học viên lỗi thì chỉ hỏng của người đó, và
  // không đẩy một loạt truy vấn song song vào pooler.
  for (const p of plans) {
    try {
      const r = await runRollover(p.userId);
      rolled += r.rolled;
      missed += r.missed;
    } catch (e) {
      failures.push(`${p.userId.slice(0, 8)}: ${e instanceof Error ? e.message : "?"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    plans: plans.length,
    rolled,
    missed,
    failures: failures.slice(0, 10),
  });
}
