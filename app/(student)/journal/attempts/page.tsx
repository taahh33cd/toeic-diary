import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { loadAttemptHistory, groupAttempts, type AttemptItem } from "@/lib/journal/attempts";

export const metadata = { title: "Kết quả luyện đề" };

/** Giờ Việt Nam — server chạy ở UTC nên phải nói rõ, không thì lệch ngày buổi tối. */
function fmt(d: Date): string {
  return d.toLocaleDateString("vi-VN", {
    day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
  });
}

function fmtFull(d: Date): string {
  return d.toLocaleString("vi-VN", {
    day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function pct(correct: number | null, gradable: number | null): number | null {
  if (correct === null || !gradable) return null;
  return Math.round((correct / gradable) * 100);
}

/** Màu theo tỷ lệ đúng: đỏ dưới 50%, vàng 50-79%, xanh từ 80%. */
function toneOf(p: number | null): string {
  if (p === null) return "var(--text-muted)";
  if (p >= 80) return "#15803d";
  if (p >= 50) return "#a16207";
  return "#b91c1c";
}

function ScoreCell({ a }: { a: AttemptItem }) {
  const p = pct(a.correct, a.gradable);
  return (
    <span className="tabular-nums font-bold text-sm whitespace-nowrap" style={{ color: toneOf(p) }}>
      {a.correct ?? "–"}
      <span className="font-normal" style={{ color: "var(--text-muted)" }}>/{a.gradable ?? "–"}</span>
      {p !== null && <span className="ml-1.5 text-xs font-semibold">{p}%</span>}
    </span>
  );
}

export default async function AttemptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/journal/attempts");

  const items = await loadAttemptHistory(user.id);
  const unfinished = items.filter((i) => i.status === "in_progress" && i.answered > 0);
  const groups = groupAttempts(items);
  const done = items.filter((i) => i.status === "done");

  // Tỷ lệ đúng chung: cộng dồn câu đúng / câu chấm được, không lấy trung bình
  // các tỷ lệ (một lượt 1 câu sẽ kéo lệch cả con số).
  const sumCorrect = done.reduce((s, a) => s + (a.correct ?? 0), 0);
  const sumGradable = done.reduce((s, a) => s + (a.gradable ?? 0), 0);
  const overall = pct(sumCorrect, sumGradable);

  return (
    <div className="max-w-4xl mx-auto w-full">
      <PageHeading
        title="Kết quả luyện đề"
        note="Mọi lượt bạn đã làm ở khu Luyện đề — Listening Part 1, Part 2 và thi thử trọn đề."
      />

      {done.length === 0 && unfinished.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>
            Chưa có lượt làm bài nào được lưu.
          </p>
          <div className="flex gap-4 justify-center mt-2 text-sm font-semibold">
            <Link href="/skills/listening" style={{ color: "var(--accent-primary)" }}>Luyện Listening →</Link>
            <Link href="/skills/full-tests" style={{ color: "var(--accent-primary)" }}>Thi thử trọn đề →</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Ba con số tổng */}
          {done.length > 0 && (
            <div
              className="flex flex-wrap gap-x-8 gap-y-3 px-3 py-3 mb-5"
              style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
            >
              {[
                { label: "Lượt đã nộp", value: String(done.length) },
                { label: "Đề đã làm", value: String(new Set(done.map((a) => a.groupKey + a.testTitle)).size) },
                { label: "Tỷ lệ đúng", value: overall === null ? "–" : `${overall}%` },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {s.value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Bài đang làm dở */}
          {unfinished.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold m-0 mb-2" style={{ color: "var(--text-secondary)" }}>
                Đang làm dở
              </h2>
              <ul className="list-none p-0 m-0" style={{ borderTop: "1px solid var(--border)" }}>
                {unfinished.map((a) => (
                  <li key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <Link
                      href={a.testHref}
                      className="flex items-center gap-3 px-2 py-3 no-underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">
                          {a.groupLabel} · {a.testTitle}
                        </span>
                        <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          Đã trả lời {a.answered} câu · lưu lúc {fmtFull(a.at)}
                        </span>
                      </span>
                      <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
                        Làm tiếp →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lịch sử theo dạng bài → đề → từng lượt */}
          {groups.map((g) => (
            <section key={g.key} className="mb-7">
              <h2
                className="flex items-baseline gap-2 text-sm font-bold m-0 mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {g.label}
                <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                  {g.attemptCount} lượt
                </span>
              </h2>

              <div style={{ borderTop: "1px solid var(--border)" }}>
                {g.tests.map((t) => (
                  <div key={t.testTitle} style={{ borderBottom: "1px solid var(--border)" }} className="py-2.5">
                    <div className="flex items-center gap-3 px-2">
                      <Link
                        href={t.testHref}
                        className="flex-1 min-w-0 text-sm font-semibold no-underline truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t.testTitle}
                      </Link>
                      <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {t.attempts.length} lượt
                        {t.best !== null && t.latest.gradable ? ` · cao nhất ${t.best}/${t.latest.gradable}` : ""}
                      </span>
                    </div>

                    <ul className="list-none p-0 m-0 mt-1">
                      {t.attempts.map((a) => (
                        <li key={a.id} className="flex items-center gap-3 px-2 py-1.5">
                          <ScoreCell a={a} />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {a.modeLabel}
                            {a.total !== null ? ` · ${a.total} điểm` : ""}
                          </span>
                          <span className="flex-1" />
                          <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {fmt(a.at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
