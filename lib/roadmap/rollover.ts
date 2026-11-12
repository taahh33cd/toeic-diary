/**
 * lib/roadmap/rollover.ts — xử lý ngày đã qua mà việc còn bỏ dở.
 *
 * Lịch MỀM (quyết định #13): việc quan trọng nhất của ngày bỏ lỡ được đẩy sang
 * hôm nay, tối đa hai việc; phần còn lại đánh dấu "lỡ" và thôi. Dồn hết sang
 * hôm sau thì sau ba ngày bận là một đống bốn chục phút không ai đụng vào nữa —
 * đó là cách nhanh nhất để học viên bỏ luôn lộ trình.
 *
 * Chạy ở hai chỗ, cùng một hàm:
 *   • cron 00:30 giờ VN hằng ngày — để sáng ra mở lên là lịch đã đúng
 *   • mỗi lần mở trang lộ trình/nhiệm vụ — phòng khi cron trượt một hôm
 * Nên hàm phải chạy lại được nhiều lần mà không đổi kết quả.
 */

import { prisma } from "@/lib/db/prisma";

import {
  MAX_CORE_TASKS_PER_DAY,
  MAX_ROLLED_TASKS,
  MISSED_DAYS_TRIGGER,
} from "./config";
import { syncTasks } from "./evidence";
import { vnDateKey, vnToday } from "./vn-date";

export type RolloverResult = {
  /** Việc được đẩy sang hôm nay. */
  rolled: number;
  /** Việc của ngày đã qua bị bỏ hẳn. */
  missed: number;
  /** Số ngày học liên tiếp gần đây không làm gì — để Phase 4 kích hoạt giảm tải. */
  missedStreak: number;
};

/**
 * Dọn các ngày đã qua của lộ trình đang chạy.
 *
 * Trình tự có chủ ý: ĐỐI CHIẾU TRƯỚC, dồn sau. Làm ngược lại thì bài học viên
 * làm tối qua lúc 23h chưa kịp tính đã bị đánh dấu "lỡ".
 */
export async function runRollover(userId: string): Promise<RolloverResult> {
  const today = vnToday();

  // 1. Tích xong những gì học viên đã làm nhưng chưa được ghi nhận.
  await syncTasks(userId);

  const plan = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
  });
  if (!plan) return { rolled: 0, missed: 0, missedStreak: 0 };

  // 2. Việc còn treo của những ngày đã qua.
  const stale = await prisma.studyTask.findMany({
    where: {
      userId,
      planId: plan.id,
      status: "pending",
      date: { lt: new Date(`${today}T00:00:00Z`) },
    },
    orderBy: [{ date: "asc" }, { order: "asc" }],
  });
  if (stale.length === 0) {
    return { rolled: 0, missed: 0, missedStreak: await countMissedStreak(userId, plan.id) };
  }

  // 3. Hôm nay còn chỗ cho mấy việc nữa.
  const todayCore = await prisma.studyTask.count({
    where: {
      userId,
      planId: plan.id,
      date: new Date(`${today}T00:00:00Z`),
      priority: "core",
      status: { in: ["pending", "done"] },
    },
  });
  const room = Math.max(0, Math.min(MAX_ROLLED_TASKS, MAX_CORE_TASKS_PER_DAY - todayCore));

  // Chỉ dồn việc `core`, và ưu tiên việc của ngày gần nhất trước: việc của ba
  // hôm trước đã lạc nhịp với tuần rồi, kéo theo chỉ làm rối.
  const candidates = stale
    .filter((t) => t.priority === "core")
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.order - b.order)
    .slice(0, room);

  const rolledIds = new Set(candidates.map((t) => t.id));

  await prisma.$transaction([
    ...candidates.map((t, i) =>
      prisma.studyTask.update({
        where: { id: t.id },
        data: {
          date: new Date(`${today}T00:00:00Z`),
          // Giữ ngày giao gốc để cửa sổ đối chiếu bằng chứng không bị trượt —
          // xem lib/roadmap/evidence.ts. Việc đã dồn một lần rồi thì giữ nguyên
          // mốc gốc, không ghi đè bằng ngày hôm qua.
          rolledFromDate: t.rolledFromDate ?? t.date,
          order: MAX_CORE_TASKS_PER_DAY + i,
        },
      }),
    ),
    prisma.studyTask.updateMany({
      where: { id: { in: stale.filter((t) => !rolledIds.has(t.id)).map((t) => t.id) } },
      data: { status: "missed" },
    }),
  ]);

  return {
    rolled: candidates.length,
    missed: stale.length - candidates.length,
    missedStreak: await countMissedStreak(userId, plan.id),
  };
}

/**
 * Số ngày HỌC liên tiếp gần nhất mà học viên không hoàn thành việc nào.
 *
 * Chỉ đếm ngày có giao việc — ngày nghỉ không tính là bỏ lỡ. Phase 4 dùng con
 * số này để tự giảm tải khi vượt `MISSED_DAYS_TRIGGER`.
 */
async function countMissedStreak(userId: string, planId: string): Promise<number> {
  const today = vnToday();
  const rows = await prisma.studyTask.findMany({
    where: { userId, planId, date: { lt: new Date(`${today}T00:00:00Z`) } },
    select: { date: true, status: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  const byDay = new Map<string, { any: boolean; done: boolean }>();
  for (const r of rows) {
    const key = vnDateKey(r.date);
    const cur = byDay.get(key) ?? { any: false, done: false };
    cur.any = true;
    if (r.status === "done") cur.done = true;
    byDay.set(key, cur);
  }

  let streak = 0;
  for (const [, v] of [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a))) {
    if (!v.any) continue;
    if (v.done) break;
    streak++;
  }
  return streak;
}

export { MISSED_DAYS_TRIGGER };
