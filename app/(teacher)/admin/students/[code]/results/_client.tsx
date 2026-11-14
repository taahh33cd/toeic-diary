"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useGoal } from "@/hooks/firebase/useGoal";
import {
  ScoreChart, KindBadge, RowShell, UnfinishedList, NextUp, LrHistory, ResultsViewProvider,
  estimateFromMocks, isChartMock, vnStamp, fmtDay,
  type ClientAttempt, type GroupMeta, type ChartPoint, type HistoryFilter, type ResultsView,
} from "@/components/results/ResultsParts";
import type { Goal, Student, ToeicScore } from "@/lib/firebase/types";

const STAFF_VIEW: ResultsView = {
  staff: true,
  reviewHref: (id) => `/admin/practice/attempts/${encodeURIComponent(id)}`,
};

const PARTS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const;

/** Dòng điểm thi thật — chỉ xem; sửa/xoá ở khu Điểm số của hồ sơ HV. */
function RealRow({ score, highlight }: { score: ToeicScore; highlight: boolean }) {
  const parts = PARTS.filter((k) => (score[k] ?? 0) > 0).map((k) => `P${k[1]} ${score[k]}`);
  return (
    <RowShell
      day={fmtDay(score.date)}
      badge={<KindBadge kind="real" />}
      title={score.testname || "Kỳ thi TOEIC"}
      sub={[
        `Listening ${score.l ?? "–"} · Reading ${score.r ?? "–"}`,
        parts.length > 0 ? parts.join(" · ") : null,
        score.note ? score.note : null,
      ].filter(Boolean).join(" — ")}
      score={score.score}
      highlight={highlight}
    />
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: tone ?? "var(--text-primary)" }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

interface StudentResultsProps {
  code: string;
  /** Có tài khoản đăng nhập gắn mã HV này — không có thì chưa thể làm bài trong app */
  hasAccount: boolean;
  accountName: string | null;
  attempts: ClientAttempt[];
  groupMeta: GroupMeta[];
  attemptsError: boolean;
}

/** Nối Firebase (điểm thi thật, mục tiêu) vào màn kết quả. */
export function StudentResults(props: StudentResultsProps) {
  const { student, loading } = useStudent(props.code);
  const { goal } = useGoal(props.code);
  return <StudentResultsView {...props} student={student} goal={goal} loading={loading} />;
}

export function StudentResultsView({
  code, hasAccount, accountName, attempts, groupMeta, attemptsError, student, goal, loading,
}: StudentResultsProps & { student: Student | null; goal: Goal | null; loading: boolean }) {
  const [filter, setFilter] = useState<HistoryFilter>({ kind: "all", group: null });
  const historyRef = useRef<HTMLDivElement>(null);

  const rawScores = student?.scores;
  const rawSwScores = student?.swScores;
  const scores = useMemo<ToeicScore[]>(
    () => (rawScores ? [...rawScores].sort((a, b) => b.date.localeCompare(a.date)) : []),
    [rawScores],
  );
  const latestReal = scores[0] ?? null;
  const estimate = useMemo(() => estimateFromMocks(attempts), [attempts]);
  const target = typeof goal?.target === "number" ? goal.target : null;
  const current = latestReal?.score ?? estimate?.value ?? null;
  const gap = target !== null && current !== null ? target - current : null;

  const points = useMemo<ChartPoint[]>(() => [
    ...scores.map((s) => ({ score: s.score, date: s.date, kind: "real" as const, label: s.testname })),
    ...attempts.filter(isChartMock).map((a) => ({
      score: a.total!, date: vnStamp(a.atISO), kind: "mock" as const, label: `${a.groupLabel} · ${a.testTitle}`,
    })),
  ], [scores, attempts]);

  const swScores = useMemo(
    () => (rawSwScores ? [...rawSwScores].sort((a, b) => b.date.localeCompare(a.date)) : []),
    [rawSwScores],
  );

  const name = student?.name || accountName || code;

  function pickGroup(groupKey: string) {
    setFilter({ kind: groupKey.startsWith("full-") ? "mock" : "part", group: groupKey });
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ResultsViewProvider value={STAFF_VIEW}>
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={`/admin/students/${encodeURIComponent(code)}`} className="underline" style={{ color: "var(--accent-primary)" }}>
              ← Về hồ sơ học viên
            </Link>
            <Link href="/admin/practice" className="underline" style={{ color: "var(--text-secondary)" }}>
              Bảng Kết quả HV
            </Link>
          </div>
          <h1 className="mt-2 mb-0 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Kết quả · {loading && !student ? code : name}
          </h1>
          <p className="text-xs mt-1 mb-0" style={{ color: "var(--text-muted)" }}>
            Mã HV: {code} · Chỉ xem. Sửa hoặc xoá điểm thi thật ở mục Điểm số trong hồ sơ học viên.
          </p>
        </div>

        {!hasAccount && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.35)", color: "var(--text-secondary)" }}>
            Mã HV này chưa gắn với tài khoản đăng nhập nào, nên học viên chưa thể làm bài trong app. Trang chỉ có điểm thi thật nhập tay.
          </div>
        )}

        {/* Tóm tắt + biểu đồ: biểu đồ giữ nửa bề ngang, kéo rộng hơn thì chữ trên trục phóng to theo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="grid grid-cols-2 gap-3 content-start">
          <Stat label="Mục tiêu" value={target ?? "—"}
            sub={goal?.deadline ? `Trước tháng ${goal.deadline.slice(5, 7)}/${goal.deadline.slice(0, 4)}` : target === null ? "Chưa đặt" : undefined} />
          <Stat label="Thi thật gần nhất" value={latestReal?.score ?? "—"}
            sub={latestReal ? fmtDay(latestReal.date) : "Chưa có"} />
          <Stat label="Ước tính" value={estimate ? `~${estimate.value}` : "—"}
            sub={estimate ? (estimate.n === 1 ? "từ 1 bài thi thử" : `TB ${estimate.n} bài thi thử gần nhất`) : "Chưa có bài thi thử đủ 7 part"} />
          <Stat label="Còn thiếu"
            value={gap === null ? "—" : gap <= 0 ? "Đã đạt" : gap}
            tone={gap !== null && gap <= 0 ? "var(--accent-green, #15803d)" : undefined}
            sub={gap === null ? undefined : latestReal ? "so với thi thật" : "so với ước tính"} />
        </div>

        <div className="rounded-xl border p-4 min-w-0" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold m-0 mb-3" style={{ color: "var(--text-secondary)" }}>Điểm theo thời gian (L&amp;R)</h2>
          <ScoreChart points={points} noDataLabel="Chưa có điểm thi thật hay bài thi thử nào" />
        </div>
        </div>

        <UnfinishedList attempts={attempts} />
        <NextUp attempts={attempts} groupMeta={groupMeta} onPick={pickGroup} />

        <div ref={historyRef} style={{ scrollMarginTop: 80 }}>
          <LrHistory
            scores={scores}
            attempts={attempts}
            attemptsError={attemptsError}
            filter={filter}
            onFilter={setFilter}
            renderReal={(s, _i, highlight) => <RealRow score={s} highlight={highlight} />}
          />
        </div>

        {swScores.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold m-0 px-4 py-3" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
              Speaking &amp; Writing
            </h2>
            <ul className="list-none p-0 m-0">
              {swScores.map((s, i) => (
                <li key={`${s.date}-${s.total}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)", width: 80 }}>{fmtDay(s.date)}</span>
                  <span className="flex-1 min-w-0 truncate">{s.testname || "Kỳ thi S&W"}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Speaking {s.s ?? "–"} · Writing {s.w ?? "–"}</span>
                  <span className="font-bold tabular-nums">{s.total}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ResultsViewProvider>
  );
}
