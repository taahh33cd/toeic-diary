import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { STATUS_LABEL, scaleFor, type SubmissionFeedback, type SubmissionItem, type SubmissionStatus } from "@/lib/submissions";
import { GradedView } from "./_graded-view";
import { AiBanner } from "./_ai-banner";

/**
 * Bài AI chấm hiện điểm dạng khoảng: công thức quy đổi chỉ là trung bình rubric
 * nhân 200, một con số chẵn chòi dễ bị tin hơn mức nó đáng.
 */
function bandText(band: number, byAi: boolean): string {
  if (!byAi) return `điểm ước lượng ${band}/200`;
  const lo = Math.max(0, band - 10);
  const hi = Math.min(200, band + 10);
  return `điểm AI ước tính ${lo}–${hi}/200`;
}

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

  const byAi = feedback?.by === "ai";

  const meta = [
    STATUS_LABEL[submission.status as SubmissionStatus] ?? submission.status,
    submission.band !== null ? bandText(submission.band, byAi) : null,
    submission.gradedAt
      ? `chấm ngày ${submission.gradedAt.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" })}`
      : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="w-full">
      <Link href="/journal/submissions" className="text-xs no-underline px-3 md:px-6 print:hidden" style={{ color: "var(--text-muted)" }}>
        ← Tất cả bài đã nộp
      </Link>
      {byAi && <AiBanner id={submission.id} pending={submission.status === "submitted"} />}
      <GradedView id={submission.id} items={items} feedback={feedback} max={scaleFor(submission.skill, submission.unit)} title={submission.title} meta={meta} />
    </div>
  );
}
