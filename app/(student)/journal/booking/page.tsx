"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useSlots } from "@/hooks/firebase/useSlots";
import { useBookings } from "@/hooks/firebase/useBookings";
import { createBooking } from "@/lib/firebase/helpers";
import type { Slot, Booking } from "@/lib/firebase/types";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: "Chờ xác nhận", color: "rgba(245,158,11,0.15)"  },
  approved: { label: "Đã xác nhận",  color: "rgba(16,185,129,0.15)"  },
  declined: { label: "Đã từ chối",   color: "rgba(239,68,68,0.12)"   },
};

const STATUS_TEXT: Record<string, string> = {
  pending:  "var(--text-secondary)",
  approved: "rgb(5,150,105)",
  declined: "rgb(220,38,38)",
};

function BookingItem({ booking }: { booking: Booking }) {
  const st = STATUS_LABEL[booking.status] ?? STATUS_LABEL.pending;
  const date = new Date(booking.date).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="rounded-xl p-4 border flex items-center justify-between gap-4"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div>
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
          {date} · {booking.time}
        </p>
        {booking.note && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {booking.note}
          </p>
        )}
      </div>
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
        style={{
          background: st.color,
          color: STATUS_TEXT[booking.status] ?? "var(--text-secondary)",
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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isPast = slot.date < new Date().toISOString().slice(0, 10);

  async function handleBook() {
    setLoading(true);
    try {
      await onBook(slot, note);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (isPast) return null;

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: booked || done ? "rgba(16,185,129,0.4)" : "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
            {date}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--accent-primary)" }}>
            🕐 {slot.time}
          </p>
          {slot.note && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {slot.note}
            </p>
          )}
        </div>

        {booked || done ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "rgba(16,185,129,0.15)", color: "rgb(5,150,105)" }}
          >
            ✓ Đã đặt
          </span>
        ) : (
          <div className="flex flex-col gap-2 items-end">
            <input
              type="text"
              placeholder="Ghi chú (không bắt buộc)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border outline-none w-44"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={handleBook}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity"
              style={{
                background: "var(--accent-primary)",
                color: "#fff",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Đang đặt..." : "Đặt lịch"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { slots, loading: slotsLoading } = useSlots();
  const { bookings, loading: bookingsLoading } = useBookings({
    studentId: profile?.id,
  });

  const loading = profileLoading || slotsLoading || bookingsLoading;

  const bookedSlotIds = new Set(bookings.map((b) => b.slotId));

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  const upcomingSlots = slots.filter(
    (s) => s.date >= new Date().toISOString().slice(0, 10)
  );

  const myBookings = [...bookings].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        📅 Lịch học
      </h1>

      {/* My bookings */}
      {myBookings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Lịch đã đặt
          </h2>
          {myBookings.map((b) => (
            <BookingItem key={b.id || b.createdAt} booking={b} />
          ))}
        </section>
      )}

      {/* Available slots */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Khung giờ trống
        </h2>
        {upcomingSlots.length === 0 ? (
          <div
            className="rounded-xl p-8 border text-center"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div className="text-4xl mb-3">📅</div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Chưa có khung giờ trống
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Giáo viên sẽ mở lịch sớm.
            </p>
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
    </div>
  );
}
