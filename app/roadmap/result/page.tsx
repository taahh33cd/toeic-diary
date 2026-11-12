import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { MonthStrip } from "@/components/roadmap/MonthStrip";
import { PartBars } from "@/components/roadmap/PartBars";
import { WeekSchedule } from "@/components/roadmap/WeekSchedule";
import { diagnose } from "@/lib/roadmap/diagnose";
import { vnDateKey, vnToday } from "@/lib/roadmap/vn-date";
import type { Intake, MonthGoal, PartScoreInput } from "@/lib/roadmap/types";

export const metadata = { title: "Kết quả chẩn đoán" };

/**
 * Màn hình học viên thấy ngay sau khi lộ trình được dựng.
 *
 * Chẩn đoán được TÍNH LẠI từ `plan.baseline` chứ không lưu sẵn: diagnose là hàm
 * thuần, chạy lại cho cùng một kết quả, nên lưu thêm một bản chỉ tạo cơ hội cho
 * hai bản lệch nhau.
 */
export default async function RoadmapResultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/roadmap/result");

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id, status: "active" },
    include: {
      weeks: {
        orderBy: { weekIndex: "asc" },
        take: 1,
        include: { tasks: { orderBy: [{ date: "asc" }, { order: "asc" }] } },
      },
    },
  });
  if (!plan) redirect("/roadmap");

  const baseline = plan.baseline as unknown as {
    total: number;
    listening: number | null;
    reading: number | null;
    parts: PartScoreInput[];
  };
  const intake = plan.intake as unknown as Intake;
  const months = (plan.monthGoals as unknown as MonthGoal[]) ?? [];
  const week = plan.weeks[0];

  const report = diagnose({
    partScores: baseline.parts,
    total: baseline.total,
    listening: baseline.listening,
    reading: baseline.reading,
    targetScore: plan.targetScore,
    deadline: plan.deadline ? vnDateKey(plan.deadline) : null,
    startDate: intake.startDate,
    minutesPerDay: intake.minutesPerDay,
    daysPerWeek: intake.daysPerWeek,
  });

  const days = week ? groupByDate(week.tasks) : [];

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wide" style={{ color: "#0f766e" }}>
          Kết quả bài test đầu vào
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
          {baseline.total} điểm
          {plan.targetScore ? (
            <span className="text-[var(--text-secondary)] font-normal text-2xl">
              {" "}
              → mục tiêu {plan.targetScore}
            </span>
          ) : null}
        </h1>
        <p className="text-[var(--text-secondary)]">
          Listening {baseline.listening ?? "–"} · Reading {baseline.reading ?? "–"}
          {report.weeksLeft !== null && <> · còn {report.weeksLeft} tuần tới ngày thi</>}
        </p>
        {report.feasibility && <FeasibilityNote report={report} />}
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Bạn đang mất điểm ở đâu</h2>
        <PartBars parts={report.parts} focusParts={report.focusParts} />
      </section>

      {months.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Khung mục tiêu</h2>
          <MonthStrip months={months} currentMonthIndex={1} />
        </section>
      )}

      {week && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Tuần đầu tiên: {week.theme}
            </h2>
            <p className="mt-1 text-[var(--text-secondary)] leading-relaxed">{week.goalText}</p>
          </div>
          <WeekSchedule days={days} today={vnToday()} />
        </section>
      )}

      <div className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/roadmap"
          className="inline-block px-5 py-2.5 rounded-lg font-semibold text-white"
          style={{ background: "#0f766e" }}
        >
          Bắt đầu học hôm nay
        </Link>
      </div>
    </div>
  );
}

/**
 * Nói thật khi lịch căng. Đây là chỗ dễ nhất để hứa suông, và cũng là chỗ học
 * viên mất lòng tin nhanh nhất nếu hai tháng sau không thấy điểm lên.
 */
function FeasibilityNote({
  report,
}: {
  report: ReturnType<typeof diagnose>;
}) {
  if (report.feasibility === "unrealistic") {
    return (
      <p
        className="rounded-lg border px-4 py-3 text-sm leading-relaxed"
        style={{ borderColor: "#fca5a5", background: "#fef2f2", color: "#7f1d1d" }}
      >
        Nói thẳng: với {report.weeksLeft} tuần và nhịp học bạn khai, mức tăng thường thấy
        vào khoảng {report.expectedGain} điểm, trong khi bạn cần thêm {report.gapToTarget}.
        Lộ trình vẫn chạy, nhưng nên tính tới chuyện lùi ngày thi hoặc tăng thời gian học
        mỗi ngày.
      </p>
    );
  }
  if (report.feasibility === "tight") {
    return (
      <p
        className="rounded-lg border px-4 py-3 text-sm leading-relaxed"
        style={{ borderColor: "#fcd34d", background: "#fffbeb", color: "#78350f" }}
      >
        Mục tiêu này vừa tầm nhưng sát: cần thêm {report.gapToTarget} điểm, mức tăng ước
        tính khoảng {report.expectedGain}. Giữ đều nhịp là được.
      </p>
    );
  }
  return null;
}

type TaskRow = {
  id: string;
  date: Date;
  order: number;
  catalogId: string;
  title: string;
  href: string;
  estMinutes: number;
  priority: string;
  status: string;
};

/** Gom việc theo ngày, giữ đúng thứ tự đã xếp. */
function groupByDate(tasks: TaskRow[]) {
  const map = new Map<string, TaskRow[]>();
  for (const t of tasks) {
    const key = vnDateKey(t.date);
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({
      date,
      tasks: list
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
}
