"use client";

import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useClasses } from "@/hooks/firebase/useClasses";
import { useAttendance } from "@/hooks/firebase/useAttendance";
import type { AttendanceStatus } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DOW_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getDow(dateStr: string, full = false): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const idx = new Date(y, m - 1, d).getDay();
  return full ? DOW_FULL[idx] : DOW_VI[idx];
}

// Get all dates in a given month (YYYY-MM)
function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  return days;
}

// J8: Generate session dates for a month from both sources
function getSessionDates(
  year: number,
  month: number,
  personalSchedule: { date: string; time?: string }[],
  classWeeklySlots: { day: string; time: string; className: string }[],
  studentCode: string | null | undefined,
  todayStr: string
): { date: string; time?: string; source: "personal" | "class"; className?: string }[] {
  const monthStr = `${year}-${String(month).padStart(2,"0")}`;
  const results: { date: string; time?: string; source: "personal" | "class"; className?: string }[] = [];
  const seen = new Set<string>();

  // Personal schedule
  for (const s of personalSchedule) {
    if (s.date.startsWith(monthStr)) {
      const key = s.date;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ date: s.date, time: s.time, source: "personal" });
      }
    }
  }

  // Class weeklySchedule — generate all occurrences in the month, up to today
  const allDays = getDaysInMonth(year, month);
  for (const slot of classWeeklySlots) {
    const dayNum = parseInt(slot.day, 10);
    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) continue;
    for (const dateStr of allDays) {
      if (dateStr > todayStr) continue; // only up to today per spec
      const [dy, dm, dd] = dateStr.split("-").map(Number);
      if (new Date(dy, dm - 1, dd).getDay() !== dayNum) continue;
      const key = `${dateStr}_${slot.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ date: dateStr, time: slot.time, source: "class", className: slot.className });
      }
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── J6/J7: Receipt Modal ─────────────────────────────────────────────────────

function ReceiptModal({
  studentName,
  monthLabel,
  totalSessions,
  presentSessions,
  pricePerSession,
  totalFee,
  onClose,
}: {
  studentName: string;
  monthLabel: string;
  totalSessions: number;
  presentSessions: number;
  pricePerSession: number;
  totalFee: number;
  onClose: () => void;
}) {
  const [zoomQR, setZoomQR] = useState(false); // J7

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(44,30,15,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflowY: "auto",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FBF7F2",
          width: "calc(100vw - 2rem)",
          maxWidth: 420,
          boxShadow: "0 12px 40px rgba(44,30,15,.2)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: ".75rem 1rem",
            borderBottom: "1px solid #DDD0BC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#3D2B1F",
          }}
        >
          <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#fff" }}>📄 Biên lai tháng</span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid rgba(255,255,255,.3)",
              color: "rgba(255,255,255,.8)",
              width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: ".85rem", cursor: "pointer",
            }}
            aria-label="Đóng"
          >×</button>
        </div>

        {/* Receipt body */}
        <div style={{ padding: "1.25rem 1.25rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2C1E0F" }}>{studentName}</div>
            <div style={{ fontSize: ".75rem", color: "#9A8672" }}>Tháng {monthLabel}</div>
          </div>

          {/* Detail rows */}
          {[
            { label: "Tổng buổi trong tháng", value: String(totalSessions) },
            { label: "Buổi có mặt", value: String(presentSessions), highlight: true },
            { label: "Đơn giá / buổi", value: fmtMoney(pricePerSession) },
          ].map(row => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: ".5rem 0",
                borderBottom: "1px dashed #DDD0BC",
              }}
            >
              <span style={{ fontSize: ".8rem", color: "#9A8672" }}>{row.label}</span>
              <span style={{ fontSize: ".85rem", fontWeight: row.highlight ? 700 : 500, color: "#2C1E0F" }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: ".75rem 0 0",
              marginTop: ".25rem",
            }}
          >
            <span style={{ fontSize: ".9rem", fontWeight: 700, color: "#2C1E0F" }}>TỔNG THÁNG NÀY</span>
            <span
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#C4622D",
              }}
            >
              {fmtMoney(totalFee)}
            </span>
          </div>
        </div>

        {/* QR placeholder section (J7: tap to zoom) */}
        <div
          style={{
            margin: "0 1.25rem 1.25rem",
            border: "1px dashed #DDD0BC",
            padding: "1rem",
            textAlign: "center",
            cursor: "pointer",
            background: "rgba(0,0,0,0.02)",
          }}
          onClick={() => setZoomQR(true)}
          title="Tap để zoom QR"
        >
          <div style={{ fontSize: "2rem", marginBottom: ".35rem" }}>📱</div>
          <div style={{ fontSize: ".72rem", color: "#9A8672" }}>
            QR chuyển khoản<br />
            <span style={{ fontSize: ".65rem" }}>Giáo viên sẽ cung cấp QR code</span>
          </div>
        </div>

        {/* Bank info */}
        <div
          style={{
            padding: ".75rem 1.25rem 1.25rem",
            borderTop: "1px solid #DDD0BC",
            fontSize: ".72rem",
            color: "#9A8672",
            textAlign: "center",
          }}
        >
          Nội dung CK: <strong style={{ color: "#2C1E0F" }}>Học phí {monthLabel}</strong>
        </div>
      </div>

      {/* J7: Zoom QR overlay */}
      {zoomQR && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setZoomQR(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              width: "80vw",
              maxWidth: 300,
              textAlign: "center",
              fontSize: ".85rem",
              color: "#9A8672",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>📱</div>
            <p>QR code sẽ được hiển thị tại đây<br />khi giáo viên cấu hình.</p>
            <button
              onClick={() => setZoomQR(false)}
              style={{
                marginTop: "1rem",
                background: "#2C1E0F",
                color: "#fff",
                border: "none",
                padding: ".5rem 1.5rem",
                cursor: "pointer",
                fontSize: ".8rem",
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session Row (per_session / group) ───────────────────────────────────────

function SessionRowFee({
  date,
  time,
  status,
  pricePerSession,
  className,
}: {
  date: string;
  time?: string;
  status: AttendanceStatus | undefined;
  pricePerSession: number;
  className?: string;
}) {
  const isPresent = status === "present";
  const isAbsent = status === "absent";
  const isUnknown = !status;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".75rem",
        padding: ".6rem .85rem",
        background: isPresent ? "rgba(74,124,89,.04)" : "var(--bg-elevated,#FBF7F2)",
        borderBottom: "1px solid var(--border,#DDD0BC)",
        opacity: isAbsent ? 0.75 : 1,
      }}
    >
      {/* Day/date */}
      <div style={{ flexShrink: 0, minWidth: 70 }}>
        <div style={{ fontSize: ".75rem", fontWeight: 600, color: "#2C1E0F" }}>
          {getDow(date, true)}
        </div>
        <div style={{ fontSize: ".65rem", color: "#9A8672" }}>
          {fmtDate(date)}{time ? ` · ${time}` : ""}
        </div>
      </div>

      {/* Class name */}
      {className && (
        <div style={{ flex: 1, fontSize: ".7rem", color: "#9A8672", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {className}
        </div>
      )}
      {!className && <div style={{ flex: 1 }} />}

      {/* Status badge */}
      <span
        style={{
          fontSize: ".62rem",
          fontWeight: 600,
          padding: ".15rem .5rem",
          borderRadius: 99,
          background: isPresent
            ? "rgba(74,124,89,.12)"
            : isAbsent
            ? "rgba(176,58,42,.1)"
            : "rgba(0,0,0,0.06)",
          color: isPresent ? "#4A7C59" : isAbsent ? "#B03A2A" : "#9A8672",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {isPresent ? "✓ Có mặt" : isAbsent ? "✗ Vắng" : "— Chưa điểm"}
      </span>

      {/* J3: Amount (strikethrough if absent) */}
      <div
        style={{
          flexShrink: 0,
          fontSize: ".8rem",
          fontWeight: 600,
          color: isPresent ? "#C4622D" : "#9A8672",
          textDecoration: isAbsent ? "line-through" : "none",
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: 72,
          textAlign: "right",
        }}
      >
        {fmtMoney(pricePerSession)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeePage() {
  const { profile } = useProfile();
  const { student, loading: stuLoading } = useStudent(profile?.studentCode);
  const { classes, loading: clsLoading } = useClasses();
  const { attendance, loading: attLoading } = useAttendance(profile?.studentCode);

  const today = localToday();
  const todayDate = new Date();

  // J1: Month navigation state
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth() + 1); // 1-based
  const [showReceipt, setShowReceipt] = useState(false);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const loading = stuLoading || clsLoading || attLoading;

  const courseType = student?.courseType ?? "per-session";
  const isPackage = courseType === "package";
  const pricePerSession = student?.pricePerSession ?? 0;

  // Classes where student is a member
  const myClasses = useMemo(() => {
    if (!profile?.studentCode) return [];
    return classes.filter(cls => cls.members?.includes(profile.studentCode!));
  }, [classes, profile?.studentCode]);

  // J8: Session dates for the month
  const classWeeklySlots = useMemo(() => {
    const slots: { day: string; time: string; className: string }[] = [];
    for (const cls of myClasses) {
      for (const slot of cls.weeklySchedule ?? []) {
        slots.push({ day: slot.day, time: slot.time, className: cls.name });
      }
    }
    return slots;
  }, [myClasses]);

  const sessionDates = useMemo(() => {
    if (!student) return [];
    return getSessionDates(
      year, month,
      student.schedule ?? [],
      classWeeklySlots,
      profile?.studentCode,
      today
    );
  }, [student, year, month, classWeeklySlots, profile?.studentCode, today]);

  // J4: Summary stats
  const summary = useMemo(() => {
    let present = 0, absent = 0, unknown = 0;
    for (const s of sessionDates) {
      const st = attendance[s.date] as AttendanceStatus | undefined;
      if (st === "present") present++;
      else if (st === "absent") absent++;
      else unknown++;
    }
    const total = sessionDates.length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    const totalFee = present * pricePerSession;
    return { total, present, absent, unknown, pct, totalFee };
  }, [sessionDates, attendance, pricePerSession]);

  const monthLabel = `${String(month).padStart(2,"0")}/${year}`;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Page title */}
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary,#2C1E0F)", margin: 0 }}>
          💰 Học phí
        </h1>
        <p style={{ fontSize: ".78rem", color: "#9A8672", margin: ".2rem 0 0" }}>
          {isPackage ? "Khoá học trọn gói" : `${fmtMoney(pricePerSession)}/buổi`}
        </p>
      </div>

      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem" }}>Đang tải…</div>
      )}

      {!loading && isPackage && (
        /* J5: Package mode */
        <div
          style={{
            background: "var(--bg-elevated,#FBF7F2)",
            border: "1px solid var(--border,#DDD0BC)",
            padding: "1.5rem",
          }}
        >
          <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".75rem" }}>
            Khoá học trọn gói
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
            {[
              { label: "Tổng học phí", value: student?.totalFee ? fmtMoney(student.totalFee) : "—" },
              { label: "Đã thanh toán", value: student?.paidAmount ? fmtMoney(student.paidAmount) : "—" },
              { label: "Còn lại", value: (student?.totalFee && student?.paidAmount) ? fmtMoney(student.totalFee - student.paidAmount) : "—" },
              { label: "Loại khoá", value: "Trọn gói" },
            ].map(item => (
              <div key={item.label} style={{ padding: ".65rem .85rem", background: "var(--bg-primary,#F5EFE6)", border: "1px solid var(--border,#DDD0BC)" }}>
                <div style={{ fontSize: ".62rem", color: "#9A8672", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#C4622D", marginTop: ".15rem" }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* J6 button */}
          <button
            onClick={() => setShowReceipt(true)}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: ".65rem",
              background: "#2C1E0F",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: ".82rem",
              cursor: "pointer",
            }}
          >
            📄 Xem biên lai
          </button>
        </div>
      )}

      {!loading && !isPackage && (
        <>
          {/* J1: Month navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: ".6rem .85rem",
              background: "var(--bg-elevated,#FBF7F2)",
              border: "1px solid var(--border,#DDD0BC)",
              marginBottom: ".75rem",
            }}
          >
            <button
              onClick={prevMonth}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: ".2rem .5rem", color: "#2C1E0F" }}
              aria-label="Tháng trước"
            >◀</button>
            <span style={{ fontWeight: 700, fontSize: ".9rem", color: "#2C1E0F" }}>
              Tháng {month}/{year}
            </span>
            <button
              onClick={nextMonth}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: ".2rem .5rem", color: "#2C1E0F" }}
              aria-label="Tháng sau"
            >▶</button>
          </div>

          {/* J4: Summary */}
          {sessionDates.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                border: "1px solid var(--border,#DDD0BC)",
                marginBottom: ".75rem",
                background: "var(--bg-elevated,#FBF7F2)",
              }}
            >
              {[
                { label: "Tổng buổi", value: String(summary.total), color: "#2C1E0F" },
                { label: "Có mặt", value: String(summary.present), color: "#4A7C59" },
                { label: "Vắng", value: String(summary.absent), color: summary.absent > 0 ? "#B03A2A" : "#9A8672" },
                { label: "Chuyên cần", value: `${summary.pct}%`, color: "#C4622D" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: ".65rem .5rem",
                    textAlign: "center",
                    borderRight: i < 3 ? "1px solid var(--border,#DDD0BC)" : undefined,
                  }}
                >
                  <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: ".58rem", color: "#9A8672", marginTop: ".15rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#9A8672",
                fontSize: ".82rem",
                border: "1px solid var(--border,#DDD0BC)",
                background: "var(--bg-elevated,#FBF7F2)",
                marginBottom: ".75rem",
              }}
            >
              Không có buổi học nào trong tháng {month}/{year}.
            </div>
          )}

          {/* Total + Receipt button */}
          {sessionDates.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: ".7rem .85rem",
                background: "var(--bg-elevated,#FBF7F2)",
                border: "1px solid var(--border,#DDD0BC)",
                marginBottom: ".75rem",
              }}
            >
              <div>
                <div style={{ fontSize: ".65rem", color: "#9A8672", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Tổng tháng này
                </div>
                <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.25rem", fontWeight: 700, color: "#C4622D" }}>
                  {fmtMoney(summary.totalFee)}
                </div>
              </div>
              {/* J6: Receipt button */}
              <button
                onClick={() => setShowReceipt(true)}
                style={{
                  padding: ".5rem 1rem",
                  background: "#2C1E0F",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: ".78rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                📄 Biên lai
              </button>
            </div>
          )}

          {/* J2: Session list */}
          {sessionDates.length > 0 && (
            <div style={{ border: "1px solid var(--border,#DDD0BC)", overflow: "hidden" }}>
              <div style={{ padding: ".5rem .85rem", background: "#2C1E0F", fontSize: ".65rem", fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                Chi tiết từng buổi
              </div>
              {sessionDates.map((s) => (
                <SessionRowFee
                  key={`${s.date}_${s.time ?? ""}`}
                  date={s.date}
                  time={s.time}
                  status={attendance[s.date] as AttendanceStatus | undefined}
                  pricePerSession={pricePerSession}
                  className={s.className}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* J6: Receipt modal */}
      {showReceipt && (
        <ReceiptModal
          studentName={student?.name ?? "Học viên"}
          monthLabel={monthLabel}
          totalSessions={summary.total}
          presentSessions={summary.present}
          pricePerSession={pricePerSession}
          totalFee={isPackage ? (student?.totalFee ?? 0) : summary.totalFee}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
