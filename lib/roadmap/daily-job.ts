/**
 * lib/roadmap/daily-job.ts — toàn bộ việc nền của khu Lộ trình, gói trong MỘT lượt chạy.
 *
 * Vì sao gộp: dự án đang ở gói Hobby của Vercel, mà gói đó chỉ cho 2 cron mỗi
 * project — và cả hai suất đã dùng cho `daily-student` và `inactivity-alert`.
 * Tách lộ trình thành ba cron riêng (dồn ngày / sinh tuần / nhắc việc) thì bản
 * deploy production đầu tiên sẽ bị từ chối. Nên lộ trình đi nhờ lượt chạy của
 * `daily-student`, mỗi ngày một lần.
 *
 * Hệ quả phải chấp nhận: việc dồn ngày xảy ra lúc 20:00 giờ VN chứ không phải
 * ngay sau nửa đêm. Không sao — `maintainPlan` còn chạy mỗi lần học viên mở
 * trang, nên lượt chạy nền này chỉ là lưới an toàn cho người mấy hôm không vào.
 *
 * NGÂN SÁCH THỜI GIAN: hàm Hobby bị cắt ở 60 giây, mà sinh một tuần mới có gọi
 * AI (~3 giây). Nên hàm nhận một hạn mức thời gian, làm được đến đâu hay đến
 * đó, phần còn lại để lượt sau hoặc để lúc học viên mở trang. Thà bỏ dở có kiểm
 * soát còn hơn bị cắt ngang giữa một transaction.
 */

import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

import { maintainPlan } from "./maintain";
import { vnToday } from "./vn-date";

export type RoadmapDailyResult = {
  plans: number;
  maintained: number;
  newWeeks: number;
  reminded: number;
  /** true = hết giờ, còn học viên chưa xử — lượt sau làm tiếp. */
  ranOutOfTime: boolean;
  failures: string[];
};

export async function runRoadmapDaily(
  opts: { budgetMs?: number } = {},
): Promise<RoadmapDailyResult> {
  const budgetMs = opts.budgetMs ?? 25_000;
  const startedAt = Date.now();
  const outOfTime = () => Date.now() - startedAt > budgetMs;

  const result: RoadmapDailyResult = {
    plans: 0,
    maintained: 0,
    newWeeks: 0,
    reminded: 0,
    ranOutOfTime: false,
    failures: [],
  };

  const plans = await prisma.studyPlan.findMany({
    where: { status: "active" },
    select: { userId: true },
  });
  result.plans = plans.length;
  if (plans.length === 0) return result;

  // ── 1. Dọn lịch ──────────────────────────────────────────────────────────
  // Tuần tự, không song song: một học viên lỗi chỉ hỏng của người đó, và không
  // dội một loạt truy vấn vào pooler.
  for (const p of plans) {
    if (outOfTime()) {
      result.ranOutOfTime = true;
      break;
    }
    try {
      const r = await maintainPlan(p.userId);
      result.maintained++;
      if (r.newWeek !== null) {
        result.newWeeks++;
        // Báo tuần mới ngay tại đây, không báo trong `replanWeek`: hàm đó còn
        // chạy khi học viên đang mở trang, lúc ấy họ nhìn thấy tuần mới rồi.
        await sendPushToUser(p.userId, {
          title: `Tuần ${r.newWeek} đã sẵn sàng`,
          body: "Mở lộ trình xem tuần này học gì.",
          url: "/roadmap",
        }).catch(() => {});
      }
    } catch (e) {
      result.failures.push(
        `${p.userId.slice(0, 8)}: ${e instanceof Error ? e.message : "?"}`,
      );
    }
  }

  // ── 2. Nhắc việc còn lại của hôm nay ─────────────────────────────────────
  // Gộp bằng một truy vấn cho tất cả, không hỏi từng người.
  const today = new Date(`${vnToday()}T00:00:00Z`);

  const pending = await prisma.studyTask.groupBy({
    by: ["userId"],
    where: { date: today, status: "pending", priority: "core", plan: { status: "active" } },
    _count: { _all: true },
    _sum: { estMinutes: true },
  });
  if (pending.length === 0) return result;

  const doneRows = await prisma.studyTask.groupBy({
    by: ["userId"],
    where: { date: today, status: "done", plan: { status: "active" } },
    _count: { _all: true },
  });
  const doneBy = new Map(doneRows.map((r) => [r.userId, r._count._all]));

  for (const row of pending) {
    if (outOfTime()) {
      result.ranOutOfTime = true;
      break;
    }
    const left = row._count._all;
    const minutes = row._sum.estMinutes ?? 0;
    const done = doneBy.get(row.userId) ?? 0;

    // Người đã làm được việc nào rồi thì nhắc bằng giọng khác: "còn 1 việc nữa"
    // khác hẳn "hôm nay bạn chưa học".
    const res = await sendPushToUser(row.userId, {
      title: done > 0 ? `Còn ${left} việc nữa là xong hôm nay` : `Hôm nay bạn có ${left} việc`,
      body:
        done > 0
          ? `Khoảng ${minutes} phút nữa thôi.`
          : `Khoảng ${minutes} phút. Làm một việc cũng hơn là bỏ cả ngày.`,
      url: "/roadmap",
    }).catch(() => ({ sent: 0 }));
    if (res.sent > 0) result.reminded++;
  }

  return result;
}
