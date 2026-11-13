import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { canUseRoadmap } from "@/lib/roadmap/access";
import { maintainPlan } from "@/lib/roadmap/maintain";
import { vnDateKey, vnToday } from "@/lib/roadmap/vn-date";

/**
 * GET /api/roadmap/today — việc của hôm nay.
 *
 * Trước khi trả về, route gọi `maintainPlan`: đối chiếu bằng chứng, dồn ngày bỏ
 * lỡ, xếp lại theo điểm thi thử mới, sinh tuần kế nếu tuần cũ đã hết. Nghĩa là
 * chỉ cần mở trang là lịch đã đúng, không phụ thuộc vào việc cron đêm qua có
 * chạy hay không — cron chỉ để sáng ra mở lên đã sẵn sàng.
 */
export async function GET() {
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
    return NextResponse.json({ state: "closed" as const, tasks: [] });
  }

  const rollover = await maintainPlan(user.id);

  const today = vnToday();
  const tasks = await prisma.studyTask.findMany({
    where: {
      userId: user.id,
      plan: { status: "active" },
      date: new Date(`${today}T00:00:00Z`),
    },
    // Chỉ sắp theo `order` — planner đã xếp sẵn việc chính trước, bonus sau, và
    // việc dồn từ hôm trước nhận order lớn nên rơi xuống cuối.
    // KHÔNG sắp theo `priority`: nó là chuỗi, mà "bonus" đứng trước "core" theo
    // bảng chữ cái, nên việc không bắt buộc lại nhảy lên đầu danh sách.
    orderBy: { order: "asc" },
  });

  if (tasks.length === 0) {
    const hasPlan = await prisma.studyPlan.findFirst({
      where: { userId: user.id, status: "active" },
      select: { id: true },
    });
    return NextResponse.json({
      state: hasPlan ? ("rest_day" as const) : ("no_plan" as const),
      tasks: [],
      rollover,
    });
  }

  // Việc không bắt buộc luôn xuống cuối. `order` của planner phần lớn đã đúng,
  // nhưng mốc kiểm tra chèn vào đầu ngày làm lệch vài chỗ — sắp lại ở đây cho
  // chắc, vì đây là danh sách học viên nhìn mỗi ngày.
  const sorted = [...tasks].sort(
    (a, b) =>
      Number(a.priority === "bonus") - Number(b.priority === "bonus") ||
      a.order - b.order,
  );

  return NextResponse.json({
    state: "ok" as const,
    date: today,
    rollover,
    tasks: sorted.map((t) => ({
      id: t.id,
      title: t.title,
      href: t.href,
      kind: t.kind,
      estMinutes: t.estMinutes,
      priority: t.priority,
      status: t.status,
      /** Ngày giao gốc, chỉ có khi việc bị dồn sang — để hiện nhãn "dồn từ…". */
      rolledFrom: t.rolledFromDate ? vnDateKey(t.rolledFromDate) : null,
      evidence: t.evidence,
    })),
  });
}
