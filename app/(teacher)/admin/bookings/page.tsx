"use client";

import { useState } from "react";
import { useBookings } from "@/hooks/firebase/useBookings";
import { updateBookingStatus, updateBookingNote, isBookingActive, bookingNotifyCode } from "@/lib/firebase/helpers";
import { notify } from "@/lib/firebase/notifications";
import type { Booking, BookingStatus } from "@/lib/firebase/types";

const SUGGEST_HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; color: string }
> = {
  pending:  { label: "Chờ",       bg: "rgba(245,158,11,0.12)", color: "rgb(180,120,0)"  },
  approved: { label: "✓ Xác nhận", bg: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)" },
  declined: { label: "✗ Từ chối", bg: "rgba(239,68,68,0.10)",  color: "rgb(220,38,38)"  },
  cancelled:{ label: "⊘ Đã huỷ",  bg: "rgba(120,113,108,0.14)", color: "rgb(87,83,78)" },
};

const FILTER_TABS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all",      label: "Tất cả"   },
  { key: "pending",  label: "Chờ xử lý"},
  { key: "approved", label: "Đã xác nhận"},
  { key: "declined", label: "Từ chối" },
  { key: "cancelled", label: "Đã huỷ" },
];

function BookingRow({ booking, allBookings }: { booking: Booking; allBookings: Booking[] }) {
  const [loading, setLoading] = useState<BookingStatus | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestDate, setSuggestDate] = useState("");
  const [suggestTime, setSuggestTime] = useState(SUGGEST_HOURS[2]);
  const [suggestMsg, setSuggestMsg] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const cfg = STATUS_CONFIG[booking.status];

  const date = new Date(booking.date).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function handle(status: BookingStatus, cancelReason?: string) {
    setLoading(status);
    // Chỉ nhả khung giờ khi không còn lượt đặt nào khác đang giữ nó — nếu không,
    // từ chối HV thứ hai sẽ mở lại khung của HV đã được duyệt.
    const heldByOthers = allBookings.some(
      (b) => b.id !== booking.id && b.slotId === booking.slotId && isBookingActive(b.status)
    );
    await updateBookingStatus(
      booking.id,
      status,
      booking.slotId ? { id: booking.slotId, heldByOthers } : undefined,
      cancelReason
    );

    // Báo cho học viên. Booking cũ không xác định được mã HV thì bỏ qua.
    const code = bookingNotifyCode(booking);
    if (code) {
      try {
        if (status === "approved") await notify.bookingApproved(code, booking.date, booking.time);
        else if (status === "declined") await notify.bookingDeclined(code, booking.date);
        else if (status === "cancelled") await notify.bookingCancelled(code, booking.date, booking.time, cancelReason);
      } catch {
        // Thông báo hỏng không được kéo theo cả thao tác đổi trạng thái.
      }
    }
    setLoading(null);
  }

  async function handleSuggest() {
    if (!suggestDate) return;
    setSavingNote(true);
    const parts = [
      `📅 GV gợi ý: ${suggestDate} lúc ${suggestTime}`,
      suggestMsg.trim() ? `— ${suggestMsg.trim()}` : "",
    ].filter(Boolean).join(" ");
    await updateBookingNote(booking.id, parts);
    setSuggesting(false);
    setSuggestMsg("");
    setSavingNote(false);
  }

  const todayStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  })();

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: booking.status === "pending" ? "rgba(245,158,11,0.3)" : "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              {booking.studentName}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            📅 {date} · 🕐 {booking.time}
          </p>
          {booking.note && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              💬 {booking.note}
            </p>
          )}
          {booking.status === "cancelled" && booking.cancelReason && (
            <p className="text-xs mt-1" style={{ color: "rgb(87,83,78)" }}>
              ⊘ Lý do huỷ: {booking.cancelReason}
            </p>
          )}
        </div>

        {booking.status === "pending" && (
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => handle("approved")}
              disabled={!!loading}
              className="text-xs font-semibold px-3 py-1.5 min-h-[44px] rounded-lg transition-opacity"
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "rgb(5,150,105)",
                border: "1px solid rgba(16,185,129,0.3)",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading === "approved" ? "..." : "✓ Xác nhận"}
            </button>
            <button
              onClick={() => handle("declined")}
              disabled={!!loading}
              className="text-xs font-semibold px-3 py-1.5 min-h-[44px] rounded-lg transition-opacity"
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "rgb(220,38,38)",
                border: "1px solid rgba(239,68,68,0.25)",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading === "declined" ? "..." : "✗ Từ chối"}
            </button>
            <button
              onClick={() => setSuggesting((v) => !v)}
              disabled={!!loading}
              className="text-xs font-semibold px-3 py-1.5 min-h-[44px] rounded-lg transition-opacity"
              style={{
                background: "rgba(99,102,241,0.08)",
                color: "rgb(99,102,241)",
                border: "1px solid rgba(99,102,241,0.25)",
                opacity: loading ? 0.5 : 1,
              }}
            >
              💡 Gợi ý lịch khác
            </button>
          </div>
        )}

        {booking.status === "approved" && (
          <button
            onClick={() => {
              const reason = prompt(`Huỷ buổi ${booking.time} ngày ${booking.date} của ${booking.studentName}?
Lý do (có thể bỏ trống):`);
              if (reason === null) return;
              handle("cancelled", reason);
            }}
            disabled={!!loading}
            className="text-xs font-semibold px-3 py-1.5 min-h-[44px] rounded-lg border shrink-0"
            style={{ background: "rgba(120,113,108,0.10)", color: "rgb(87,83,78)", borderColor: "rgba(120,113,108,0.3)", opacity: loading ? 0.5 : 1 }}
          >
            {loading === "cancelled" ? "..." : "⊘ Huỷ buổi"}
          </button>
        )}

        {booking.status !== "pending" && (
          <button
            onClick={() => handle("pending")}
            className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-lg border shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Hoàn tác
          </button>
        )}
      </div>

      {suggesting && (
        <div
          className="mt-3 pt-3 flex flex-col gap-2"
          style={{ borderTop: "1px solid rgba(99,102,241,0.2)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "rgb(99,102,241)" }}>
            💡 Gợi ý lịch học thay thế
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={suggestDate}
              min={todayStr}
              onChange={(e) => setSuggestDate(e.target.value)}
              className="text-sm rounded-lg px-2 py-1.5 border flex-1 min-w-[130px]"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <select
              value={suggestTime}
              onChange={(e) => setSuggestTime(e.target.value)}
              className="text-sm rounded-lg px-2 py-1.5 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {SUGGEST_HOURS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={suggestMsg}
            onChange={(e) => setSuggestMsg(e.target.value)}
            placeholder="Ghi chú thêm (tuỳ chọn)"
            className="text-sm rounded-lg px-2 py-1.5 border w-full"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSuggest}
              disabled={!suggestDate || savingNote}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{
                background: suggestDate ? "rgb(99,102,241)" : "var(--border)",
                color: suggestDate ? "#fff" : "var(--text-muted)",
                opacity: savingNote ? 0.6 : 1,
              }}
            >
              {savingNote ? "Đang gửi..." : "Gửi gợi ý"}
            </button>
            <button
              onClick={() => setSuggesting(false)}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const { bookings, loading } = useBookings();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            📅 Lịch hẹn
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "rgb(180,120,0)" }}>
              ⚠️ {pendingCount} lịch chờ xử lý
            </p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="text-xs px-3 py-1.5 min-h-[44px] rounded-lg font-medium transition-all"
            style={
              filter === tab.key
                ? { background: "var(--accent-primary)", color: "#fff" }
                : { background: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            {tab.label}
            {tab.key === "pending" && pendingCount > 0 && (
              <span
                className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">📅</div>
          <p style={{ color: "var(--text-secondary)" }}>Không có lịch hẹn.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <BookingRow key={b.id} booking={b} allBookings={bookings} />
          ))}
        </div>
      )}
    </div>
  );
}
