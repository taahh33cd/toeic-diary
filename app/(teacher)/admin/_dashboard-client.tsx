"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useBookings } from "@/hooks/firebase/useBookings";
import { useClasses } from "@/hooks/firebase/useClasses";
import { useClassAttendance } from "@/hooks/firebase/useClassAttendance";
import { useAllSubmissions } from "@/hooks/firebase/useAllSubmissions";
import { useAllDayLinks } from "@/hooks/firebase/useAllDayLinks";
import { setAttendance, createStudent } from "@/lib/firebase/helpers";
import type { SchoolClass, AttendanceStatus, Student, Homework, HwItem, SubmissionsMap, DayLinksMap, Booking } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_VI: Record<string, string> = {
  Monday: "Thứ 2", Tuesday: "Thứ 3", Wednesday: "Thứ 4",
  Thursday: "Thứ 5", Friday: "Thứ 6", Saturday: "Thứ 7", Sunday: "CN",
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const COURSE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  group:       { label: "LỚP NHÓM",  bg: "#e4e0ef",   color: "#555460" },
  "per-session": { label: "1-1 BUỔI",  bg: "#dae2f8",   color: "#3f4758" },
  per_session: { label: "1-1 BUỔI",  bg: "#dae2f8",   color: "#3f4758" },
  package:     { label: "TRỌN GÓI",  bg: "#1a1c20",   color: "#f1eeff" },
};

// ─── BTVN helpers ────────────────────────────────────────────────────────────

const HW_SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcHwProgress(
  hw: Homework,
  submissions: SubmissionsMap,
  dayLinks: DayLinksMap
): { done: number; total: number } {
  let total = 0;
  for (const sec of HW_SECTIONS) total += (hw[sec] as HwItem[] | undefined)?.length ?? 0;
  if (total === 0) return { done: 0, total: 0 };
  let done = 0;
  for (const sec of HW_SECTIONS) {
    const items = hw[sec] as HwItem[] | undefined;
    if (!items) continue;
    for (let i = 0; i < items.length; i++) {
      const sub = submissions[`${hw.id}_${sec}_${i}`];
      if (sub?.ticked) done++;
    }
  }
  return { done, total };
}

// ─── YesterdayIncompleteCard ──────────────────────────────────────────────────

function YesterdayIncompleteCard({
  students,
  allSubmissions,
  allDayLinks,
  yesterday,
  loading,
}: {
  students: (Student & { id: string })[];
  allSubmissions: Record<string, SubmissionsMap>;
  allDayLinks: Record<string, DayLinksMap>;
  yesterday: string;
  loading: boolean;
}) {
  const incompleteEntries = useMemo(() => {
    const result: Array<{ student: Student & { id: string }; hw: Homework; done: number; total: number }> = [];
    for (const student of students) {
      if (student.frozen) continue;
      const hwRaw = student.homework;
      const hwList: Homework[] = Array.isArray(hwRaw) ? hwRaw : Object.values((hwRaw ?? {}) as Record<string, Homework>);
      for (const hw of hwList) {
        const deadline = hw.endDate ?? hw.date;
        if (deadline !== yesterday) continue;
        const subs = allSubmissions[student.id] ?? {};
        const dls = allDayLinks[student.id] ?? {};
        const { done, total } = calcHwProgress(hw, subs, dls);
        if (total === 0 || done === total) continue;
        result.push({ student, hw, done, total });
      }
    }
    return result;
  }, [students, allSubmissions, allDayLinks, yesterday]);

  if (loading) {
    return (
      <div className="silk-card rounded-2xl p-6 animate-pulse" style={{ minHeight: 80 }}>
        <div className="h-4 w-48 rounded" style={{ background: "rgba(0,0,0,0.07)" }} />
      </div>
    );
  }

  if (incompleteEntries.length === 0) {
    return (
      <div
        className="silk-card rounded-2xl p-7 text-center"
        style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.04)" }}
      >
        <p className="text-base">🎉</p>
        <p className="text-sm font-semibold mt-1" style={{ color: "rgb(22,163,74)" }}>
          Tất cả học viên đã hoàn thành nhiệm vụ hôm qua!
        </p>
      </div>
    );
  }

  return (
    <div className="silk-card rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(199,196,214,0.3)", background: "rgba(245,158,11,0.04)" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 15 }}>⚠️</span>
          <p className="text-sm font-semibold" style={{ color: "rgb(161,110,0)" }}>
            Chưa hoàn thành hôm qua
          </p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: "rgba(245,158,11,0.15)", color: "rgb(161,110,0)" }}
        >
          {incompleteEntries.length} HV
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: "rgba(199,196,214,0.2)" }}>
        {incompleteEntries.map(({ student, hw, done, total }) => {
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isPartial = done > 0;
          const barColor = isPartial ? "#f59e0b" : "#ef4444";

          return (
            <Link
              key={`${student.id}-${hw.id}`}
              href={`/admin/students/${student.id}`}
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[rgba(0,0,0,0.02)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {student.name}
                    </span>
                    <span
                      className="text-xs font-mono shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {student.id}
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold ml-3 shrink-0"
                    style={{
                      color: pct === 0 ? "#ef4444" : "rgb(161,110,0)",
                      fontFamily: "monospace",
                    }}
                  >
                    {done}/{total}
                  </span>
                </div>

                <div
                  style={{
                    height: 5,
                    background: "rgba(0,0,0,0.07)",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: barColor,
                      borderRadius: 99,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>

                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Deadline: {hw.endDate ?? hw.date} · {done}/{total} mục · Chưa nộp link
                </p>
              </div>

              <span
                className="material-symbols-outlined text-[18px] shrink-0"
                style={{ color: "var(--text-muted)", fontVariationSettings: "'wght' 300" }}
              >
                chevron_right
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── AttBadge ─────────────────────────────────────────────────────────────────

function AttBadge({ status }: { status: AttendanceStatus | undefined }) {
  const base = "w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors";
  if (!status) return (
    <span className={base} style={{ border: "1px solid #c7c4d6", color: "#777585" }}>–</span>
  );
  if (status === "present") return (
    <span className={base} style={{ background: "rgba(22,163,74,0.1)", color: "rgb(22,163,74)" }}>✓</span>
  );
  if (status === "absent") return (
    <span className={base} style={{ background: "rgba(186,26,26,0.1)", color: "#ba1a1a" }}>✗</span>
  );
  return (
    <span className={base} style={{ background: "rgba(202,138,4,0.1)", color: "rgb(161,110,0)" }}>~</span>
  );
}

// ─── Today's Class Panel ──────────────────────────────────────────────────────

function TodayClassPanel({
  cls,
  allStudents,
  date,
}: {
  cls: SchoolClass;
  allStudents: (Student & { id: string })[];
  date: string;
}) {
  const memberCodes = cls.members ?? [];
  const { attendance } = useClassAttendance(memberCodes);

  const members = useMemo(
    () => memberCodes.map((code) => allStudents.find((s) => s.id === code)).filter(Boolean) as (Student & { id: string })[],
    [memberCodes, allStudents]
  );

  const presentCount = members.filter((s) => attendance[s.id]?.[date] === "present").length;
  const ATT_CYCLE: (AttendanceStatus | null)[] = [null, "present", "absent", "late"];

  async function toggle(code: string) {
    const cur = attendance[code]?.[date] as AttendanceStatus | undefined;
    const idx = ATT_CYCLE.indexOf(cur ?? null);
    const next = ATT_CYCLE[(idx + 1) % ATT_CYCLE.length];
    await setAttendance(code, date, next);
  }

  const sessions = cls.weeklySchedule?.filter((s) => s.day === DAYS_EN[new Date().getDay()]) ?? [];

  return (
    <div className="silk-card rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "rgba(199,196,214,0.3)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{cls.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {sessions.map((s) => `${s.time}${s.room ? ` · ${s.room}` : ""}`).join(" / ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: "rgba(68,65,196,0.08)", color: "#4441c4" }}
          >
            {presentCount}/{members.length} có mặt
          </span>
          <Link href={`/admin/classes/${cls.id}`}
            className="text-xs font-medium transition-colors hover:text-[#4441c4]"
            style={{ color: "var(--text-muted)" }}>
            Chi tiết →
          </Link>
        </div>
      </div>
      {members.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Chưa có học viên</p>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(199,196,214,0.2)" }}>
          {members.map((student) => {
            const status = attendance[student.id]?.[date] as AttendanceStatus | undefined;
            return (
              <div key={student.id} className="flex items-center justify-between px-4 py-2">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {student.name ?? student.id}
                </p>
                <button onClick={() => toggle(student.id)} title="Click để đổi trạng thái">
                  <AttBadge status={status} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Today Timeline ───────────────────────────────────────────────────────────

/** Phút kể từ 00:00 của "19:00" hoặc "19:00–20:00"; giờ trống xếp cuối ngày. */
function startMinutes(time: string | undefined): number {
  const m = /(\d{1,2}):(\d{2})/.exec(time ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60 + 1;
}

type TodayEntry =
  | { key: string; time?: string; kind: "class"; cls: SchoolClass }
  | { key: string; time?: string; kind: "booking"; booking: Booking }
  | { key: string; time?: string; kind: "personal"; student: Student & { id: string }; title?: string };

const KIND_BADGE: Record<TodayEntry["kind"], { label: string; bg: string; color: string }> = {
  class:    { label: "LỚP",       bg: "rgba(68,65,196,0.10)",  color: "#4441c4" },
  booking:  { label: "HẸN 1-1",   bg: "rgba(22,163,74,0.10)",  color: "#16a34a" },
  personal: { label: "CỐ ĐỊNH",   bg: "rgba(86,94,113,0.10)",  color: "#565e71" },
};

function TodayTimeline({
  classes,
  bookings,
  students,
  date,
  todayDayName,
}: {
  classes: SchoolClass[];
  bookings: Booking[];
  students: (Student & { id: string })[];
  date: string;
  todayDayName: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const entries = useMemo<TodayEntry[]>(() => {
    const out: TodayEntry[] = [];

    // 1. Lớp học theo lịch tuần
    for (const cls of classes) {
      for (const ses of cls.weeklySchedule ?? []) {
        if (ses.day !== todayDayName) continue;
        out.push({ key: `cls_${cls.id}_${ses.time}`, time: ses.time, kind: "class", cls });
      }
    }

    // 2. Lịch hẹn hôm nay — bỏ lượt đã từ chối
    for (const b of bookings) {
      if (b.date !== date || b.status === "declined") continue;
      out.push({ key: `bk_${b.id}`, time: b.time, kind: "booking", booking: b });
    }

    // 3. Lịch 1-1 của từng HV. Giống trang HV: lịch cố định hàng tuần chỉ tính
    //    khi học viên không thuộc lớp nào, tránh đếm trùng buổi của lớp.
    for (const st of students) {
      if (st.frozen) continue;
      for (const item of st.schedule ?? []) {
        if (item.date !== date) continue;
        out.push({ key: `sch_${st.id}_${item.id ?? item.date}_${item.time ?? ""}`, time: item.time, kind: "personal", student: st, title: item.title });
      }
      const inClass = classes.some((c) => c.members?.includes(st.id));
      if (inClass) continue;
      for (const ses of st.weeklySchedule ?? []) {
        if (ses.day !== todayDayName) continue;
        out.push({ key: `wk_${st.id}_${ses.time}`, time: ses.time, kind: "personal", student: st });
      }
    }

    return out.sort((a, b) => startMinutes(a.time) - startMinutes(b.time));
  }, [classes, bookings, students, date, todayDayName]);

  if (entries.length === 0) {
    return (
      <div className="silk-card rounded-2xl p-7 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Hôm nay không có lớp hay lịch hẹn nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const badge = KIND_BADGE[e.kind];
        const isOpen = expanded === e.key;

        let title = "";
        let sub: React.ReactNode = null;
        let href: string | undefined;

        if (e.kind === "class") {
          title = e.cls.name;
          sub = <span>{e.cls.members?.length ?? 0} học viên</span>;
          href = `/admin/classes/${e.cls.id}`;
        } else if (e.kind === "booking") {
          title = e.booking.studentName;
          sub = (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={
                e.booking.status === "pending"
                  ? { background: "rgba(245,158,11,0.15)", color: "#b45309" }
                  : { background: "rgba(22,163,74,0.12)", color: "#15803d" }
              }
            >
              {e.booking.status === "pending" ? "CHỜ DUYỆT" : "ĐÃ DUYỆT"}
              {e.booking.note ? ` · ${e.booking.note}` : ""}
            </span>
          );
          href = "/admin/bookings";
        } else {
          title = e.student.name ?? e.student.id;
          sub = <span>{e.title ?? "Buổi 1-1"}</span>;
          href = `/admin/students/${e.student.id}`;
        }

        return (
          <div key={e.key} className="silk-card rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <span
                className="text-sm font-bold tabular-nums shrink-0"
                style={{ color: "var(--text-primary)", minWidth: 92 }}
              >
                {e.time ?? "—"}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0"
                style={{ background: badge.bg, color: badge.color, letterSpacing: ".04em" }}
              >
                {badge.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {title}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {sub}
                </p>
              </div>
              {e.kind === "class" && (
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : e.key)}
                  className="text-xs font-medium shrink-0 transition-colors hover:text-[#4441c4]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {isOpen ? "Đóng" : "Điểm danh"}
                </button>
              )}
              {href && (
                <Link
                  href={href}
                  className="text-xs font-medium shrink-0 transition-colors hover:text-[#4441c4]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Chi tiết →
                </Link>
              )}
            </div>
            {e.kind === "class" && isOpen && (
              <div className="px-2 pb-2">
                <TodayClassPanel cls={e.cls} allStudents={students} date={date} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Student Mini Card ────────────────────────────────────────────────────────

function StudentMiniCard({ student }: { student: Student & { id: string } }) {
  const latestScore = student.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const badge = student.courseType ? COURSE_BADGE[student.courseType] : null;

  return (
    <Link
      href={`/admin/students/${student.id}`}
      className="silk-card block p-4 rounded-xl hover:scale-[1.02] transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4
            className="text-[15px] font-medium truncate group-hover:text-[#4441c4] transition-colors"
            style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)" }}
          >
            {student.name ?? student.id}
          </h4>
          {badge && (
            <span
              className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded"
              style={{ background: badge.bg, color: badge.color, letterSpacing: "0.04em" }}
            >
              {badge.label}
            </span>
          )}
          {student.frozen && (
            <span
              className="inline-block mt-1.5 ml-1.5 px-2 py-0.5 text-[10px] font-bold rounded"
              style={{ background: "#dae2f8", color: "#3f4758", letterSpacing: "0.04em" }}
            >
              ĐÓNG BĂNG
            </span>
          )}
        </div>
        <span
          className="text-xl font-bold opacity-30 ml-2 shrink-0"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-admin-serif)" }}
        >
          {latestScore?.score ?? "—"}
        </span>
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Tuần {student.currentWeek ?? 0}
      </p>
    </Link>
  );
}

// ─── Today Completed Modal ────────────────────────────────────────────────────

function TodayCompletedModal({
  students,
  total,
  onClose,
}: {
  students: Array<{ student: Student & { id: string }; done: number; total: number }>;
  total: number;
  onClose: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(26,28,32,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className="silk-card"
        style={{ borderRadius: 20, width: "calc(100vw - 2rem)", maxWidth: 460, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(199,196,214,0.3)" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#1a1c20", margin: 0, fontFamily: "var(--font-admin-serif)" }}>
              ✅ Hoàn thành hôm nay
            </h2>
            <p style={{ fontSize: ".75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
              {students.length}/{total} học viên có bài tập
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#777585", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {students.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", fontSize: ".85rem", color: "var(--text-muted)" }}>
              Chưa có học viên nào hoàn thành hôm nay.
            </p>
          ) : (
            <div>
              {students.map(({ student, done, total: t }) => (
                <Link
                  key={student.id}
                  href={`/admin/students/${student.id}`}
                  onClick={onClose}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(199,196,214,0.2)", textDecoration: "none" }}
                  className="hover:bg-[rgba(0,0,0,0.02)] transition-colors"
                >
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>✅</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: ".88rem", fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {student.name}
                    </p>
                    <p style={{ fontSize: ".72rem", color: "var(--text-muted)", margin: "2px 0 0", fontFamily: "monospace" }}>
                      {student.id}
                    </p>
                  </div>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: "rgb(22,163,74)", fontFamily: "monospace", flexShrink: 0 }}>
                    {done}/{t}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)", fontVariationSettings: "'wght' 300", flexShrink: 0 }}>
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Student Modal ────────────────────────────────────────────────────────

function AddStudentModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [week, setWeek] = useState(1);
  const [courseType, setCourseType] = useState<Student["courseType"]>("per-session");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { setErr("Vui lòng điền đầy đủ tên và mã học viên."); return; }
    setSaving(true);
    setErr("");
    try {
      await createStudent(code.trim(), {
        name: name.trim(),
        currentWeek: week,
        courseType,
        pricePerSession: price ? Number(price) : undefined,
      });
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: ".5rem .75rem",
    border: "1px solid #c7c4d6",
    borderRadius: 8,
    fontSize: ".85rem",
    background: "#f9f9ff",
    color: "#1a1c20",
    fontFamily: "var(--font-admin-sans)",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.04)",
    outline: "none",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(26,28,32,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        className="silk-card"
        style={{ borderRadius: 20, padding: "1.75rem", width: "calc(100vw - 2rem)", maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1a1c20", margin: 0, fontFamily: "var(--font-admin-serif)" }}>
            Thêm học viên mới
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "#777585", lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
            <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#464554", letterSpacing: "0.04em" }}>HỌ TÊN *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
            <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#464554", letterSpacing: "0.04em" }}>MÃ HỌC VIÊN *</span>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))} placeholder="hv001" style={{ ...inputStyle, fontFamily: "monospace" }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
              <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#464554", letterSpacing: "0.04em" }}>TUẦN</span>
              <input type="number" min={1} value={week} onChange={(e) => setWeek(Number(e.target.value))} style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
              <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#464554", letterSpacing: "0.04em" }}>GIÁ / BUỔI (đ)</span>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" style={inputStyle} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
            <span style={{ fontSize: ".75rem", fontWeight: 600, color: "#464554", letterSpacing: "0.04em" }}>LOẠI KHOÁ HỌC</span>
            <select value={courseType} onChange={(e) => setCourseType(e.target.value as Student["courseType"])} style={inputStyle}>
              <option value="per-session">1-1 buổi lẻ</option>
              <option value="group">Lớp nhóm</option>
              <option value="package">Trọn gói</option>
            </select>
          </label>
          {err && <p style={{ fontSize: ".78rem", color: "#ba1a1a", margin: 0 }}>{err}</p>}
          <button
            type="submit"
            disabled={saving}
            className="silk-button"
            style={{ padding: ".65rem 1rem", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: ".85rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, letterSpacing: "0.04em" }}
          >
            {saving ? "Đang lưu…" : "THÊM HỌC VIÊN"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardClient() {
  const { students, loading: studentsLoading } = useAllStudents();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { classes, loading: classesLoading } = useClasses();
  const { allSubmissions, loading: subsLoading } = useAllSubmissions();
  const { allDayLinks, loading: dlLoading } = useAllDayLinks();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);

  const todayDayName = DAYS_EN[new Date().getDay()];
  const date = todayStr();
  const yesterday = yesterdayStr();

  const activeStudents = students.filter((s) => !s.frozen);
  const frozenCount = students.filter((s) => s.frozen).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const allScores = students.flatMap((s) => s.scores ?? []);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length)
    : null;

  const bestEntry = students.reduce<{ name: string; score: number } | null>((best, s) => {
    if (!s.scores?.length) return best;
    const top = Math.max(...s.scores.map((x) => x.score));
    if (!best || top > best.score) return { name: s.name, score: top };
    return best;
  }, null);

  const sortedActive = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? activeStudents.filter((s) =>
          s.name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
        )
      : activeStudents;
    return [...filtered].sort((a, b) => (b.currentWeek ?? 0) - (a.currentWeek ?? 0));
  }, [activeStudents, search]);

  // "Hoàn thành hôm nay": students with active BTVN today who ticked all items
  const { todayHwTotal, todayHwDone, todayHwCompletedStudents } = useMemo(() => {
    let total = 0;
    let done = 0;
    const completedStudents: Array<{ student: Student & { id: string }; done: number; total: number }> = [];
    for (const student of activeStudents) {
      const hwRaw = student.homework;
      const hwList: Homework[] = Array.isArray(hwRaw) ? hwRaw : Object.values((hwRaw ?? {}) as Record<string, Homework>);
      const activeHw = hwList.find(
        (hw) => hw.date <= date && (hw.endDate ?? hw.date) >= date
      );
      if (!activeHw) continue;
      total++;
      const subs = allSubmissions[student.id] ?? {};
      const dls = allDayLinks[student.id] ?? {};
      const { done: d, total: t } = calcHwProgress(activeHw, subs, dls);
      if (t > 0 && d === t) {
        done++;
        completedStudents.push({ student: student as Student & { id: string }, done: d, total: t });
      }
    }
    return { todayHwTotal: total, todayHwDone: done, todayHwCompletedStudents: completedStudents };
  }, [activeStudents, allSubmissions, allDayLinks, date]);

  const loading = studentsLoading || bookingsLoading || classesLoading;

  return (
    <div className="space-y-5" style={{ fontFamily: "var(--font-admin-sans)" }}>

      {/* Page title */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          Dashboard
        </h1>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {[
          { icon: "group",          value: loading ? "…" : activeStudents.length,                                                            label: "Đang học",            num: "01", href: "/admin/students"  as string | undefined, onClick: undefined as (() => void) | undefined, color: "#4441c4" },
          { icon: "school",         value: loading ? "…" : classes.length,                                                                  label: "Lớp học",             num: "02", href: "/admin/classes"   as string | undefined, onClick: undefined as (() => void) | undefined, color: "#565e71" },
          { icon: "event_available",value: loading ? "…" : (pendingCount || "0"),                                                           label: "Lịch chờ duyệt",      num: "03", href: "/admin/bookings"  as string | undefined, onClick: undefined as (() => void) | undefined, color: "#555460" },
          { icon: "track_changes",  value: loading ? "…" : (avgScore ?? "—"),                                                               label: "Điểm TB",             num: "04", href: "/admin/progress"  as string | undefined, onClick: undefined as (() => void) | undefined, color: "#ba1a1a" },
          { icon: "task_alt",       value: dlLoading ? "…" : (todayHwTotal > 0 ? `${todayHwDone}/${todayHwTotal}` : "—"),                  label: "Hoàn thành hôm nay",  num: "05", href: undefined,                                onClick: () => setShowTodayModal(true),           color: "#16a34a" },
        ].map((item) => {
          const cardInner = (
            <div className="silk-card p-4 rounded-xl flex flex-col justify-between h-[108px] hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start">
                <span
                  className="material-symbols-outlined text-[18px] p-1.5 rounded-lg"
                  style={{ color: item.color, background: `${item.color}10`, fontVariationSettings: "'wght' 300" }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold opacity-30" style={{ color: "var(--text-primary)" }}>{item.num}</span>
              </div>
              <div>
                <h3
                  className="text-3xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)" }}
                >
                  {item.value}
                </h3>
                <p className="text-[11px] mt-1 font-semibold tracking-wider opacity-60" style={{ color: "var(--text-secondary)" }}>
                  {item.label}
                </p>
              </div>
            </div>
          );
          return item.href ? (
            <Link key={item.num} href={item.href} className="block">{cardInner}</Link>
          ) : (
            <button key={item.num} type="button" onClick={item.onClick} className="block w-full text-left">{cardInner}</button>
          );
        })}
      </div>

      {/* ── Today's timeline: lớp học + lịch hẹn + buổi 1-1 cố định ── */}
      {!loading && (
        <div className="space-y-3">
          <h2
            className="flex items-center gap-1.5 text-base font-semibold"
            style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)" }}
          >
            <span className="material-symbols-outlined text-[17px]" style={{ color: "var(--text-muted)", fontVariationSettings: "'wght' 300" }}>
              today
            </span>
            Lịch hôm nay
            <span className="text-xs font-normal opacity-50">· {DAYS_VI[todayDayName]} {date}</span>
          </h2>
          <TodayTimeline
            classes={classes}
            bookings={bookings}
            students={students as (Student & { id: string })[]}
            date={date}
            todayDayName={todayDayName}
          />
        </div>
      )}

      {/* ── Yesterday incomplete ── */}
      <div className="space-y-3">
        <h2
          className="flex items-center gap-1.5 text-base font-semibold"
          style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)" }}
        >
          <span
            className="material-symbols-outlined text-[17px]"
            style={{ color: "var(--text-muted)", fontVariationSettings: "'wght' 300" }}
          >
            assignment_late
          </span>
          Bài tập hôm qua
          <span className="text-xs font-normal opacity-50">· {yesterday}</span>
        </h2>
        <YesterdayIncompleteCard
          students={activeStudents as (Student & { id: string })[]}
          allSubmissions={allSubmissions}
          allDayLinks={allDayLinks}
          yesterday={yesterday}
          loading={subsLoading || dlLoading}
        />
      </div>

      {/* ── Student cards grid ── */}
      {!loading && (
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2
              className="flex items-center gap-1.5 text-base font-semibold"
              style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)" }}
            >
              <span className="material-symbols-outlined text-[17px]" style={{ color: "var(--text-muted)", fontVariationSettings: "'wght' 300" }}>
                person_search
              </span>
              Học viên đang học
              <span className="text-xs font-normal opacity-40">({activeStudents.length})</span>
            </h2>

            <div className="flex items-center gap-2 flex-1 md:max-w-sm">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tên / mã..."
                  className="silk-inset"
                  style={{
                    width: "100%",
                    padding: ".6rem 1rem .6rem 2.5rem",
                    border: "none",
                    borderRadius: 12,
                    fontSize: ".85rem",
                    background: "#ffffff",
                    color: "#1a1c20",
                    fontFamily: "var(--font-admin-sans)",
                    outline: "none",
                  }}
                />
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
                  style={{ color: "#777585", fontVariationSettings: "'wght' 300" }}
                >
                  search
                </span>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="silk-button flex items-center gap-1.5 px-4 py-2.5 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all"
                style={{ fontSize: ".82rem", fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Thêm
              </button>
            </div>
          </div>

          {sortedActive.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {sortedActive.slice(0, 12).map((student) => (
                  <StudentMiniCard
                    key={student.id}
                    student={student as Student & { id: string }}
                  />
                ))}
              </div>
              {sortedActive.length > 12 && (
                <div className="text-center pt-2">
                  <Link
                    href="/admin/students"
                    className="text-sm font-semibold transition-colors hover:underline decoration-2 underline-offset-4"
                    style={{ color: "#4441c4" }}
                  >
                    Xem tất cả học viên →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
              {search ? "Không tìm thấy học viên." : "Chưa có học viên nào."}
            </p>
          )}
        </div>
      )}

      {addOpen && <AddStudentModal onClose={() => setAddOpen(false)} />}
      {showTodayModal && (
        <TodayCompletedModal
          students={todayHwCompletedStudents}
          total={todayHwTotal}
          onClose={() => setShowTodayModal(false)}
        />
      )}

      {/* ── Quick access ── */}
      <div className="space-y-3">
        <h2
          className="flex items-center gap-1.5 text-base font-semibold"
          style={{ fontFamily: "var(--font-admin-serif)", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined text-[17px]" style={{ color: "var(--text-muted)", fontVariationSettings: "'wght' 300" }}>bolt</span>
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { href: "/admin/classes",    icon: "groups",         label: "Lớp học",      bg: "rgba(86,94,113,0.08)", iconColor: "#565e71", filled: true },
            { href: "/admin/homework",   icon: "assignment_add", label: "Giao bài tập", bg: "rgba(68,65,196,0.05)",  iconColor: "#4441c4" },
            { href: "/admin/scores",     icon: "track_changes",  label: "Nhập điểm",    bg: "rgba(86,94,113,0.08)", iconColor: "#565e71", filled: true },
            { href: "/admin/slots",      icon: "alarm_add",      label: "Tạo khung giờ",bg: "rgba(85,84,96,0.08)",  iconColor: "#555460" },
            { href: "/admin/attendance", icon: "check_box",      label: "Điểm danh",    bg: "rgba(22,163,74,0.06)", iconColor: "rgb(22,163,74)", filled: true },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div className="silk-card p-5 rounded-xl flex flex-col items-center justify-center gap-2.5 hover:bg-[#f3f3fa] transition-all cursor-pointer">
                <div className="p-3 rounded-xl" style={{ background: item.bg }}>
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ color: item.iconColor, fontVariationSettings: item.filled ? "'FILL' 1, 'wght' 300" : "'wght' 300" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-primary)" }}>
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Pending bookings ── */}
      {pendingCount > 0 && (
        <div
          className="rounded-2xl p-5 border"
          style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.25)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "rgb(161,110,0)" }}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              {pendingCount} lịch hẹn cần xử lý
            </p>
            <Link href="/admin/bookings" className="text-xs font-semibold hover:underline" style={{ color: "#4441c4" }}>
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {bookings.filter((b) => b.status === "pending").slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
                <span>{b.studentName}</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {new Date(b.date).toLocaleDateString("vi-VN")} · {b.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
