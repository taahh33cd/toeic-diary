import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Goal } from "@/lib/firebase/types";
import { loadStudentPracticeSummaries, type StudentPracticeSummary } from "@/lib/journal/staff-results";
import { PracticeOverview } from "./_overview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kết quả HV" };

type Props = { searchParams: Promise<{ hv?: string }> };

/**
 * Bảng "Kết quả HV": mỗi học viên một dòng — thi thật, ước tính từ thi thử,
 * mục tiêu, Part yếu nhất, hoạt động gần đây.
 *
 * Lượt làm bài (Postgres) và mục tiêu (Firebase, đọc bằng Admin SDK vì luật
 * RTDB không cho đọc cả nhánh goals/) nạp ở đây; tên, điểm thi thật và lớp thì
 * client đọc thẳng Firebase như mọi trang admin khác.
 */
export default async function AdminPracticePage({ searchParams }: Props) {
  const { hv } = await searchParams;

  // Link cũ /admin/practice?hv=<userId> → trang kết quả của học viên đó.
  if (hv) {
    const p = await prisma.profile
      .findUnique({ where: { id: hv }, select: { studentCode: true } })
      .catch(() => null);
    redirect(p?.studentCode ? `/admin/students/${encodeURIComponent(p.studentCode)}/results` : "/admin/practice");
  }

  const [summariesRes, goalsRes] = await Promise.allSettled([
    loadStudentPracticeSummaries(),
    // Bọc async: getAdminDb() ném lỗi ngay (đồng bộ) khi thiếu khoá service account.
    (async () => {
      const snap = await getAdminDb().ref("goals").get();
      return (snap.val() ?? {}) as Record<string, Goal>;
    })(),
  ]);

  if (summariesRes.status === "rejected") {
    console.error("[admin/practice] loadStudentPracticeSummaries failed", summariesRes.reason);
  }
  if (goalsRes.status === "rejected") {
    console.error("[admin/practice] read goals failed", goalsRes.reason);
  }

  const summaries: StudentPracticeSummary[] = summariesRes.status === "fulfilled" ? summariesRes.value : [];
  const goals: Record<string, { target: number | null }> = {};
  if (goalsRes.status === "fulfilled") {
    for (const [code, g] of Object.entries(goalsRes.value)) {
      // Chỉ cần mục tiêu L&R; bảng này nói về điểm thang 990.
      goals[code] = { target: typeof g?.target === "number" ? g.target : null };
    }
  }

  return (
    <PracticeOverview
      summaries={summaries}
      goals={goals}
      practiceError={summariesRes.status === "rejected"}
      goalsError={goalsRes.status === "rejected"}
      nowISO={new Date().toISOString()}
    />
  );
}
