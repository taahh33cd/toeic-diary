import { prisma } from "@/lib/db/prisma";
import {
  describeAttemptGroups, loadAttemptHistory, toClientAttempt, type ClientAttempt,
} from "@/lib/journal/attempts";
import type { GroupMeta } from "@/components/results/ResultsParts";
import { StudentResults } from "./_client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kết quả học viên" };

/**
 * Kết quả của một học viên cho giáo viên: như trang Kết quả HV tự xem, nhưng
 * chỉ đọc. Để thành trang riêng (như Lộ trình) thay vì nhét vào hồ sơ HV: hồ sơ
 * là client component lớn chạy trên Firebase, còn lượt làm bài nằm ở Postgres.
 */
export default async function AdminStudentResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  let code = rawCode;
  try { code = decodeURIComponent(rawCode); } catch { /* đã giải mã sẵn */ }

  const profile = await prisma.profile
    .findUnique({ where: { studentCode: code }, select: { id: true, displayName: true } })
    .catch(() => null);

  let attempts: ClientAttempt[] = [];
  let groupMeta: GroupMeta[] = [];
  let attemptsError = false;

  if (profile) {
    try {
      const items = await loadAttemptHistory(profile.id);
      attempts = items.map(toClientAttempt);
      groupMeta = describeAttemptGroups([...new Set(items.map((i) => i.groupKey))]);
    } catch (err) {
      console.error("[admin/students/results] loadAttemptHistory failed", err);
      attemptsError = true;
    }
  }

  return (
    <StudentResults
      code={code}
      hasAccount={!!profile}
      accountName={profile?.displayName ?? null}
      attempts={attempts}
      groupMeta={groupMeta}
      attemptsError={attemptsError}
    />
  );
}
