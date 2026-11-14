import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { loadAttemptDetailForStaff } from "@/lib/journal/attempts";
import { StaffAttemptReview } from "./_review-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Xem bài học viên" };

type Props = { params: Promise<{ id: string }> };

/**
 * Giáo viên xem lại một lượt làm bài của học viên: đáp án đã chọn, câu sai,
 * audio, transcript — chỉ xem. Quyền vào trang do layout admin kiểm tra.
 */
export default async function StaffAttemptPage({ params }: Props) {
  const { id } = await params;

  const detail = await loadAttemptDetailForStaff(id);
  if (!detail) notFound();

  const profile = await prisma.profile
    .findUnique({ where: { id: detail.userId }, select: { studentCode: true, displayName: true } })
    .catch(() => null);

  const backHref = profile?.studentCode
    ? `/admin/students/${encodeURIComponent(profile.studentCode)}/results`
    : "/admin/practice";
  const backLabel = profile?.displayName
    ? `Kết quả của ${profile.displayName}`
    : "Kết quả HV";

  return (
    <StaffAttemptReview
      test={detail.test}
      config={detail.config}
      answers={detail.answers}
      marked={detail.marked}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
