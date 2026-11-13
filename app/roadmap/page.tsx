import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { MonthStrip } from "@/components/roadmap/MonthStrip";
import { ReplanButton } from "@/components/roadmap/ReplanButton";
import { ScoreChart } from "@/components/roadmap/ScoreChart";
import { WeekSchedule } from "@/components/roadmap/WeekSchedule";
import { canUseRoadmap, ROADMAP_CLOSED_MESSAGE } from "@/lib/roadmap/access";
import { maintainPlan } from "@/lib/roadmap/maintain";
import { manualReplanLeft } from "@/lib/roadmap/replan";
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

  // Đưa lịch về đúng trạng thái TRƯỚC khi đọc: dồn ngày bỏ lỡ, tích việc đã
  // làm, xếp lại theo điểm thi mới, sinh tuần kế nếu tuần cũ đã hết. Đọc trước
  // rồi mới dọn thì trang hiện bản cũ, học viên phải tải lại mới thấy đúng.
  await maintainPlan(user.id);

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

  // Tuần đã xếp sẵn cho sau này. Phải hiện ra, nếu không học viên bấm "Tính lại"
  // xong chẳng thấy gì đổi (tuần mới luôn bắt đầu từ thứ Hai tới) và tưởng nút
  // hỏng.
  const upcoming = plan.weeks.find((w) => vnDateKey(w.startDate) > today);

  const baseline = plan.baseline as unknown as { total: number };

  // Bỏ các ngày TRƯỚC khi lộ trình bắt đầu. Tuần luôn neo vào thứ Hai, nên học
  // viên bắt đầu giữa tuần sẽ có mấy ngày đầu trống — hiện chúng là "ngày nghỉ"
  // thì sai hẳn nghĩa: đó là ngày chưa có lộ trình, không phải ngày được nghỉ.
  const planStart = (plan.intake as unknown as { startDate?: string })?.startDate ?? "";

  /** Dựng đủ 7 ô ngày của một tuần, kể cả ngày không có việc. */
  const buildDays = (w: typeof week | undefined) => {
    if (!w) return [];
    const byDate = new Map<string, typeof w.tasks>();
    for (const t of w.tasks) {
      const key = vnDateKey(t.date);
      const list = byDate.get(key) ?? [];
      list.push(t);
      byDate.set(key, list);
    }
    return weekDays(vnDateKey(w.startDate))
      .filter((date) => !planStart || date >= planStart)
      .map((date) => ({
        date,
        tasks: (byDate.get(date) ?? [])
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
      }));
  };

  const days = buildDays(week);
  const upcomingDays = buildDays(upcoming);

  // Lịch sử thi thử để vẽ đường điểm thật. Chỉ lấy lượt từ ngày bắt đầu lộ
  // trình trở đi — điểm của nửa năm trước không nói gì về kế hoạch này.
  const attempts = await prisma.fullTestAttempt.findMany({
    where: {
      userId: user.id,
      status: "done",
      total: { not: null },
      completedAt: { gte: new Date(`${planStart || today}T00:00:00+07:00`) },
    },
    orderBy: { completedAt: "asc" },
    select: { total: true, completedAt: true, testSlug: true },
  });
  const actualPoints = attempts
    .filter((a) => a.completedAt && a.total !== null)
    .map((a) => ({
      date: vnDateKey(a.completedAt!),
      score: a.total!,
      label: a.testSlug,
    }));

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
        <ReplanButton initialLeft={await manualReplanLeft(user.id)} />
      </header>

      {months.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Mục tiêu từng tháng</h2>
          <MonthStrip months={months} currentMonthIndex={monthIndex} />
        </section>
      )}

      {actualPoints.length >= 2 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Điểm thật so với kế hoạch</h2>
          <ScoreChart
            months={months}
            actual={actualPoints}
            startScore={baseline.total}
            startDate={planStart || today}
            targetScore={plan.targetScore}
          />
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

      {upcoming && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Tuần {upcoming.weekIndex} (tuần tới): {upcoming.theme}
            </h2>
            <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">
              {upcoming.goalText}
            </p>
          </div>
          <WeekSchedule days={upcomingDays} />
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
