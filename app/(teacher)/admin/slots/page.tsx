"use client";

import { useState } from "react";
import { useSlots } from "@/hooks/firebase/useSlots";
import { createSlot, deleteSlot } from "@/lib/firebase/helpers";

export default function SlotsPage() {
  const { slots, loading } = useSlots();
  const [form, setForm] = useState({ date: "", time: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = slots.filter((s) => s.date >= today);
  const past = slots.filter((s) => s.date < today);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.time) return;
    setSaving(true);
    await createSlot({ date: form.date, time: form.time, note: form.note || undefined });
    setForm({ date: "", time: "", note: "" });
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteSlot(id);
    setDeleting(null);
  }

  function SlotRow({ slot }: { slot: typeof slots[0] }) {
    const date = new Date(slot.date).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {date}
          </p>
          <p className="text-sm" style={{ color: "var(--accent-primary)" }}>
            🕐 {slot.time}
            {slot.note && (
              <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                · {slot.note}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => handleDelete(slot.id)}
          disabled={deleting === slot.id}
          className="text-xs px-2.5 py-1.5 min-h-[44px] rounded-lg border transition-colors"
          style={{
            borderColor: "rgba(239,68,68,0.3)",
            color: "rgb(220,38,38)",
            background: "rgba(239,68,68,0.06)",
            opacity: deleting === slot.id ? 0.5 : 1,
          }}
        >
          {deleting === slot.id ? "..." : "Xóa"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        ⏰ Khung giờ
      </h1>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl p-5 border space-y-4"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          ➕ Thêm khung giờ mới
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Ngày *
            </label>
            <input
              type="date"
              required
              value={form.date}
              min={today}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Giờ * (VD: 19:00–20:00)
            </label>
            <input
              type="text"
              required
              placeholder="19:00–20:00"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Ghi chú
            </label>
            <input
              type="text"
              placeholder="Online / Offline..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !form.date || !form.time}
          className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity"
          style={{
            background: "var(--accent-primary)",
            color: "#fff",
            opacity: saving || !form.date || !form.time ? 0.5 : 1,
          }}
        >
          {saving ? "Đang lưu..." : "Tạo khung giờ"}
        </button>
      </form>

      {/* Upcoming slots */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Sắp tới ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chưa có khung giờ nào.</p>
            ) : (
              upcoming.map((s) => <SlotRow key={s.id} slot={s} />)
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                Đã qua ({past.length})
              </h2>
              <div className="opacity-50 space-y-2">
                {past.slice(0, 5).map((s) => <SlotRow key={s.id} slot={s} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
