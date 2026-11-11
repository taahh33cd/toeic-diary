import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import {
  groupAttempts, loadAttemptHistory, loadStudentAttemptSummaries,
} from "@/lib/journal/attempts";

export const metadata = { title: "Luyện đề" };

type Props = { searchParams: Promise<{ hv?: string }> };

function pct(correct: number, gradable: number): number | null {
  return gradable ? Math.round((correct / gradable) * 100) : null;
}

function tone(p: number | null): string {
  if (p === null) return "var(--text-muted)";
  if (p >= 80) return "#15803d";
  if (p >= 50) return "#a16207";
  return "#b91c1c";
}

function fmt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh",
  });
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("vi-VN", {
    day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
  });
}

/** Lịch sử đầy đủ của một học viên. */
async function StudentDetail({ userId }: { userId: string }) {
  const [profile, items] = await Promise.all([
    prisma.profile
      .findUnique({ where: { id: userId }, select: { displayName: true, studentCode: true } })
      .catch(() => null),
    loadAttemptHistory(userId),
  ]);

  const done = items.filter((i) => i.status === "done");
  const unfinished = items.filter((i) => i.status === "in_progress" && i.answered > 0);
  const sumC = done.reduce((s, a) => s + (a.correct ?? 0), 0);
  const sumG = done.reduce((s, a) => s + (a.gradable ?? 0), 0);
  const overall = pct(sumC, sumG);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/practice" className="text-xs no-underline" style={{ color: "var(--text-muted)" }}>
          ← Tất cả học viên
        </Link>
        <h1 className="text-xl font-bold mt-2 mb-1" style={{ color: "var(--text-primary)" }}>
          🎧 {profile?.displayName ?? "Học viên"}
          {profile?.studentCode && (
            <span className="text-sm font-normal ml-2" style={{ color: "var(--text-muted)" }}>
              {profile.studentCode}
            </span>
          )}
        </h1>
        <p className="text-sm m-0" style={{ color: "var(--text-secondary)" }}>
          {done.length} lượt đã nộp · tỷ lệ đúng chung{" "}
          <strong style={{ color: tone(overall) }}>{overall === null ? "—" : `${overall}%`}</strong>
          {unfinished.length > 0 ? ` · ${unfinished.length} bài đang làm dở` : ""}
        </p>
      </div>

      {done.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <p className="m-0" style={{ color: "var(--text-secondary)" }}>Học viên chưa nộp lượt nào.</p>
        </div>
      ) : (
        groupAttempts(items).map((g) => (
          <section key={g.key}>
            <h2 className="text-sm font-bold mb-2" style={{ color: "var(--text-secondary)" }}>
              {g.label} <span className="font-normal" style={{ color: "var(--text-muted)" }}>· {g.attemptCount} lượt</span>
            </h2>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              {g.tests.map((t) => (
                <div key={t.testTitle} className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {t.testTitle}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t.attempts.length} lượt
                      {t.best !== null && t.latest.gradable ? ` · cao nhất ${t.best}/${t.latest.gradable}` : ""}
                    </span>
                  </div>
                  <ul className="list-none p-0 m-0 mt-1.5 flex flex-col gap-1">
                    {t.attempts.map((a) => {
                      const p = pct(a.correct ?? 0, a.gradable ?? 0);
                      return (
                        <li key={a.id} className="flex items-center gap-3 text-xs">
                          <span className="font-bold tabular-nums" style={{ color: tone(p) }}>
                            {a.correct ?? "–"}/{a.gradable ?? "–"}
                            {p !== null ? ` · ${p}%` : ""}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>
                            {a.modeLabel}{a.total !== null ? ` · ${a.total} điểm` : ""}
                          </span>
                          <span className="flex-1" />
                          <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
                            {fmtDay(a.at)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default async function AdminPracticePage({ searchParams }: Props) {
  const { hv } = await searchParams;
  if (hv) return <StudentDetail userId={hv} />;

  const rows = await loadStudentAttemptSummaries();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold m-0" style={{ color: "var(--text-primary)" }}>
          🎧 Luyện đề
        </h1>
        <p className="text-sm mt-1 mb-0" style={{ color: "var(--text-secondary)" }}>
          Kết quả học viên tự làm ở khu Luyện đề — Listening Part 1/2 và thi thử trọn đề.
          Bấm một học viên để xem từng lượt.
        </p>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">🎧</div>
          <p className="m-0" style={{ color: "var(--text-secondary)" }}>Chưa có học viên nào nộp bài.</p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          {rows.map((r) => {
            const p = pct(r.correct, r.gradable);
            return (
              <Link
                key={r.userId}
                href={`/admin/practice?hv=${r.userId}`}
                className="flex items-center gap-4 px-4 py-3 no-underline"
                style={{ borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate">
                    {r.displayName ?? "(chưa có tên)"}
                    {r.studentCode && (
                      <span className="font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                        {r.studentCode}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Nộp lần cuối {fmt(r.last)}
                  </span>
                </span>
                <span className="text-xs text-right whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                  {r.attempts} lượt
                </span>
                <span className="text-sm font-bold tabular-nums w-20 text-right" style={{ color: tone(p) }}>
                  {p === null ? "—" : `${p}%`}
                  <span className="block text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>
                    {r.correct}/{r.gradable}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
