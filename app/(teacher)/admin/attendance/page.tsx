"use client";

import { useState } from "react";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useAttendance } from "@/hooks/firebase/useAttendance";
import { setAttendance } from "@/lib/firebase/helpers";
import type { AttendanceStatus } from "@/lib/firebase/types";

const STATUS_CONFIG: Record<
  AttendanceStatus | "none",
  { label: string; bg: string; color: string; border: string }
> = {
  present: { label: "Có mặt", bg: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)",  border: "rgba(16,185,129,0.3)" },
  absent:  { label: "Vắng",   bg: "rgba(239,68,68,0.10)",  color: "rgb(220,38,38)",  border: "rgba(239,68,68,0.3)" },
  late:    { label: "Muộn",   bg: "rgba(245,158,11,0.12)", color: "rgb(180,120,0)",  border: "rgba(245,158,11,0.3)" },
  none:    { label: "—",      bg: "var(--border)",         color: "var(--text-muted)", border: "var(--border)" },
};

function StudentAttendanceRow({
  code,
  name,
  date,
}: {
  code: string;
  name: string;
  date: string;
}) {
  const { attendance } = useAttendance(code);
  const current = (attendance?.[date] as AttendanceStatus | undefined) ?? "none";
  const [loading, setLoading] = useState<AttendanceStatus | null>(null);

  async function handle(status: AttendanceStatus) {
    setLoading(status);
    await setAttendance(code, date, status);
    setLoading(null);
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
          {name}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{code}</p>
      </div>

      <div className="flex gap-1.5 shrink-0">
        {(["present", "late", "absent"] as AttendanceStatus[]).map((status) => {
          const c = STATUS_CONFIG[status];
          const isActive = current === status;
          return (
            <button
              key={status}
              onClick={() => handle(status)}
              disabled={!!loading}
              className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-lg font-medium transition-all border"
              style={{
                background: isActive ? c.bg : "transparent",
                color: isActive ? c.color : "var(--text-muted)",
                borderColor: isActive ? c.border : "var(--border)",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading === status ? "..." : c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { students, loading } = useAllStudents();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const activeStudents = students.filter((s) => !s.frozen);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          ✅ Điểm danh
        </h1>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border outline-none"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : activeStudents.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">✅</div>
          <p style={{ color: "var(--text-secondary)" }}>Chưa có học viên.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeStudents.map((s) => (
            <StudentAttendanceRow key={s.id} code={s.id} name={s.name} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}
