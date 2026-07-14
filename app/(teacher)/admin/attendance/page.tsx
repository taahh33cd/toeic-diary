"use client";

import { useState, useMemo } from "react";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import { useClassAttendance } from "@/hooks/firebase/useClassAttendance";
import { setAttendance } from "@/lib/firebase/helpers";
import type { AttendanceStatus, Student } from "@/lib/firebase/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    days.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const DOW_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
function getDow(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DOW_SHORT[new Date(y, m - 1, d).getDay()];
}

const ATT_CYCLE: (AttendanceStatus | null)[] = [null, "present", "absent", "late"];

const STATUS_CONFIG: Record<
  AttendanceStatus | "none",
  { label: string; bg: string; color: string; border: string }
> = {
  present: { label: "Có mặt", bg: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)",  border: "rgba(16,185,129,0.3)" },
  absent:  { label: "Vắng",   bg: "rgba(239,68,68,0.10)",  color: "rgb(220,38,38)",  border: "rgba(239,68,68,0.3)" },
  late:    { label: "Muộn",   bg: "rgba(245,158,11,0.12)", color: "rgb(180,120,0)",  border: "rgba(245,158,11,0.3)" },
  none:    { label: "—",      bg: "var(--bg-primary)",     color: "var(--text-muted)", border: "var(--border)" },
};

// ─── Status dot for month grid ────────────────────────────────────────────────

function StatusDot({
  status,
  onToggle,
}: {
  status: AttendanceStatus | undefined;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[status ?? "none"];
  return (
    <button
      onClick={onToggle}
      title={cfg.label}
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        cursor: "pointer",
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

// ─── Day view row ─────────────────────────────────────────────────────────────

function DayRow({
  student,
  date,
  attendance,
}: {
  student: Student & { id: string };
  date: string;
  attendance: Record<string, AttendanceStatus>;
}) {
  const current = (attendance[date] as AttendanceStatus | undefined) ?? "none";
  const [saving, setSaving] = useState<AttendanceStatus | null>(null);

  async function handle(status: AttendanceStatus) {
    // Bấm lại trạng thái đang chọn = bỏ tick (xoá bản ghi điểm danh)
    const next = current === status ? null : status;
    setSaving(status);
    await setAttendance(student.id, date, next);
    setSaving(null);
  }

  const cfg = STATUS_CONFIG[current];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: current !== "none" ? cfg.border : "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {student.name}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{student.id}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {(["present", "late", "absent"] as AttendanceStatus[]).map((status) => {
          const c = STATUS_CONFIG[status];
          const isActive = current === status;
          return (
            <button
              key={status}
              onClick={() => handle(status)}
              disabled={!!saving}
              title={isActive ? `${c.label} — bấm lại để bỏ tick` : c.label}
              aria-pressed={isActive}
              className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-lg font-medium transition-all border"
              style={{
                background: isActive ? c.bg : "transparent",
                color: isActive ? c.color : "var(--text-muted)",
                borderColor: isActive ? c.border : "var(--border)",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving === status ? "..." : c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month grid (O3) ─────────────────────────────────────────────────────────

function MonthGrid({
  students,
  days,
  attendance,
  onToggle,
}: {
  students: (Student & { id: string })[];
  days: string[];
  attendance: Record<string, Record<string, AttendanceStatus>>;
  onToggle: (code: string, date: string) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: ".72rem", minWidth: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: ".5rem .75rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                minWidth: 120,
                borderBottom: "1px solid var(--border)",
                position: "sticky",
                left: 0,
                background: "var(--bg-elevated)",
                zIndex: 2,
              }}
            >
              Học viên
            </th>
            {days.map((d) => {
              const day = d.slice(8);
              const dow = getDow(d);
              const isWeekend = dow === "CN" || dow === "T7";
              return (
                <th
                  key={d}
                  style={{
                    textAlign: "center",
                    padding: ".3rem .1rem",
                    color: isWeekend ? "var(--accent-primary)" : "var(--text-muted)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    minWidth: 30,
                  }}
                >
                  <div>{day}</div>
                  <div style={{ fontWeight: 400, fontSize: ".58rem" }}>{dow}</div>
                </th>
              );
            })}
            <th
              style={{
                textAlign: "center",
                padding: ".5rem .5rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                borderBottom: "1px solid var(--border)",
              }}
            >
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const sAtt = attendance[s.id] ?? {};
            const presentDays = days.filter((d) => sAtt[d] === "present").length;
            const markedDays = days.filter((d) => !!sAtt[d]).length;
            const pct = markedDays > 0 ? Math.round((presentDays / markedDays) * 100) : null;
            return (
              <tr key={s.id}>
                <td
                  style={{
                    padding: ".4rem .75rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    left: 0,
                    background: "var(--bg-elevated)",
                    zIndex: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name ?? s.id}
                </td>
                {days.map((d) => (
                  <td key={d} style={{ textAlign: "center", padding: ".3rem .1rem", borderBottom: "1px solid var(--border)" }}>
                    <StatusDot
                      status={sAtt[d] as AttendanceStatus | undefined}
                      onToggle={() => onToggle(s.id, d)}
                    />
                  </td>
                ))}
                <td style={{ textAlign: "center", padding: ".4rem .5rem", borderBottom: "1px solid var(--border)" }}>
                  {pct !== null ? (
                    <span
                      style={{
                        fontSize: ".68rem",
                        fontWeight: 700,
                        color:
                          pct >= 80
                            ? "rgb(5,150,105)"
                            : pct >= 60
                            ? "rgb(180,120,0)"
                            : "rgb(220,38,38)",
                      }}
                    >
                      {pct}%
                    </span>
                  ) : (
                    <span style={{ color: "var(--border)" }}>·</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Summary strip (O7) ───────────────────────────────────────────────────────

function SummaryStrip({
  students,
  date,
  attendance,
}: {
  students: (Student & { id: string })[];
  date: string;
  attendance: Record<string, Record<string, AttendanceStatus>>;
}) {
  const counts = useMemo(() => {
    let present = 0, absent = 0, late = 0, none = 0;
    for (const s of students) {
      const st = attendance[s.id]?.[date];
      if (st === "present") present++;
      else if (st === "absent") absent++;
      else if (st === "late") late++;
      else none++;
    }
    const total = students.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, late, none, total, pct };
  }, [students, date, attendance]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Có mặt", val: counts.present, color: "rgb(5,150,105)",  bg: "rgba(16,185,129,0.08)" },
          { label: "Vắng",   val: counts.absent,  color: "rgb(220,38,38)",  bg: "rgba(239,68,68,0.08)" },
          { label: "Muộn",   val: counts.late,    color: "rgb(180,120,0)",  bg: "rgba(245,158,11,0.08)" },
          { label: "Chưa điểm", val: counts.none, color: "var(--text-muted)", bg: "var(--border)" },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
            <div className="text-xl font-bold" style={{ color }}>{val}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
          </div>
        ))}
      </div>
      {counts.total > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Chuyên cần hôm nay</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${counts.pct}%`,
                background: counts.pct >= 80 ? "rgb(5,150,105)" : counts.pct >= 60 ? "rgb(180,120,0)" : "rgb(220,38,38)",
              }}
            />
          </div>
          <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{counts.pct}%</span>
        </div>
      )}
    </div>
  );
}

// ─── Quick mark panel (O6) ────────────────────────────────────────────────────

function QuickMarkPanel({
  students,
}: {
  students: (Student & { id: string })[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState("");
  const [markDate, setMarkDate] = useState(localToday());
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleMark() {
    if (!selectedCode) return;
    setSaving(true);
    await setAttendance(selectedCode, markDate, status);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>✏️ Điểm danh thủ công</span>
        <span style={{ color: "var(--text-muted)", fontSize: ".75rem" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                HỌC VIÊN
              </label>
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="">— Chọn học viên —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                NGÀY
              </label>
              <input
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              TRẠNG THÁI
            </label>
            <div className="flex gap-2">
              {(["present", "late", "absent"] as AttendanceStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium border"
                    style={{
                      background: status === s ? cfg.bg : "transparent",
                      color: status === s ? cfg.color : "var(--text-muted)",
                      borderColor: status === s ? cfg.border : "var(--border)",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={handleMark}
            disabled={!selectedCode || saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{
              background: saved ? "rgba(16,185,129,0.12)" : "var(--accent-primary)",
              color: saved ? "rgb(5,150,105)" : "#fff",
            }}
          >
            {saving ? "Đang lưu…" : saved ? "✓ Đã lưu" : "Lưu điểm danh"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { students, loading: studentsLoading } = useAllStudents();
  const { classes, loading: classesLoading } = useClasses();

  // Controls
  const [mode, setMode] = useState<"student" | "class">("student"); // O2
  const [viewMode, setViewMode] = useState<"day" | "month">("day"); // O3
  const [date, setDate] = useState(localToday);
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [search, setSearch] = useState(""); // O4
  const [sortBy, setSortBy] = useState<"name" | "rate_desc" | "rate_asc">("name"); // O4
  const [selectedClassId, setSelectedClassId] = useState(""); // O2

  // All active students
  const activeStudents = useMemo(
    () => students.filter((s) => !s.frozen) as (Student & { id: string })[],
    [students]
  );
  const allCodes = useMemo(() => activeStudents.map((s) => s.id), [activeStudents]);

  // Single attendance subscription for all students
  const { attendance, loading: attLoading } = useClassAttendance(allCodes);

  // Month days
  const monthDays = useMemo(
    () => getDaysInMonth(monthYear.year, monthYear.month),
    [monthYear]
  );

  // Filtered + sorted students
  const displayStudents = useMemo(() => {
    let list = activeStudents;

    // O2: class mode
    if (mode === "class" && selectedClassId) {
      const cls = classes.find((c) => c.id === selectedClassId);
      const members = cls?.members ?? [];
      list = list.filter((s) => members.includes(s.id));
    }

    // O4: search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      );
    }

    // O4: sort
    const days = viewMode === "month" ? monthDays : [date];
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return (a.name ?? a.id).localeCompare(b.name ?? b.id);
      const rate = (s: Student & { id: string }) => {
        const sAtt = attendance[s.id] ?? {};
        const marked = days.filter((d) => !!sAtt[d]).length;
        const present = days.filter((d) => sAtt[d] === "present").length;
        return marked > 0 ? present / marked : -1;
      };
      const diff = rate(a) - rate(b);
      return sortBy === "rate_desc" ? -diff : diff;
    });

    return list;
  }, [activeStudents, mode, selectedClassId, classes, search, sortBy, attendance, date, monthDays, viewMode]);

  // Month-grid toggle handler
  async function handleGridToggle(code: string, d: string) {
    const current = attendance[code]?.[d] as AttendanceStatus | undefined;
    const idx = ATT_CYCLE.indexOf(current ?? null);
    const next = ATT_CYCLE[(idx + 1) % ATT_CYCLE.length];
    await setAttendance(code, d, next);
  }

  function prevMonth() {
    setMonthYear(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    );
  }
  function nextMonth() {
    setMonthYear(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    );
  }

  const loading = studentsLoading || attLoading || classesLoading;

  return (
    <div className="space-y-5">
      {/* Header + mode/view toggles */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          ✅ Điểm danh
        </h1>

        {/* O2: Mode toggle */}
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {(["student", "class"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 text-xs font-medium"
              style={{
                background: mode === m ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: mode === m ? "#fff" : "var(--text-secondary)",
              }}
            >
              {m === "student" ? "Học viên" : "Lớp"}
            </button>
          ))}
        </div>

        {/* O3: View toggle */}
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {(["day", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className="px-3 py-1.5 text-xs font-medium"
              style={{
                background: viewMode === v ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: viewMode === v ? "#fff" : "var(--text-secondary)",
              }}
            >
              {v === "day" ? "Ngày" : "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-end gap-3 flex-wrap">
        {/* Date / Month picker */}
        {viewMode === "day" ? (
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Ngày</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="px-2.5 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-elevated)" }}
            >
              ◀
            </button>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", minWidth: 90, textAlign: "center" }}>
              T{String(monthYear.month).padStart(2, "0")}/{monthYear.year}
            </span>
            <button
              onClick={nextMonth}
              className="px-2.5 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-elevated)" }}
            >
              ▶
            </button>
          </div>
        )}

        {/* O2: Class selector */}
        {mode === "class" && (
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Lớp</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="">— Chọn lớp —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* O4: Search */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Tìm kiếm</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên / mã học viên…"
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* O4: Sort */}
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Sắp xếp</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            <option value="name">Tên A-Z</option>
            <option value="rate_desc">% cao nhất</option>
            <option value="rate_asc">% thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : displayStudents.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">✅</div>
          <p style={{ color: "var(--text-secondary)" }}>
            {mode === "class" && !selectedClassId
              ? "Chọn lớp để điểm danh."
              : search
              ? "Không tìm thấy học viên."
              : "Chưa có học viên nào."}
          </p>
        </div>
      ) : (
        <>
          {/* O7: Summary (day view) */}
          {viewMode === "day" && (
            <SummaryStrip
              students={displayStudents}
              date={date}
              attendance={attendance}
            />
          )}

          {/* O6: Quick manual mark */}
          <QuickMarkPanel students={displayStudents} />

          {/* Day view or Month view */}
          {viewMode === "day" ? (
            <div className="space-y-2">
              {displayStudents.map((s) => (
                <DayRow
                  key={s.id}
                  student={s}
                  date={date}
                  attendance={attendance[s.id] ?? {}}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <MonthGrid
                students={displayStudents}
                days={monthDays}
                attendance={attendance}
                onToggle={handleGridToggle}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
