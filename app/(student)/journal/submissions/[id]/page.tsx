import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { STATUS_LABEL, scaleFor, type SubmissionFeedback, type SubmissionItem, type SubmissionStatus } from "@/lib/submissions";
import { GradedView } from "./_graded-view";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Xem lại bài làm" };

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/journal/submissions/${id}`);

  const submission = await prisma.skillSubmission.findFirst({ where: { id, userId: user.id } });
  if (!submission) notFound();

  const items = (submission.items ?? []) as unknown as SubmissionItem[];
  const feedback = (submission.feedback ?? null) as unknown as SubmissionFeedback | null;

  const meta = [
    STATUS_LABEL[submission.status as SubmissionStatus] ?? submission.status,
    submission.band !== null ? `điểm ước lượng ${submission.band}/200` : null,
    submission.gradedAt
      ? `chấm ngày ${submission.gradedAt.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" })}`
      : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="w-full">
      <Link href="/journal/submissions" className="text-xs no-underline px-3 md:px-6 print:hidden" style={{ color: "var(--text-muted)" }}>
        ← Tất cả bài đã nộp
      </Link>
      <GradedView items={items} feedback={feedback} max={scaleFor(submission.skill, submission.unit)} title={submission.title} meta={meta} />
    </div>
  );
}
