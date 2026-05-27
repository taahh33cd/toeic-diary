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
  return n.toLocaleString("vi-VN") + " đ";
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function getDow(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DOW_VI[new Date(y, m - 1, d).getDay()];
}

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
  }
  return days;
}

function getSessionDates(
  year: number,
  month: number,
  personalSchedule: { date: string; time?: string }[],
  classWeeklySlots: { day: string; time: string; className: string }[],
  todayStr: string
): { date: string; time?: string; source: "personal" | "class"; className?: string }[] {
  const monthStr = `${year}-${String(month).padStart(2,"0")}`;
  const results: { date: string; time?: string; source: "personal" | "class"; className?: string }[] = [];
  const seen = new Set<string>();

  for (const s of personalSchedule) {
    if (s.date.startsWith(monthStr)) {
      const key = s.date;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ date: s.date, time: s.time, source: "personal" });
      }
    }
  }

  const allDays = getDaysInMonth(year, month);
  for (const slot of classWeeklySlots) {
    const dayNum = parseInt(slot.day, 10);
    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) continue;
    for (const dateStr of allDays) {
      if (dateStr > todayStr) continue;
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

function courseTypeLabel(ct: string | undefined): string {
  if (ct === "group") return "🏠 Lớp nhóm";
  if (ct === "package") return "📦 Trọn gói";
  return "📚 Theo buổi";
}

// ─── QR Lightbox ─────────────────────────────────────────────────────────────

function QRLightbox({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", padding: "1.5rem", borderRadius: 8, maxWidth: 320, width: "90vw", textAlign: "center" }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src="/qr-payment.png"
          alt="QR chuyển khoản"
          style={{ width: "100%", maxWidth: 260, display: "block", margin: "0 auto" }}
        />
        <button
          onClick={onClose}
          style={{
            marginTop: "1rem", background: "#2C1E0F", color: "#fff",
            border: "none", padding: ".5rem 2rem", cursor: "pointer",
            fontSize: ".82rem", fontWeight: 600, borderRadius: 4,
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

// ─── Receipt Modal ────────────────────────────────────────────────────────────

type SessionEntry = { date: string; time?: string; className?: string };

function ReceiptModal({
  studentName,
  studentCode,
  displayName,
  monthLabel,
  year,
  month,
  totalSessions,
  presentSessions,
  absentSessions,
  pricePerSession,
  totalFee,
  courseType,
  sessions,
  attendance,
  onClose,
}: {
  studentName: string;
  studentCode: string;
  displayName: string;
  monthLabel: string;
  year: number;
  month: number;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  pricePerSession: number;
  totalFee: number;
  courseType: string | undefined;
  sessions: SessionEntry[];
  attendance: Record<string, AttendanceStatus | undefined>;
  onClose: () => void;
}) {
  const [zoomQR, setZoomQR] = useState(false);

  const receiptId = `BL-${year}${String(month).padStart(2,"0")}-${studentCode}`;
  const transferNote = `Hoc phi ${displayName} T${month}/${year}`;
  const amountFormatted = totalFee.toLocaleString("vi-VN");

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(44,30,15,.6)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          overflowY: "auto",
          padding: "1.5rem 1rem",
        }}
        onClick={onClose}
      >
        <div
          className="receipt-print-area"
          style={{
            background: "#fff",
            width: "100%",
            maxWidth: 480,
            boxShadow: "0 12px 40px rgba(44,30,15,.25)",
            borderRadius: 2,
            marginBottom: "1.5rem",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Receipt header */}
          <div style={{ padding: "1.25rem 1.5rem 1rem", borderBottom: "2px solid #C4622D", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#2C1E0F", letterSpacing: "-.01em" }}>
                Tiếng Anh² Hiểu
              </div>
              <div style={{ fontSize: ".65rem", color: "#9A8672", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 2 }}>
                English Course Tracker
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: ".9rem", fontWeight: 700, color: "#2C1E0F" }}>Biên Lai Học Phí</div>
              <div style={{ fontSize: ".65rem", color: "#9A8672", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                {receiptId}
              </div>
            </div>
          </div>

          {/* Student info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderBottom: "1px solid #EEE6DC" }}>
            {[
              { label: "HỌC VIÊN", value: studentName },
              { label: "MÃ HV", value: studentCode },
              { label: "KỲ HỌC", value: `Tháng ${month}/${year}` },
              { label: "LOẠI KHÓA", value: courseTypeLabel(courseType) },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  padding: ".65rem 1.5rem",
                  borderBottom: i < 2 ? "1px solid #EEE6DC" : undefined,
                  borderRight: i % 2 === 0 ? "1px solid #EEE6DC" : undefined,
                }}
              >
                <div style={{ fontSize: ".6rem", fontWeight: 700, color: "#9A8672", letterSpacing: ".08em", textTransform: "uppercase" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: ".82rem", fontWeight: 600, color: "#2C1E0F", marginTop: 2 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #EEE6DC" }}>
            <div style={{ padding: ".75rem 1rem", borderTop: "3px solid #4A7C59", borderRight: "1px solid #EEE6DC", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4A7C59", fontFamily: "'Lora', Georgia, serif", lineHeight: 1 }}>
                {presentSessions}
              </div>
              <div style={{ fontSize: ".58rem", fontWeight: 700, color: "#9A8672", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>
                Buổi có mặt
              </div>
            </div>
            <div style={{ padding: ".75rem 1rem", borderTop: "3px solid #B03A2A", borderRight: "1px solid #EEE6DC", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#B03A2A", fontFamily: "'Lora', Georgia, serif", lineHeight: 1 }}>
                {absentSessions}
              </div>
              <div style={{ fontSize: ".58rem", fontWeight: 700, color: "#9A8672", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>
                Buổi vắng
              </div>
            </div>
            <div style={{ padding: ".75rem 1rem", borderTop: "3px solid #C4622D", textAlign: "center" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#C4622D", fontFamily: "'Lora', Georgia, serif", lineHeight: 1 }}>
                {(totalFee / 1000).toFixed(0)}k
              </div>
              <div style={{ fontSize: ".58rem", fontWeight: 700, color: "#9A8672", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>
                Học phí
              </div>
              <div style={{ fontSize: ".6rem", color: "#9A8672", marginTop: 1 }}>
                {presentSessions} × {(pricePerSession / 1000).toFixed(0)}k
              </div>
            </div>
          </div>

          {/* Session table */}
          {sessions.length > 0 && (
            <div style={{ borderBottom: "1px solid #EEE6DC" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 80px", padding: ".45rem 1.5rem", background: "#F7F3EE", fontSize: ".6rem", fontWeight: 700, color: "#9A8672", letterSpacing: ".07em", textTransform: "uppercase", gap: ".5rem" }}>
                <span>#</span>
                <span>Buổi học</span>
                <span>Trạng thái</span>
                <span style={{ textAlign: "right" }}>Học phí</span>
              </div>
              {sessions.map((s, idx) => {
                const st = attendance[s.date] as AttendanceStatus | undefined;
                const isPresent = st === "present";
                const isAbsent = st === "absent";
                return (
                  <div
                    key={`${s.date}_${s.time ?? ""}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 1fr 90px 80px",
                      padding: ".4rem 1.5rem",
                      borderBottom: idx < sessions.length - 1 ? "1px solid #F0E8DE" : undefined,
                      gap: ".5rem",
                      alignItems: "center",
                      background: isPresent ? "rgba(74,124,89,.03)" : undefined,
                    }}
                  >
                    <span style={{ fontSize: ".7rem", color: "#9A8672", fontWeight: 600 }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: ".75rem", fontWeight: 600, color: "#2C1E0F" }}>
                        {getDow(s.date)}, {fmtDate(s.date)}{s.className ? ` · ${s.className}` : ""}
                      </div>
                      {s.time && (
                        <div style={{ fontSize: ".65rem", color: "#9A8672" }}>🕐 {s.time}</div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: ".62rem", fontWeight: 700, padding: ".2rem .5rem",
                        borderRadius: 99,
                        background: isPresent ? "rgba(74,124,89,.12)" : isAbsent ? "rgba(176,58,42,.1)" : "rgba(0,0,0,.06)",
                        color: isPresent ? "#4A7C59" : isAbsent ? "#B03A2A" : "#9A8672",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isPresent ? "✓ Có mặt" : isAbsent ? "✗ Vắng" : "— Chưa"}
                    </span>
                    <span
                      style={{
                        fontSize: ".78rem", fontWeight: 600, textAlign: "right",
                        color: isPresent ? "#C4622D" : "#9A8672",
                        textDecoration: isAbsent ? "line-through" : undefined,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isPresent ? `${(pricePerSession/1000).toFixed(0)}k` : "–"}
                    </span>
                  </div>
                );
              })}
              {/* Total row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".65rem 1.5rem", background: "#F7F3EE" }}>
                <span style={{ fontSize: ".78rem", color: "#9A8672" }}>
                  Tổng cộng ({presentSessions} buổi có mặt)
                </span>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: "#C4622D", fontFamily: "'Lora', Georgia, serif" }}>
                  {amountFormatted} đ
                </span>
              </div>
            </div>
          )}

          {/* QR Payment section */}
          <div style={{ padding: "1rem 1.5rem", background: "#FAF7F3", borderBottom: "1px solid #EEE6DC" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              {/* QR image */}
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{ cursor: "pointer", position: "relative" }}
                  onClick={() => setZoomQR(true)}
                  title="Click để phóng to"
                >
                  <img
                    src="/qr-payment.png"
                    alt="QR chuyển khoản"
                    style={{ width: 100, height: 100, display: "block", border: "1px solid #EEE6DC", borderRadius: 4 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling!.setAttribute("style", "display:flex");
                    }}
                  />
                  <div style={{
                    display: "none", width: 100, height: 100,
                    alignItems: "center", justifyContent: "center",
                    background: "#EEE6DC", border: "1px solid #DDD0BC", borderRadius: 4,
                    fontSize: "2rem",
                  }}>📱</div>
                </div>
                <div style={{ fontSize: ".58rem", color: "#9A8672", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
                  Click để phóng to
                </div>
              </div>

              {/* Bank info */}
              <div style={{ flex: 1, fontSize: ".72rem" }}>
                <div style={{ fontWeight: 800, color: "#d92e2e", fontSize: ".8rem", letterSpacing: ".02em", marginBottom: ".4rem" }}>
                  TECHCOMBANK
                </div>
                {[
                  { label: "CHỦ TÀI KHOẢN", value: "LAM QUANG HIEU" },
                  { label: "SỐ TÀI KHOẢN", value: "7313 7799 66" },
                  { label: "SỐ TIỀN", value: `${amountFormatted} đ`, orange: true },
                  { label: "NỘI DUNG CK", value: transferNote },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: ".3rem" }}>
                    <div style={{ fontSize: ".58rem", color: "#9A8672", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.label}</div>
                    <div style={{ fontWeight: 700, color: (item as {orange?: boolean}).orange ? "#C4622D" : "#2C1E0F", marginTop: 1 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: ".75rem", padding: "1rem 1.5rem", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: ".5rem 1.25rem", background: "none",
                border: "1px solid #DDD0BC", color: "#9A8672",
                fontSize: ".8rem", cursor: "pointer", borderRadius: 2,
              }}
            >
              × Đóng
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: ".5rem 1.25rem", background: "#2C1E0F",
                border: "none", color: "#fff",
                fontSize: ".8rem", fontWeight: 600, cursor: "pointer", borderRadius: 2,
                display: "flex", alignItems: "center", gap: ".35rem",
              }}
            >
              🖨 In / Lưu PDF
            </button>
          </div>
        </div>
      </div>

      {zoomQR && <QRLightbox onClose={() => setZoomQR(false)} />}
    </>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({
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

  const dayNum = date.split("-")[2];
  const dayColor = isPresent ? "#C4622D" : isAbsent ? "#B03A2A" : "#9A8672";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr auto auto",
        alignItems: "center",
        gap: ".75rem",
        padding: ".55rem .85rem",
        borderBottom: "1px solid var(--border,#DDD0BC)",
        background: isPresent ? "rgba(74,124,89,.03)" : "var(--bg-elevated,#FBF7F2)",
      }}
    >
      {/* Day number */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: dayColor, fontFamily: "'Lora', Georgia, serif", lineHeight: 1 }}>
          {parseInt(dayNum, 10)}
        </div>
      </div>

      {/* Session info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: ".78rem", fontWeight: 600, color: "#2C1E0F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {getDow(date)}, {fmtDate(date)}{className ? ` – ${className}` : ""}
        </div>
        {time && (
          <div style={{ fontSize: ".65rem", color: "#9A8672", marginTop: 1 }}>🕐 {time}</div>
        )}
      </div>

      {/* Status badge */}
      <span
        style={{
          fontSize: ".62rem", fontWeight: 700, padding: ".2rem .5rem",
          borderRadius: 99, whiteSpace: "nowrap",
          background: isPresent ? "rgba(74,124,89,.12)" : isAbsent ? "rgba(176,58,42,.1)" : "rgba(0,0,0,.06)",
          color: isPresent ? "#4A7C59" : isAbsent ? "#B03A2A" : "#9A8672",
        }}
      >
        {isPresent ? "✓ CÓ MẶT" : isAbsent ? "✗ VẮNG" : "— CHƯA"}
      </span>

      {/* Amount */}
      <div
        style={{
          fontSize: ".82rem", fontWeight: 600, textAlign: "right",
          color: isPresent ? "#C4622D" : "#9A8672",
          textDecoration: isAbsent ? "line-through" : undefined,
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: "nowrap",
          minWidth: 72,
        }}
      >
        {isPresent ? fmtMoney(pricePerSession) : "–"}
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

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth() + 1);
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

  const courseType = student?.courseType;
  const isPackage = courseType === "package";
  const pricePerSession = student?.pricePerSession ?? 0;

  const myClasses = useMemo(() => {
    if (!profile?.studentCode) return [];
    return classes.filter(cls => cls.members?.includes(profile.studentCode!));
  }, [classes, profile?.studentCode]);

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
    return getSessionDates(year, month, student.schedule ?? [], classWeeklySlots, today);
  }, [student, year, month, classWeeklySlots, today]);

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

  const monthLabel = `Tháng ${month}/${year}`;
  const studentName = student?.name ?? profile?.displayName ?? "Học viên";
  const studentCode = profile?.studentCode ?? "";
  const displayName = profile?.displayName ?? studentName;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem" }}>Đang tải…</div>
      )}

      {!loading && (
        <>
          {/* Header card */}
          <div
            style={{
              background: "var(--bg-elevated,#FBF7F2)",
              border: "1px solid var(--border,#DDD0BC)",
              padding: "1rem 1rem .85rem",
              marginBottom: ".75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              {/* Left: course info */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: ".65rem" }}>
                <span style={{ fontSize: "1.5rem", lineHeight: 1, marginTop: 2 }}>🏅</span>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#2C1E0F" }}>Học phí</div>
                  {!isPackage && pricePerSession > 0 && (
                    <div style={{ fontSize: ".72rem", color: "#9A8672", marginTop: 2 }}>
                      Đơn giá: {fmtMoney(pricePerSession)}/buổi
                    </div>
                  )}
                  <div style={{ marginTop: ".4rem" }}>
                    <span
                      style={{
                        fontSize: ".62rem", fontWeight: 700, padding: ".2rem .55rem",
                        borderRadius: 99,
                        background: "rgba(196,98,45,.1)", color: "#C4622D",
                        border: "1px solid rgba(196,98,45,.2)",
                        textTransform: "uppercase", letterSpacing: ".05em",
                      }}
                    >
                      {courseTypeLabel(courseType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: month nav + receipt button */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".5rem", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".35rem" }}>
                  <button
                    onClick={prevMonth}
                    style={{ background: "none", border: "1px solid #DDD0BC", cursor: "pointer", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", color: "#2C1E0F", borderRadius: 2 }}
                    aria-label="Tháng trước"
                  >‹</button>
                  <span style={{ fontWeight: 700, fontSize: ".82rem", color: "#2C1E0F", whiteSpace: "nowrap" }}>
                    Tháng {month}/{year}
                  </span>
                  <button
                    onClick={nextMonth}
                    style={{ background: "none", border: "1px solid #DDD0BC", cursor: "pointer", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", color: "#2C1E0F", borderRadius: 2 }}
                    aria-label="Tháng sau"
                  >›</button>
                </div>
                {sessionDates.length > 0 && (
                  <button
                    onClick={() => setShowReceipt(true)}
                    style={{
                      padding: ".4rem .85rem",
                      background: "#2C1E0F", color: "#fff",
                      border: "none", fontWeight: 600, fontSize: ".72rem",
                      cursor: "pointer", borderRadius: 2,
                      display: "flex", alignItems: "center", gap: ".3rem",
                    }}
                  >
                    📄 Biên lai
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Package mode */}
          {isPackage && (
            <div
              style={{
                background: "var(--bg-elevated,#FBF7F2)",
                border: "1px solid var(--border,#DDD0BC)",
                padding: "1.5rem",
                marginBottom: ".75rem",
              }}
            >
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
            </div>
          )}

          {/* Per-session stats */}
          {!isPackage && (
            <>
              {sessionDates.length === 0 ? (
                <div
                  style={{
                    padding: "2rem", textAlign: "center", color: "#9A8672", fontSize: ".82rem",
                    border: "1px solid var(--border,#DDD0BC)", background: "var(--bg-elevated,#FBF7F2)",
                    marginBottom: ".75rem",
                  }}
                >
                  Không có buổi học nào trong tháng {month}/{year}.
                </div>
              ) : (
                <>
                  {/* 3-column summary */}
                  <div
                    style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                      border: "1px solid var(--border,#DDD0BC)",
                      marginBottom: ".75rem",
                      background: "var(--bg-elevated,#FBF7F2)",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: ".75rem .5rem", textAlign: "center", borderTop: "3px solid #4A7C59", borderRight: "1px solid var(--border,#DDD0BC)" }}>
                      <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#4A7C59", lineHeight: 1 }}>
                        {summary.present}
                      </div>
                      <div style={{ fontSize: ".58rem", color: "#9A8672", marginTop: ".2rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Buổi có mặt
                      </div>
                    </div>
                    <div style={{ padding: ".75rem .5rem", textAlign: "center", borderTop: "3px solid #B03A2A", borderRight: "1px solid var(--border,#DDD0BC)" }}>
                      <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#B03A2A", lineHeight: 1 }}>
                        {summary.absent + summary.unknown}
                      </div>
                      <div style={{ fontSize: ".58rem", color: "#9A8672", marginTop: ".2rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Vắng / chưa điểm
                      </div>
                    </div>
                    <div style={{ padding: ".75rem .5rem", textAlign: "center", borderTop: "3px solid #C4622D" }}>
                      <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.25rem", fontWeight: 700, color: "#C4622D", lineHeight: 1 }}>
                        {summary.present > 0 ? `${(summary.totalFee / 1000).toFixed(0)}k` : "0"}
                        <span style={{ fontSize: ".7rem", fontWeight: 400 }}> đ</span>
                      </div>
                      <div style={{ fontSize: ".58rem", color: "#9A8672", marginTop: ".2rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Tổng học phí
                      </div>
                      <div style={{ fontSize: ".6rem", color: "#9A8672", marginTop: 1 }}>
                        {summary.present} buổi × {(pricePerSession / 1000).toFixed(0)}k đ
                      </div>
                    </div>
                  </div>

                  {/* Session list */}
                  <div style={{ border: "1px solid var(--border,#DDD0BC)", overflow: "hidden" }}>
                    <div
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: ".45rem .85rem",
                        background: "#2C1E0F",
                      }}
                    >
                      <span style={{ fontSize: ".6rem", fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                        Buổi học trong tháng ({sessionDates.length} buổi đã qua)
                      </span>
                      <span style={{ fontSize: ".6rem", fontWeight: 700, color: "rgba(255,255,255,.5)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Học phí
                      </span>
                    </div>
                    {sessionDates.map((s) => (
                      <SessionRow
                        key={`${s.date}_${s.time ?? ""}`}
                        date={s.date}
                        time={s.time}
                        status={attendance[s.date] as AttendanceStatus | undefined}
                        pricePerSession={pricePerSession}
                        className={s.className}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {showReceipt && (
        <ReceiptModal
          studentName={studentName}
          studentCode={studentCode}
          displayName={displayName}
          monthLabel={monthLabel}
          year={year}
          month={month}
          totalSessions={summary.total}
          presentSessions={summary.present}
          absentSessions={summary.absent}
          pricePerSession={pricePerSession}
          totalFee={isPackage ? (student?.totalFee ?? 0) : summary.totalFee}
          courseType={courseType}
          sessions={sessionDates}
          attendance={attendance as Record<string, AttendanceStatus | undefined>}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
