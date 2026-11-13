import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { diagnose } from "@/lib/roadmap/diagnose";
import { vnDateKey, vnToday } from "@/lib/roadmap/vn-date";
import type { Intake, MonthGoal, PartScoreInput } from "@/lib/roadmap/types";

import { RoadmapEditor } from "./_editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lộ trình học viên" };

/**
 * Trang GV xem và sửa lộ trình của một học viên.
 *
 * Để riêng chứ không nhét vào trang hồ sơ học viên: trang đó đã 2.600 dòng, là
 * một client component chạy hoàn toàn trên Firebase RTDB theo `studentCode`,
 * còn lộ trình nằm ở Postgres theo `userId`. Trộn vào nhau chỉ để tiết kiệm một
 * cú bấm là đổi lấy rủi ro làm hỏng trang GV dùng nhiều nhất.
 */
export default async function AdminRoadmapPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const student = await prisma.profile.findUnique({
    where: { studentCode: code },
    select: { id: true, displayName: true, studentCode: true, roadmapEnabled: true },
  });
  if (!student) notFound();

  const plan = await prisma.studyPlan.findFirst({
    where: { userId: student.id, status: "active" },
    include: {
      weeks: {
        orderBy: { weekIndex: "asc" },
        include: { tasks: { orderBy: [{ date: "asc" }, { order: "asc" }] } },
      },
    },
  });

  const header = (
    <div className="mb-6">
      <Link
        href={`/admin/students/${code}`}
        className="text-sm underline"
        style={{ color: "var(--accent-primary)" }}
      >
        ← Về hồ sơ học viên
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        Lộ trình · {student.displayName ?? code}
      </h1>
    </div>
  );

  if (!plan) {
    return (
      <div>
        {header}
        <p style={{ color: "var(--text-secondary)" }}>
          Học viên chưa có lộ trình.
          {!student.roadmapEnabled && (
            <> Tài khoản này cũng chưa được mở quyền dùng khu Lộ trình.</>
          )}
        </p>
      </div>
    );
  }

  const baseline = plan.baseline as unknown as {
    total: number;
    listening: number | null;
    reading: number | null;
    parts: PartScoreInput[];
  };
  const current = plan.current as unknown as typeof baseline | null;
  const intake = plan.intake as unknown as Intake;
  const months = (plan.monthGoals as unknown as MonthGoal[]) ?? [];

  const report = diagnose({
    partScores: (current ?? baseline).parts,
    total: (current ?? baseline).total,
    targetScore: plan.targetScore,
    deadline: plan.deadline ? vnDateKey(plan.deadline) : null,
    startDate: vnToday(),
    minutesPerDay: intake.minutesPerDay,
    daysPerWeek: intake.daysPerWeek,
  });

  const stats = {
    done: plan.weeks.flatMap((w) => w.tasks).filter((t) => t.status === "done").length,
    total: plan.weeks.flatMap((w) => w.tasks).length,
  };

  return (
    <div>
      {header}

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
        <Stat label="Điểm đầu vào" value={`${baseline.total}`} />
        <Stat label="Điểm mới nhất" value={current ? `${current.total}` : "—"} />
        <Stat label="Mục tiêu" value={plan.targetScore ? `${plan.targetScore}` : "chưa đặt"} />
        <Stat
          label="Đã làm"
          value={`${stats.done}/${stats.total} việc`}
        />
        <Stat
          label="Nhịp học khai"
          value={`${intake.minutesPerDay}′ × ${intake.daysPerWeek} ngày`}
        />
        <Stat
          label="Phần đang chữa"
          value={report.focusParts.map((p) => `Part ${p}`).join(", ")}
        />
        <Stat
          label="Ngày thi"
          value={plan.deadline ? vnDateKey(plan.deadline) : "chưa đặt"}
        />
        <Stat label="Số tuần đã xếp" value={`${plan.weeks.length}`} />
      </dl>

      {months.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-2">Mục tiêu tháng</h2>
          <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            {months.map((m) => (
              <li key={m.monthIndex}>
                <strong style={{ color: "var(--text-primary)" }}>{m.label}</strong> — mốc{" "}
                {m.targetScore} · {m.startDate} → {m.endDate}
              </li>
            ))}
          </ul>
        </section>
      )}

      <RoadmapEditor
        code={code}
        today={vnToday()}
        weeks={plan.weeks.map((w) => ({
          id: w.id,
          weekIndex: w.weekIndex,
          startDate: vnDateKey(w.startDate),
          endDate: vnDateKey(w.endDate),
          theme: w.theme,
          goalText: w.goalText,
          status: w.status,
          teacherNote:
            ((w.review as Record<string, unknown> | null)?.teacherNote as string) ?? "",
          tasks: w.tasks.map((t) => ({
            id: t.id,
            date: vnDateKey(t.date),
            title: t.title,
            href: t.href,
            estMinutes: t.estMinutes,
            priority: t.priority,
            status: t.status,
          })),
        }))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
    >
      <dt style={{ color: "var(--text-secondary)", fontSize: ".72rem" }}>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
