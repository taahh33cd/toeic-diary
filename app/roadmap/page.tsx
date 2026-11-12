import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { MonthStrip } from "@/components/roadmap/MonthStrip";
import { WeekSchedule } from "@/components/roadmap/WeekSchedule";
import { canUseRoadmap, ROADMAP_CLOSED_MESSAGE } from "@/lib/roadmap/access";
import { BASELINE_EXAM_SLUG, BASELINE_TEST_SLUG } from "@/lib/roadmap/config";
import { vnDateKey, vnToday, weekDays } from "@/lib/roadmap/vn-date";
import type { MonthGoal } from "@/lib/roadmap/types";

export const metadata = { title: "Lộ trình học" };

export default async function RoadmapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/roadmap");

  const profile = await prisma.profile
    .findUnique({
      where: { id: user.id },
      select: { createdAt: true, roadmapEnabled: true },
    })
    .catch(() => null);

  // Không có quyền thì nói rõ là đang chạy thử, KHÔNG trả 404: 404 làm người ta
  // tưởng web hỏng và đi báo lỗi.
  if (!canUseRoadmap(profile)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Lộ trình học</h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">{ROADMAP_CLOSED_MESSAGE}</p>
        <Link href="/skills" className="inline-block underline" style={{ color: "#0f766e" }}>
          Quay lại khu Luyện đề
        </Link>
      </div>
    );
  }

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id, status: "active" },
    include: {
      weeks: {
        orderBy: { weekIndex: "asc" },
        include: { tasks: { orderBy: [{ date: "asc" }, { order: "asc" }] } },
      },
    },
  });

  if (!plan) return <EmptyState />;

  const months = (plan.monthGoals as unknown as MonthGoal[]) ?? [];
  const today = vnToday();
  const week =
    plan.weeks.find((w) => vnDateKey(w.startDate) <= today && today <= vnDateKey(w.endDate)) ??
    plan.weeks[plan.weeks.length - 1];

  const baseline = plan.baseline as unknown as { total: number };

  // Dựng đủ 7 ô ngày, kể cả ngày không có việc — xem ghi chú trong WeekSchedule.
  const tasksByDate = new Map<string, typeof week.tasks>();
  for (const t of week?.tasks ?? []) {
    const key = vnDateKey(t.date);
    const list = tasksByDate.get(key) ?? [];
    list.push(t);
    tasksByDate.set(key, list);
  }
  const days = week
    ? weekDays(vnDateKey(week.startDate)).map((date) => ({
        date,
        tasks: (tasksByDate.get(date) ?? [])
          .sort((a, b) => a.order - b.order)
          .map((t) => ({
            id: t.id,
            catalogId: t.catalogId,
            title: t.title,
            href: t.href,
            estMinutes: t.estMinutes,
            priority: t.priority,
            status: t.status,
          })),
      }))
    : [];

  const monthIndex = currentMonthIndex(months, today);
  const doneCount = (week?.tasks ?? []).filter((t) => t.status === "done").length;
  const totalCount = week?.tasks.length ?? 0;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Lộ trình học</h1>
        <p className="text-[var(--text-secondary)]">
          Xuất phát {baseline.total} điểm
          {plan.targetScore ? ` · mục tiêu ${plan.targetScore}` : ""}
          {plan.deadline ? ` · thi ngày ${vnDateKey(plan.deadline)}` : ""}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          <Link href="/roadmap/result" className="underline" style={{ color: "#0f766e" }}>
            Xem lại kết quả chẩn đoán
          </Link>
        </p>
      </header>

      {months.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Mục tiêu từng tháng</h2>
          <MonthStrip months={months} currentMonthIndex={monthIndex} />
        </section>
      )}

      {week && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Tuần {week.weekIndex}: {week.theme}
            </h2>
            <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">{week.goalText}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Đã xong {doneCount}/{totalCount} việc
            </p>
          </div>
          <WeekSchedule days={days} today={today} />
        </section>
      )}

      <p className="text-sm text-[var(--text-secondary)] border-t pt-6" style={{ borderColor: "var(--border)" }}>
        Việc sẽ tự tích xanh khi bạn làm xong bài — tính năng đó đang được làm, hiện tại
        bạn cứ bấm vào từng việc để vào thẳng bài.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Lộ trình học</h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Bạn chưa có lộ trình. Làm một bài test đầu vào, hệ thống sẽ chỉ ra bạn đang mất
          điểm ở phần nào rồi xếp sẵn việc cần làm từng ngày.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/roadmap/start"
          className="px-5 py-2.5 rounded-lg font-semibold text-white"
          style={{ background: "#0f766e" }}
        >
          Bắt đầu
        </Link>
        <Link
          href={`/skills/full-tests/${BASELINE_EXAM_SLUG}/${BASELINE_TEST_SLUG}`}
          className="px-5 py-2.5 rounded-lg font-medium border"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          Xem đề test đầu vào
        </Link>
      </div>
    </div>
  );
}

/** Tháng đang chạy, theo mốc ngày trong chính `monthGoals`. */
function currentMonthIndex(months: MonthGoal[], today: string): number {
  const found = months.find((m) => m.startDate <= today && today <= m.endDate);
  return found?.monthIndex ?? 1;
}
