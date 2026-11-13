/**
 * lib/roadmap/maintain.ts — một cửa duy nhất để đưa lộ trình về đúng trạng thái.
 *
 * Gọi khi học viên mở trang lộ trình hoặc trang nhiệm vụ. Làm theo đúng thứ tự:
 *
 *   1. dồn ngày bỏ lỡ (đã đối chiếu bằng chứng bên trong)
 *   2. có điểm thi thử mới chưa? → xếp lại tuần đang chạy theo điểm mới
 *   3. tuần đã hết chưa? → tổng kết rồi sinh tuần kế
 *   4. bỏ lỡ liên tiếp quá nhiều? → giảm tải
 *
 * Thứ tự có chủ ý. Đối chiếu trước khi dồn thì bài làm tối qua không bị tính là
 * lỡ. Xử điểm thi mới trước khi sinh tuần kế thì tuần mới dựa trên trình độ mới
 * chứ không dựa trên số liệu cũ.
 *
 * Cron chỉ là lưới an toàn: cron trượt một hôm cũng không ai thấy gì khác, vì
 * mở trang là chạy lại toàn bộ.
 */

import { prisma } from "@/lib/db/prisma";

import { MISSED_DAYS_TRIGGER, WEEK_COMPLETION_TRIGGER } from "./config";
import { replanAfterTest, replanWeek } from "./replan";
import { runRollover } from "./rollover";
import { buildReview } from "./review";
import { vnDateKey, vnToday } from "./vn-date";

export type MaintainResult = {
  rolled: number;
  missed: number;
  replannedAfterTest: boolean;
  newWeek: number | null;
  lightened: boolean;
};

export async function maintainPlan(userId: string): Promise<MaintainResult> {
  const result: MaintainResult = {
    rolled: 0,
    missed: 0,
    replannedAfterTest: false,
    newWeek: null,
    lightened: false,
  };

  const rollover = await runRollover(userId);
  result.rolled = rollover.rolled;
  result.missed = rollover.missed;

  const plan = await prisma.studyPlan.findFirst({
    where: { userId, status: "active" },
    include: { weeks: { orderBy: { weekIndex: "desc" }, take: 1, include: { tasks: true } } },
  });
  if (!plan) return result;

  // ── 2. Có lượt thi thử mới hơn mốc đang dùng không ───────────────────────
  const current = plan.current as { attemptId?: string } | null;
  const usedAttemptId = current?.attemptId ?? plan.baselineAttemptId;
  const newest = await prisma.fullTestAttempt.findFirst({
    where: { userId, status: "done", total: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { id: true },
  });
  if (newest && newest.id !== usedAttemptId) {
    const r = await replanAfterTest(userId, newest.id);
    result.replannedAfterTest = r.ok;
  }

  // ── 3. Tuần đang chạy đã hết hạn chưa ────────────────────────────────────
  const week = plan.weeks[0];
  if (!week) return result;

  const today = vnToday();
  if (vnDateKey(week.endDate) < today) {
    const r = await replanWeek(userId, "replan_weekly");
    if (r.ok) result.newWeek = r.weekIndex;
    return result;
  }

  // ── 4. Đang đuối giữa tuần → giảm tải ngay, không đợi hết tuần ───────────
  const review = buildReview(week.tasks);
  const weekHalfGone = vnDateKey(week.startDate) <= addDaysStr(today, -3);
  const struggling =
    rollover.missedStreak >= MISSED_DAYS_TRIGGER ||
    (weekHalfGone && review.completionRate < WEEK_COMPLETION_TRIGGER);

  if (struggling) {
    // Chỉ giảm tải một lần cho mỗi tuần: không thì mỗi lần mở trang lại sinh
    // một tuần mới nhẹ hơn nữa, và lịch trôi đi mất.
    const alreadyLightened = await prisma.planEvent.findFirst({
      where: {
        planId: plan.id,
        type: "replan_missed",
        createdAt: { gte: week.startDate },
      },
      select: { id: true },
    });
    if (!alreadyLightened) {
      const r = await replanWeek(userId, "replan_missed");
      result.lightened = r.ok;
      if (r.ok) result.newWeek = r.weekIndex;
    }
  }

  return result;
}

function addDaysStr(dateKey: string, days: number): string {
  const t = Date.parse(`${dateKey}T00:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}
