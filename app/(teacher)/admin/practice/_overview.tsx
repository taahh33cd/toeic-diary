"use client";

/**
 * Bảng "Kết quả HV" — phần tương tác: lọc lớp, tìm tên, sắp xếp.
 * Ghép ba nguồn theo mã học viên: Firebase (tên, điểm thi thật, lớp — đọc ở
 * đây), Postgres (lượt luyện đề — server gửi xuống) và mục tiêu (server gửi).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import { vnStamp, fmtDay } from "@/components/results/ResultsParts";
import { partShortLabel } from "@/lib/journal/results-math";
import type { StudentPracticeSummary } from "@/lib/journal/staff-results";
import type { SchoolClass, Student } from "@/lib/firebase/types";

/** Bấy nhiêu ngày không nộp bài thì gắn cờ "lâu chưa luyện". */
const STALE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type SortKey = "stale" | "gap" | "score" | "recent";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "stale", label: "Lâu chưa luyện" },
  { key: "gap", label: "Xa mục tiêu nhất" },
  { key: "score", label: "Điểm cao nhất" },
  { key: "recent", label: "Mới nộp" },
];

const NO_CLASS = "__none__";
const ALL = "__all__";

interface Row {
  code: string;
  name: string;
  frozen: boolean;
  classIds: string[];
  classNames: string[];
  real: { score: number; date: string } | null;
  summary: StudentPracticeSummary | null;
  target: number | null;
  /** Điểm dùng để so mục tiêu: thi thật nếu có, không thì ước tính */
  current: number | null;
  gap: number | null;
  /** Số ngày (lịch VN) từ lần nộp cuối tới hôm nay */
  daysSince: number | null;
}

/** Số ngày lịch (giờ VN) giữa hai thời điểm — "hôm qua 23h" so với "hôm nay 1h" là 1 ngày. */
function vnDayDiff(fromISO: string, toISO: string): number {
  const a = Date.parse(vnStamp(fromISO).slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(vnStamp(toISO).slice(0, 10) + "T00:00:00Z");
  return Math.round((b - a) / DAY_MS);
}

function agoLabel(days: number): string {
  if (days <= 0) return "hôm nay";
  if (days === 1) return "hôm qua";
  return `${days} ngày trước`;
}

function toneOfPct(p: number): string {
  if (p >= 80) return "var(--accent-green, #15803d)";
  if (p >= 50) return "#a16207";
  return "var(--accent-red, #b91c1c)";
}

interface OverviewProps {
  summaries: StudentPracticeSummary[];
  goals: Record<string, { target: number | null }>;
  practiceError: boolean;
  goalsError: boolean;
  /** Giờ server lúc dựng trang — dùng chung cho server và trình duyệt để "N ngày trước" không lệch */
  nowISO: string;
}

/** Nối Firebase (danh sách HV, lớp) vào bảng. */
export function PracticeOverview(props: OverviewProps) {
  const { students, loading, error } = useAllStudents();
  const { classes } = useClasses();
  return (
    <PracticeTable {...props} students={students} classes={classes}
      studentsLoading={loading} studentsError={!!error} />
  );
}

/** Bảng thuần — nhận đủ dữ liệu qua props. */
export function PracticeTable({
  summaries, goals, practiceError, goalsError, nowISO,
  students, classes, studentsLoading, studentsError,
}: OverviewProps & {
  students: Student[];
  classes: SchoolClass[];
  studentsLoading: boolean;
  studentsError: boolean;
}) {

  const [classFilter, setClassFilter] = useState<string>(ALL);
  const [sort, setSort] = useState<SortKey>("stale");
  const [query, setQuery] = useState("");
  const [showFrozen, setShowFrozen] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const byCode = new Map(summaries.map((s) => [s.studentCode, s]));
    const classOf = new Map<string, { ids: string[]; names: string[] }>();
    for (const c of classes) {
      for (const code of c.members ?? []) {
        const cur = classOf.get(code) ?? { ids: [], names: [] };
        cur.ids.push(c.id);
        cur.names.push(c.name);
        classOf.set(code, cur);
      }
    }

    const build = (code: string, name: string, frozen: boolean, scores: { score: number; date: string }[] | undefined): Row => {
      const summary = byCode.get(code) ?? null;
      const latest = (scores ?? [])
        .filter((s) => typeof s?.score === "number" && typeof s?.date === "string")
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const real = latest ? { score: latest.score, date: latest.date } : null;
      const target = goals[code]?.target ?? null;
      const current = real?.score ?? summary?.estimate?.value ?? null;
      const cls = classOf.get(code);
      return {
        code, name, frozen,
        classIds: cls?.ids ?? [],
        classNames: cls?.names ?? [],
        real, summary, target, current,
        gap: target !== null && current !== null ? target - current : null,
        daysSince: summary?.lastAtISO ? vnDayDiff(summary.lastAtISO, nowISO) : null,
      };
    };

    const out: Row[] = students.map((s) => build(s.id, s.name || s.id, !!s.frozen, s.scores));
    // Tài khoản có mã HV nhưng không còn trong danh sách Firebase — vẫn hiện để không mất dữ liệu.
    const known = new Set(students.map((s) => s.id));
    for (const s of summaries) {
      if (!known.has(s.studentCode)) out.push(build(s.studentCode, s.displayName ?? s.studentCode, false, undefined));
    }
    return out;
  }, [students, classes, summaries, goals, nowISO]);

  const frozenCount = rows.filter((r) => r.frozen).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (!showFrozen && r.frozen) return false;
      if (classFilter === NO_CLASS && r.classIds.length > 0) return false;
      if (classFilter !== ALL && classFilter !== NO_CLASS && !r.classIds.includes(classFilter)) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
      return true;
    });

    // HV chưa nộp lượt nào luôn xếp cuối, mọi cách sắp xếp.
    const neverLast = (a: Row, b: Row) => Number(a.daysSince === null) - Number(b.daysSince === null);
    // Giá trị thiếu (null) luôn xuống dưới.
    const desc = (x: number | null, y: number | null) =>
      x === null && y === null ? 0 : x === null ? 1 : y === null ? -1 : y - x;

    return list.sort((a, b) => {
      const n = neverLast(a, b);
      if (n !== 0) return n;
      let c = 0;
      if (sort === "stale") c = desc(a.daysSince, b.daysSince);
      else if (sort === "recent") c = desc(b.daysSince, a.daysSince); // ít ngày nhất lên đầu
      else if (sort === "gap") c = desc(a.gap, b.gap);
      else if (sort === "score") c = desc(a.current, b.current);
      return c || a.name.localeCompare(b.name, "vi");
    });
  }, [rows, query, showFrozen, classFilter, sort]);

  const staleCount = visible.filter((r) => r.daysSince !== null && r.daysSince >= STALE_DAYS).length;
  const neverCount = visible.filter((r) => r.daysSince === null).length;

  const selectStyle: React.CSSProperties = {
    background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold m-0" style={{ color: "var(--text-primary)" }}>
          📊 Kết quả HV
        </h1>
        <p className="text-sm mt-1 mb-0" style={{ color: "var(--text-secondary)" }}>
          Điểm thi thật, điểm ước tính từ bài thi thử trong app và mức độ luyện tập của từng học viên.
          Bấm một học viên để xem chi tiết và từng bài đã làm.
        </p>
      </div>

      {(practiceError || goalsError || studentsError) && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", color: "rgb(185,28,28)" }}>
          {practiceError && <div>Không tải được kết quả luyện đề — các cột Ước tính, Part yếu, Hoạt động đang trống.</div>}
          {goalsError && <div>Không tải được mục tiêu của học viên — cột Mục tiêu đang trống.</div>}
          {studentsError && <div>Không tải được danh sách học viên từ Firebase.</div>}
          <div className="text-xs mt-1" style={{ opacity: 0.8 }}>Tải lại trang để thử lại.</div>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="kq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm tên hoặc mã HV"
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ ...selectStyle, minWidth: 0, width: 200, maxWidth: "100%" }}
        />
        <select id="kq-class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg" style={selectStyle} aria-label="Lọc theo lớp">
          <option value={ALL}>Tất cả lớp</option>
          {[...classes].sort((a, b) => a.name.localeCompare(b.name, "vi")).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value={NO_CLASS}>Không thuộc lớp nào</option>
        </select>
        <select id="kq-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-sm px-3 py-2 rounded-lg" style={selectStyle} aria-label="Sắp xếp">
          {SORTS.map((s) => <option key={s.key} value={s.key}>Sắp xếp: {s.label}</option>)}
        </select>
        {frozenCount > 0 && (
          <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <input id="kq-frozen" type="checkbox" checked={showFrozen} onChange={(e) => setShowFrozen(e.target.checked)} />
            Hiện HV đóng băng ({frozenCount})
          </label>
        )}
        <span className="flex-1" />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {visible.length} HV
          {staleCount > 0 && <> · <span style={{ color: "#a16207" }}>⚠ {staleCount} lâu chưa luyện</span></>}
          {neverCount > 0 && <> · {neverCount} chưa luyện bài nào</>}
        </span>
      </div>

      {studentsLoading && rows.length === 0 ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg" style={{ background: "var(--border)" }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <p className="m-0" style={{ color: "var(--text-secondary)" }}>Không có học viên nào khớp bộ lọc.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <table className="w-full text-sm" style={{ minWidth: 820, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border)" }}>
                {["Học viên", "Thi thật", "Ước tính", "Mục tiêu", "Part yếu nhất", "Hoạt động"].map((h, i) => (
                  <th key={h} className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider ${i === 0 ? "text-left" : i === 5 ? "text-left" : "text-right"}`}
                    style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => <OverviewRow key={r.code} r={r} />)}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>
        Ước tính = trung bình tối đa 3 bài thi thử trọn đề gần nhất (đủ 7 part, chế độ thi thử).
        Part yếu nhất tính trên các lượt làm được ít nhất nửa đề, gồm cả từng part trong bài thi thử.
        ⚠ = không nộp bài nào trong {STALE_DAYS} ngày.
      </p>
    </div>
  );
}

function OverviewRow({ r }: { r: Row }) {
  const router = useRouter();
  const href = `/admin/students/${encodeURIComponent(r.code)}/results`;
  const s = r.summary;
  const stale = r.daysSince !== null && r.daysSince >= STALE_DAYS;
  const cell = "px-3 py-2.5 align-top";
  const muted = { color: "var(--text-muted)" };

  return (
    // Cả dòng bấm được; link ở tên vẫn giữ cho bàn phím và mở tab mới.
    <tr className="transition-colors hover:brightness-95 cursor-pointer" style={{ borderBottom: "1px solid var(--border)" }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        router.push(href);
      }}>
      <td className={cell}>
        <Link href={href} className="no-underline block" style={{ color: "var(--text-primary)" }}>
          <span className="font-semibold">{r.name}</span>
          {r.frozen && <span className="ml-1" title="Đang đóng băng">❄️</span>}
          <span className="block text-xs" style={muted}>
            {r.code}{r.classNames.length > 0 ? ` · ${r.classNames.join(", ")}` : ""}
          </span>
        </Link>
      </td>
      <td className={`${cell} text-right tabular-nums`}>
        {r.real ? (
          <>
            <span className="font-bold">{r.real.score}</span>
            <span className="block text-xs" style={muted}>{fmtDay(r.real.date)}</span>
          </>
        ) : <span style={muted}>—</span>}
      </td>
      <td className={`${cell} text-right tabular-nums`}>
        {s?.estimate ? (
          <>
            <span className="font-bold">~{s.estimate.value}</span>
            {s.trend !== null && s.trend !== 0 && (
              <span className="ml-1 text-xs font-bold" title="Bài thi thử gần nhất so với bài trước"
                style={{ color: s.trend > 0 ? "var(--accent-green, #15803d)" : "var(--accent-red, #b91c1c)" }}>
                {s.trend > 0 ? "▲" : "▼"}{Math.abs(s.trend)}
              </span>
            )}
            <span className="block text-xs" style={muted}>{s.estimate.n} bài thi thử</span>
          </>
        ) : <span style={muted}>—</span>}
      </td>
      <td className={`${cell} text-right tabular-nums`}>
        {r.target !== null ? (
          <>
            <span className="font-bold">{r.target}</span>
            <span className="block text-xs" style={r.gap !== null && r.gap <= 0 ? { color: "var(--accent-green, #15803d)" } : muted}>
              {r.gap === null ? "chưa có điểm" : r.gap <= 0 ? "✓ đã đạt" : `còn ${r.gap}`}
            </span>
          </>
        ) : <span style={muted}>—</span>}
      </td>
      <td className={`${cell} text-right tabular-nums`}>
        {s?.weakest ? (
          <>
            <span className="font-bold" style={{ color: toneOfPct(s.weakest.pct) }}>{s.weakest.pct}%</span>
            <span className="block text-xs" style={muted}>{partShortLabel(s.weakest.part)}</span>
          </>
        ) : <span style={muted}>—</span>}
      </td>
      <td className={cell}>
        {r.daysSince === null ? (
          <span className="text-xs" style={muted}>
            Chưa luyện bài nào{s && s.unfinished > 0 ? ` · ${s.unfinished} bài dở` : ""}
          </span>
        ) : (
          <>
            <span className="font-semibold" style={stale ? { color: "#a16207" } : undefined}>
              {stale && "⚠ "}{agoLabel(r.daysSince)}
            </span>
            <span className="block text-xs" style={muted}>
              {s!.done7d} lượt/7 ngày · {s!.doneTotal} tổng
              {s!.unfinished > 0 ? ` · ${s!.unfinished} dở` : ""}
            </span>
          </>
        )}
      </td>
    </tr>
  );
}
