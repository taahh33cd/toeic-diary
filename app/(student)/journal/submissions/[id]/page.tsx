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

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Link href="/journal/submissions" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>
        ← Tất cả bài đã nộp
      </Link>

      <header className="mt-2 mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{submission.title}</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {STATUS_LABEL[submission.status as SubmissionStatus] ?? submission.status}
          {submission.band !== null && ` · điểm ước lượng ${submission.band}/200`}
        </p>
      </header>

      {/* Nhận xét chung của giáo viên */}
      {feedback && (feedback.overall || feedback.audioUrl) && (
        <section
          className="rounded-2xl px-4 py-4 mb-4"
          style={{ border: "1px solid var(--border)", background: "var(--accent-faint, var(--bg-elevated))" }}
        >
          <h2 className="text-[11px] font-bold uppercase tracking-wider m-0 mb-2" style={{ color: "var(--text-muted)" }}>
            Nhận xét của giáo viên
          </h2>
          {feedback.overall && (
            <p className="text-sm whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 1.65 }}>
              {feedback.overall}
            </p>
          )}
          {feedback.audioUrl && <audio controls src={feedback.audioUrl} className="w-full mt-3" />}
        </section>
      )}

      <GradedView items={items} feedback={feedback} max={scaleFor(submission.skill, submission.unit)} />
    </div>
  );
}
