"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useClasses } from "@/hooks/firebase/useClasses";
import { useSlots } from "@/hooks/firebase/useSlots";
import { useBookings } from "@/hooks/firebase/useBookings";
import { createBooking } from "@/lib/firebase/helpers";
import type { ScheduleItem, Slot, Booking } from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const DOW_FULL = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function getDowFull(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DOW_FULL[new Date(y, m - 1, d).getDay()];
}

function fmtDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const DAY_NAME_TO_NUM: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

function generateWeeklyDates(
  day: string,
  time: string,
  className: string,
  classId: string,
  fromDate: string,
  count = 8
): (ScheduleItem & { kind: string; source: "class"; classId: string; className: string })[] {
  // day có thể là số ("0".."6") hoặc tên ("Monday".."Sunday")
  const dayNum = day in DAY_NAME_TO_NUM ? DAY_NAME_TO_NUM[day] : parseInt(day, 10);
  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) return [];

  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd);

  let cur = new Date(start);
  const diff = (dayNum - cur.getDay() + 7) % 7;
  cur.setDate(cur.getDate() + diff);

  const results: (ScheduleItem & { kind: string; source: "class"; classId: string; className: string })[] = [];
  for (let i = 0; i < count; i++) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    results.push({
      id: `cls_${classId}_${y}-${m}-${d}`,
      date: `${y}-${m}-${d}`,
      time,
      title: `📚 ${className}`,
      kind: "class",
      source: "class",
      classId,
      className,
    });
    cur.setDate(cur.getDate() + 7);
  }
  return results;
}

// Lịch cố định cá nhân (HV học lẻ, không thuộc lớp)
function generateWeeklyPersonal(
  day: string,
  time: string,
  fromDate: string,
  idx: number,
  count = 8
): SessionEntry[] {
  const dayNum = day in DAY_NAME_TO_NUM ? DAY_NAME_TO_NUM[day] : parseInt(day, 10);
  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) return [];

  const [fy, fm, fd] = fromDate.split("-").map(Number);
  let cur = new Date(fy, fm - 1, fd);
  cur.setDate(cur.getDate() + ((dayNum - cur.getDay() + 7) % 7));

  const results: SessionEntry[] = [];
  for (let i = 0; i < count; i++) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    results.push({
      id: `fixed_${idx}_${y}-${m}-${d}`,
      date: `${y}-${m}-${d}`,
      time,
      title: "⏰ Lịch cố định",
      kind: "1-1",
      source: "personal",
    });
    cur.setDate(cur.getDate() + 7);
  }
  return results;
}

// ─── Session row ─────────────────────────────────────────────────────────────

type SessionEntry = ScheduleItem & {
  kind?: string;
  source?: "personal" | "class";
  className?: string;
};

function SessionRow({ s, isToday }: { s: SessionEntry; isToday: boolean }) {
  const [, m, d] = s.date.split("-");
  const dow = getDowFull(s.date);
  const isClass = s.kind === "class";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".85rem",
        padding: ".7rem 1rem",
        background: isToday ? "rgba(196,98,45,.07)" : "var(--bg-elevated,#FBF7F2)",
        border: `1px solid ${isToday ? "rgba(196,98,45,.3)" : "var(--border,#DDD0BC)"}`,
        marginBottom: ".4rem",
        position: "relative",
      }}
    >
      {isToday && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#C4622D" }} />
      )}

      {/* Mini calendar */}
      <div
        style={{
          flexShrink: 0,
          width: 42,
          textAlign: "center",
          borderRight: "1px solid var(--border,#DDD0BC)",
          paddingRight: ".6rem",
        }}
      >
        <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1, color: isToday ? "#C4622D" : "#2C1E0F" }}>
          {d}
        </div>
        <div style={{ fontSize: ".6rem", color: "#9A8672", marginTop: ".05rem" }}>T{m}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: ".82rem", fontWeight: 600, color: "#2C1E0F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {s.title}
          </span>
          <span style={{ fontSize: ".58rem", fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", padding: ".1rem .4rem", borderRadius: 99, background: isClass ? "rgba(40,96,168,.1)" : "rgba(196,98,45,.1)", color: isClass ? "#2860A8" : "#C4622D", flexShrink: 0 }}>
            {isClass ? "🏫 Lớp" : "🤝 1-1"}
          </span>
          {isToday && (
            <span style={{ fontSize: ".58rem", fontWeight: 700, padding: ".1rem .4rem", borderRadius: 99, background: "#C4622D", color: "#fff", flexShrink: 0 }}>
              Hôm nay
            </span>
          )}
        </div>
        <div style={{ fontSize: ".72rem", color: "#9A8672", marginTop: ".15rem" }}>
          {dow}{s.time ? ` · ${s.time}` : ""}
          {s.source === "class" && s.className ? ` · ${s.className}` : ""}
        </div>
      </div>
    </div>
  );
}

// ─── Booking components ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: "Chờ xác nhận", color: "rgba(245,158,11,0.15)" },
  approved: { label: "Đã xác nhận",  color: "rgba(16,185,129,0.15)" },
  declined: { label: "Đã từ chối",   color: "rgba(239,68,68,0.12)"  },
};

const STATUS_TEXT: Record<string, string> = {
  pending:  "#9A8672",
  approved: "rgb(5,150,105)",
  declined: "rgb(220,38,38)",
};

function BookingItem({ booking }: { booking: Booking }) {
  const st = STATUS_LABEL[booking.status] ?? STATUS_LABEL.pending;
  const date = new Date(booking.date).toLocaleDateString("vi-VN", {
    weekday: "short", day: "numeric", month: "long",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: ".7rem 1rem",
        background: "var(--bg-elevated,#FBF7F2)",
        border: "1px solid var(--border,#DDD0BC)",
        marginBottom: ".4rem",
      }}
    >
      <div>
        <p style={{ fontSize: ".82rem", fontWeight: 600, color: "#2C1E0F", margin: 0 }}>
          {date} · {booking.time}
        </p>
        {booking.note && (
          <p style={{ fontSize: ".72rem", color: "#9A8672", margin: ".15rem 0 0" }}>{booking.note}</p>
        )}
      </div>
      <span
        style={{
          fontSize: ".65rem",
          fontWeight: 700,
          padding: ".2rem .6rem",
          borderRadius: 99,
          background: st.color,
          color: STATUS_TEXT[booking.status] ?? "#9A8672",
          flexShrink: 0,
        }}
      >
        {st.label}
      </span>
    </div>
  );
}

function SlotCard({
  slot,
  onBook,
  booked,
}: {
  slot: Slot;
  onBook: (slot: Slot, note: string) => Promise<void>;
  booked: boolean;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const date = new Date(slot.date).toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const isPast = slot.date < new Date().toISOString().slice(0, 10);
  if (isPast) return null;

  async function handleBook() {
    setLoading(true);
    try {
      await onBook(slot, note);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  const isBooked = booked || done;

  return (
    <div
      style={{
        padding: ".85rem 1rem",
        background: "var(--bg-elevated,#FBF7F2)",
        border: `1px solid ${isBooked ? "rgba(16,185,129,0.4)" : "var(--border,#DDD0BC)"}`,
        marginBottom: ".4rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <p style={{ fontSize: ".82rem", fontWeight: 600, color: "#2C1E0F", margin: 0 }}>{date}</p>
          <p style={{ fontSize: ".78rem", color: "#C4622D", margin: ".15rem 0 0" }}>🕐 {slot.time}</p>
          {slot.note && (
            <p style={{ fontSize: ".7rem", color: "#9A8672", margin: ".1rem 0 0" }}>{slot.note}</p>
          )}
        </div>

        {isBooked ? (
          <span style={{ fontSize: ".65rem", fontWeight: 700, padding: ".2rem .6rem", borderRadius: 99, background: "rgba(16,185,129,0.15)", color: "rgb(5,150,105)", flexShrink: 0 }}>
            ✓ Đã đặt
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", alignItems: "flex-end" }}>
            <input
              type="text"
              placeholder="Ghi chú (không bắt buộc)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                fontSize: ".72rem",
                padding: ".35rem .6rem",
                border: "1px solid var(--border,#DDD0BC)",
                background: "var(--bg-primary,#F5EFE6)",
                color: "#2C1E0F",
                outline: "none",
                width: 170,
                borderRadius: 4,
              }}
            />
            <button
              onClick={handleBook}
              disabled={loading}
              style={{
                fontSize: ".72rem",
                fontWeight: 700,
                padding: ".35rem .9rem",
                background: "#C4622D",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Đang đặt…" : "Đặt lịch"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Request Form ─────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8;
  return `${String(h).padStart(2, "0")}:00`;
}); // "08:00" … "21:00"

function RequestForm({ onSubmit }: { onSubmit: (date: string, time: string, topic: string) => Promise<void> }) {
  const today = localToday();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    setLoading(true);
    try {
      await onSubmit(date, time, topic);
      setDone(true);
      setDate(""); setTime(""); setTopic("");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          padding: "1.2rem 1rem",
          background: "rgba(16,185,129,0.07)",
          border: "1px solid rgba(16,185,129,0.3)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: ".85rem", fontWeight: 700, color: "rgb(5,150,105)", margin: 0 }}>
          ✓ Đã gửi yêu cầu! Giáo viên sẽ xác nhận sớm.
        </p>
        <button
          onClick={() => setDone(false)}
          style={{ marginTop: ".6rem", fontSize: ".72rem", color: "#9A8672", background: "none", border: "none", cursor: "pointer" }}
        >
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: ".55rem .75rem",
    fontSize: ".82rem",
    border: "1px solid var(--border,#DDD0BC)",
    background: "var(--bg-primary,#F5EFE6)",
    color: "#2C1E0F",
    outline: "none",
    borderRadius: 4,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
      {/* Date */}
      <div>
        <label style={{ display: "block", fontSize: ".68rem", fontWeight: 700, color: "#9A8672", marginBottom: ".3rem", letterSpacing: ".06em", textTransform: "uppercase" }}>
          Ngày học *
        </label>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      {/* Time */}
      <div>
        <label style={{ display: "block", fontSize: ".68rem", fontWeight: 700, color: "#9A8672", marginBottom: ".3rem", letterSpacing: ".06em", textTransform: "uppercase" }}>
          Giờ học *
        </label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">-- Chọn giờ --</option>
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {/* Topic */}
      <div>
        <label style={{ display: "block", fontSize: ".68rem", fontWeight: 700, color: "#9A8672", marginBottom: ".3rem", letterSpacing: ".06em", textTransform: "uppercase" }}>
          Nội dung muốn học
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ví dụ: Luyện listening Part 3, Từ vựng chủ đề công nghệ…"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !date || !time}
        style={{
          padding: ".65rem 1rem",
          background: !date || !time ? "var(--border,#DDD0BC)" : "#C4622D",
          color: !date || !time ? "#9A8672" : "#fff",
          border: "none",
          borderRadius: 4,
          fontSize: ".82rem",
          fontWeight: 700,
          cursor: !date || !time ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "all .15s",
        }}
      >
        {loading ? "Đang gửi…" : "Gửi yêu cầu đặt lịch →"}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"schedule" | "booking">(
    searchParams.get("tab") === "booking" ? "booking" : "schedule"
  );

  useEffect(() => {
    if (searchParams.get("tab") === "booking") setActiveTab("booking");
  }, [searchParams]);

  const { profile } = useProfile();
  const { student, loading: stuLoading } = useStudent(profile?.studentCode);
  const { classes, loading: clsLoading } = useClasses();
  const { slots, loading: slotsLoading } = useSlots();
  const { bookings, loading: bookingsLoading } = useBookings({ studentId: profile?.id });

  const scheduleLoading = stuLoading || clsLoading;
  const bookingLoading = slotsLoading || bookingsLoading;

  const td = localToday();

  // Merge personal schedule + class weeklySchedule
  const allSessions = useMemo<SessionEntry[]>(() => {
    const results: SessionEntry[] = [];

    for (const s of student?.schedule ?? []) {
      results.push({ ...s, source: "personal" });
    }

    const studentCode = profile?.studentCode;
    let inClass = false;
    if (studentCode) {
      for (const cls of classes) {
        if (!cls.members?.includes(studentCode)) continue;
        inClass = true;
        for (const slot of cls.weeklySchedule ?? []) {
          const generated = generateWeeklyDates(slot.day, slot.time, cls.name, cls.id, td, 8);
          results.push(...generated);
        }
      }
    }

    // Lịch cố định cá nhân — chỉ khi HV không thuộc lớp nào
    if (!inClass) {
      (student?.weeklySchedule ?? []).forEach((slot, i) => {
        results.push(...generateWeeklyPersonal(slot.day, slot.time, td, i, 8));
      });
    }

    // Deduplicate (personal takes priority)
    const seen = new Set<string>();
    const deduped: SessionEntry[] = [];
    results.sort((a, b) => {
      if (a.source === "personal" && b.source !== "personal") return -1;
      if (a.source !== "personal" && b.source === "personal") return 1;
      return 0;
    });
    for (const s of results) {
      const key = `${s.date}_${s.time ?? ""}_${s.kind ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(s);
      }
    }

    return deduped.sort((a, b) => a.date.localeCompare(b.date));
  }, [student?.schedule, student?.weeklySchedule, classes, profile?.studentCode, td]);

  const upcoming = useMemo(() => allSessions.filter((s) => s.date >= td), [allSessions, td]);
  const history  = useMemo(() => allSessions.filter((s) => s.date < td).reverse(), [allSessions, td]);

  // Booking data
  const bookedSlotIds = new Set(bookings.map((b) => b.slotId));
  const upcomingSlots = slots.filter((s) => s.date >= new Date().toISOString().slice(0, 10));
  const myBookings = [...bookings].sort((a, b) => b.date.localeCompare(a.date));
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  async function handleBook(slot: Slot, note: string) {
    if (!profile) return;
    await createBooking({
      studentId: profile.id,
      studentName: profile.displayName ?? "Học viên",
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      note: note || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  async function handleRequestBooking(date: string, time: string, topic: string) {
    if (!profile) return;
    await createBooking({
      studentId: profile.id,
      studentName: profile.displayName ?? "Học viên",
      slotId: "",
      date,
      time,
      note: topic || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      {/* Page title */}
      <div style={{ marginBottom: "1.1rem" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary,#2C1E0F)", margin: 0 }}>
          🗓 Lịch học
        </h1>
        <p style={{ fontSize: ".78rem", color: "#9A8672", margin: ".2rem 0 0" }}>
          Lịch cá nhân + lịch lớp tổng hợp
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.2rem" }}>
        {(["schedule", "booking"] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                position: "relative",
                padding: ".45rem 1rem",
                fontSize: ".75rem",
                fontWeight: 700,
                letterSpacing: ".04em",
                border: "1px solid",
                borderColor: active ? "#C4622D" : "var(--border,#DDD0BC)",
                background: active ? "rgba(196,98,45,.09)" : "transparent",
                color: active ? "#C4622D" : "#9A8672",
                cursor: "pointer",
                borderRadius: 6,
                transition: "all .15s",
              }}
            >
              {tab === "schedule" ? "🗓 Lịch học" : "📅 Đặt lịch"}
              {/* Badge for pending bookings on Đặt lịch tab */}
              {tab === "booking" && pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#C4622D",
                    color: "#fff",
                    fontSize: ".55rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Lịch học ─────────────────────────────────────────────────── */}
      {activeTab === "schedule" && (
        <>
          {scheduleLoading && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem" }}>
              Đang tải…
            </div>
          )}

          {!scheduleLoading && allSessions.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem", background: "var(--bg-elevated,#FBF7F2)", border: "1px solid var(--border,#DDD0BC)" }}>
              Chưa có lịch học nào. Giáo viên sẽ thêm lịch cho bạn.
            </div>
          )}

          {!scheduleLoading && allSessions.length > 0 && (
            <>
              {upcoming.length > 0 && (
                <section style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".55rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
                    Sắp tới
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 99, background: "#C4622D", color: "#fff", fontSize: ".6rem", fontWeight: 700 }}>
                      {upcoming.length}
                    </span>
                  </div>
                  {upcoming.map((s) => (
                    <SessionRow key={s.id ?? `${s.date}_${s.time}`} s={s} isToday={s.date === td} />
                  ))}
                </section>
              )}

              {history.length > 0 && (
                <section>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".55rem" }}>
                    Lịch sử · {history.length} buổi
                  </div>
                  {history.map((s) => (
                    <SessionRow key={s.id ?? `${s.date}_${s.time}_past`} s={s} isToday={false} />
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* ── Tab 2: Đặt lịch ─────────────────────────────────────────────────── */}
      {activeTab === "booking" && (
        <>
          {bookingLoading && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem" }}>
              Đang tải…
            </div>
          )}

          {!bookingLoading && (
            <>
              {/* Lịch đã đặt */}
              {myBookings.length > 0 && (
                <section style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".55rem" }}>
                    Lịch đã đặt · {myBookings.length}
                  </div>
                  {myBookings.map((b) => (
                    <BookingItem key={b.id || b.createdAt} booking={b} />
                  ))}
                </section>
              )}

              {/* Slot trống */}
              <section>
                <div style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#9A8672", marginBottom: ".55rem" }}>
                  Khung giờ trống
                </div>
                {upcomingSlots.length === 0 ? (
                  <div style={{ padding: "2.5rem", textAlign: "center", color: "#9A8672", fontSize: ".85rem", background: "var(--bg-elevated,#FBF7F2)", border: "1px solid var(--border,#DDD0BC)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📅</div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#2C1E0F" }}>Chưa có khung giờ trống</p>
                    <p style={{ margin: ".4rem 0 0", fontSize: ".78rem" }}>Giáo viên sẽ mở lịch sớm.</p>
                  </div>
                ) : (
                  upcomingSlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onBook={handleBook}
                      booked={bookedSlotIds.has(slot.id)}
                    />
                  ))
                )}
              </section>

              {/* Đề xuất lịch học */}
              <section style={{ marginTop: "1.5rem" }}>
                <div
                  style={{
                    fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em",
                    textTransform: "uppercase", color: "#9A8672",
                    marginBottom: ".55rem", display: "flex", alignItems: "center", gap: ".5rem",
                  }}
                >
                  Đề xuất lịch học
                  <span style={{ fontSize: ".6rem", fontWeight: 500, textTransform: "none", color: "#B8A898", letterSpacing: 0 }}>
                    — không có slot phù hợp? Gửi yêu cầu riêng
                  </span>
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--bg-elevated,#FBF7F2)",
                    border: "1px solid var(--border,#DDD0BC)",
                  }}
                >
                  <RequestForm onSubmit={handleRequestBooking} />
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
