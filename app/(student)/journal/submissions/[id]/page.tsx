import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { STATUS_LABEL, type SubmissionFeedback, type SubmissionItem, type SubmissionStatus } from "@/lib/submissions";

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
  const fbOf = (idx: number) => feedback?.items?.find((f) => f.idx === idx);

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

      <ol className="flex flex-col gap-3 list-none p-0 m-0">
        {items.map((it) => {
          const fb = fbOf(it.idx);
          return (
            <li
              key={it.idx}
              className="rounded-2xl px-4 py-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Câu {it.idx + 1}
                </span>
                {typeof fb?.score === "number" && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded"
                    style={{ background: "rgba(34,197,94,0.14)", color: "#15803d" }}
                  >
                    {fb.score}/5
                  </span>
                )}
              </div>

              {it.prompt && (
                <p className="text-xs m-0 mb-2 italic" style={{ color: "var(--text-secondary)" }}>{it.prompt}</p>
              )}
              {it.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt="" className="w-full rounded-lg mb-2" />
              )}

              {it.text && (
                <p className="text-sm whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 1.7 }}>
                  {it.text}
                </p>
              )}
              {it.audioUrl && <audio controls src={it.audioUrl} className="w-full mt-1" />}

              {fb?.corrected && (
                <div
                  className="mt-3 rounded-lg px-3 py-2"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider m-0 mb-1" style={{ color: "#15803d" }}>
                    Bản sửa của giáo viên
                  </p>
                  <p className="text-sm whitespace-pre-wrap m-0" style={{ color: "var(--text-primary)", lineHeight: 1.7 }}>
                    {fb.corrected}
                  </p>
                </div>
              )}

              {fb?.comment && (
                <p className="text-sm whitespace-pre-wrap mt-3 mb-0" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  💬 {fb.comment}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
