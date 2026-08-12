import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { STATUS_LABEL, type SubmissionStatus } from "@/lib/submissions";

export const metadata = { title: "Bài đã nộp" };

const STATUS_STYLE: Record<SubmissionStatus, { bg: string; fg: string }> = {
  draft: { bg: "rgba(120,120,120,0.12)", fg: "var(--text-muted)" },
  submitted: { bg: "rgba(234,179,8,0.14)", fg: "#a16207" },
  graded: { bg: "rgba(34,197,94,0.14)", fg: "#15803d" },
};

function fmt(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
}

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/journal/submissions");

  const submissions = await prisma.skillSubmission.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, skill: true, title: true, status: true, band: true,
      submittedAt: true, gradedAt: true, updatedAt: true,
    },
  });

  return (
    <div className="max-w-3xl mx-auto w-full">
      <header className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Bài Speaking &amp; Writing</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Bài bạn đã lưu từ khu Luyện đề. Bài gửi giáo viên chấm sẽ có nhận xét ngay tại đây.
        </p>
      </header>

      {submissions.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-8 text-center"
          style={{ border: "1px dashed var(--border)", background: "var(--bg-elevated)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có bài nào được lưu.</p>
          <div className="flex gap-3 justify-center mt-3 text-sm font-semibold">
            <Link href="/skills/speaking" style={{ color: "var(--accent-primary)" }}>Luyện Speaking →</Link>
            <Link href="/skills/writing" style={{ color: "var(--accent-primary)" }}>Luyện Writing →</Link>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
          {submissions.map((s) => {
            const st = STATUS_STYLE[(s.status as SubmissionStatus)] ?? STATUS_STYLE.draft;
            return (
              <li key={s.id}>
                <Link
                  href={`/journal/submissions/${s.id}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
                >
                  <span className="text-xl" aria-hidden="true">{s.skill === "speaking" ? "🎙️" : "✍️"}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {s.title}
                    </span>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {s.status === "graded"
                        ? `Chấm ngày ${fmt(s.gradedAt)}${s.band !== null ? ` · ước lượng ${s.band}/200` : ""}`
                        : s.status === "submitted"
                        ? `Gửi ngày ${fmt(s.submittedAt)}`
                        : `Lưu ngày ${fmt(s.updatedAt)}`}
                    </span>
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap"
                    style={{ background: st.bg, color: st.fg }}
                  >
                    {STATUS_LABEL[(s.status as SubmissionStatus)] ?? s.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
