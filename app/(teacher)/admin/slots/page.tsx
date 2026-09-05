"use client";

import { useMemo, useState } from "react";
import { useSlots } from "@/hooks/firebase/useSlots";
import { useBookings } from "@/hooks/firebase/useBookings";
import { createSlotsBulk, deleteSlot, deleteSlots, syncSlotTaken } from "@/lib/firebase/helpers";
import { useToast } from "@/components/shared/Toast";
import type { Slot } from "@/lib/firebase/types";

// ─── Hằng số ─────────────────────────────────────────────────────────────────

/** Thứ trong tuần, xếp T2 → CN; `idx` là giá trị `Date.getDay()`. */
const WEEKDAYS = [
  { idx: 1, short: "T2" },
  { idx: 2, short: "T3" },
  { idx: 3, short: "T4" },
  { idx: 4, short: "T5" },
  { idx: 5, short: "T6" },
  { idx: 6, short: "T7" },
  { idx: 0, short: "CN" },
];

const DEFAULT_TIMES = [
  "09:00–10:00",
  "14:00–15:00",
  "17:00–18:00",
  "18:00–19:00",
  "19:00–20:00",
  "20:00–21:00",
];

const DURATIONS = [45, 60, 90, 120];
const MONTHS = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];

// ─── Tiện ích ngày giờ ───────────────────────────────────────────────────────
// Luôn dùng giờ ĐỊA PHƯƠNG. `toISOString().slice(0,10)` đổi sang UTC nên ở múi
// giờ +07 sẽ trả về ngày hôm trước trong khoảng 00:00–07:00.

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Thứ Hai của tuần chứa `d`. */
function mondayOf(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7));
}

function fmtShort(key: string): string {
  const d = fromKey(key);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtFull(key: string): string {
  return fromKey(key).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + mins) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Khoá sắp xếp của chuỗi giờ "19:00–20:00" → "19:00". */
function startOf(time: string): string {
  return time.split(/[–-]/)[0].trim();
}

/**
 * Ghi RTDB không tự bỏ cuộc: khi mất kết nối, promise của `set/update` treo vô
 * hạn — đó là lý do nút "Tạo khung giờ" kẹt ở trạng thái "Đang lưu...".
 */
function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Quá thời gian chờ — kiểm tra kết nối mạng rồi thử lại.")), ms)
    ),
  ]);
}

function errText(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/permission[_ ]denied/i.test(msg)) {
    return "Firebase từ chối quyền ghi. Tải lại trang để lấy lại quyền admin rồi thử lại.";
  }
  return msg;
}

// ─── Trang ───────────────────────────────────────────────────────────────────

export default function SlotsPage() {
  const { slots, loading } = useSlots();
  const { bookings } = useBookings();
  const { toast } = useToast();

  const today = toKey(new Date());

  // Bộ tạo
  const [mode, setMode] = useState<"weekly" | "picker">("weekly");
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set());
  const [weeks, setWeeks] = useState(4);
  const [startDate, setStartDate] = useState(today);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [times, setTimes] = useState<Set<string>>(new Set());
  const [customTimes, setCustomTimes] = useState<string[]>([]);
  const [customStart, setCustomStart] = useState("19:00");
  const [customDur, setCustomDur] = useState(60);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Danh sách
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const upcoming = useMemo(() => slots.filter((s) => s.date >= today), [slots, today]);
  const past = useMemo(() => slots.filter((s) => s.date < today), [slots, today]);

  /** slotId → số lượt đặt còn hiệu lực (không tính lượt đã từ chối). */
  const bookedCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      if (!b.slotId || b.status === "declined") continue;
      map.set(b.slotId, (map.get(b.slotId) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  /**
   * Cờ `slot.taken` là thứ DUY NHẤT học viên đọc được để biết khung giờ còn
   * trống hay không (rules chặn HV đọc booking của người khác). Booking tạo
   * trước khi có tính năng này — hoặc bị xoá thẳng trên Firebase Console — sẽ
   * làm cờ lệch với thực tế, nên đối chiếu lại và cho admin sửa bằng một nút.
   */
  const drift = useMemo(() => {
    const held = new Set(
      bookings.filter((b) => b.slotId && b.status !== "declined").map((b) => b.slotId)
    );
    const fix: Record<string, boolean | null> = {};
    for (const s of slots) {
      const shouldBeTaken = held.has(s.id);
      if (shouldBeTaken !== (s.taken === true)) fix[`${s.id}/taken`] = shouldBeTaken ? true : null;
    }
    return fix;
  }, [slots, bookings]);

  const driftCount = Object.keys(drift).length;

  async function handleSync() {
    if (driftCount === 0 || syncing) return;
    setSyncing(true);
    try {
      await withTimeout(syncSlotTaken(drift));
      toast(`Đã đồng bộ ${driftCount} khung giờ`, { variant: "success" });
    } catch (err) {
      toast(errText(err), { variant: "error", duration: 6000 });
    } finally {
      setSyncing(false);
    }
  }

  // Chip giờ = mặc định + giờ đã dùng trong dữ liệu + giờ admin tự thêm
  const timeChips = useMemo(() => {
    const freq = new Map<string, number>();
    for (const s of slots) freq.set(s.time, (freq.get(s.time) ?? 0) + 1);
    const used = [...freq.entries()]
      .filter(([t]) => !DEFAULT_TIMES.includes(t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([t]) => t);
    return [...new Set([...DEFAULT_TIMES, ...used, ...customTimes])].sort((a, b) =>
      startOf(a).localeCompare(startOf(b))
    );
  }, [slots, customTimes]);

  // Ngày đích theo chế độ đang chọn
  const targetDates = useMemo(() => {
    if (mode === "picker") return [...picked].sort();
    if (weekdays.size === 0) return [];
    const base = mondayOf(fromKey(startDate));
    const out: string[] = [];
    for (let w = 0; w < weeks; w++) {
      for (const wd of weekdays) {
        const key = toKey(addDays(base, w * 7 + ((wd + 6) % 7)));
        if (key >= startDate) out.push(key);
      }
    }
    return [...new Set(out)].sort();
  }, [mode, picked, weekdays, weeks, startDate]);

  // Xem trước: nhân chéo ngày × giờ, đánh dấu cái đã tồn tại
  const preview = useMemo(() => {
    const existing = new Set(slots.map((s) => `${s.date}|${s.time}`));
    const sortedTimes = [...times].sort((a, b) => startOf(a).localeCompare(startOf(b)));
    return targetDates.flatMap((date) =>
      sortedTimes.map((time) => ({ date, time, dup: existing.has(`${date}|${time}`) }))
    );
  }, [targetDates, times, slots]);

  const toCreate = preview.filter((p) => !p.dup);
  const dupCount = preview.length - toCreate.length;

  // ─── Hành động ─────────────────────────────────────────────────────────────

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function handleAddCustomTime() {
    const label = `${customStart}–${addMinutes(customStart, customDur)}`;
    if (!timeChips.includes(label)) setCustomTimes((c) => [...c, label]);
    setTimes((t) => new Set(t).add(label));
  }

  async function handleCreate() {
    if (toCreate.length === 0 || saving) return;
    setSaving(true);
    try {
      await withTimeout(
        createSlotsBulk(
          toCreate.map((p) => ({ date: p.date, time: p.time, note: note.trim() || undefined }))
        )
      );
      toast(
        `Đã tạo ${toCreate.length} khung giờ${dupCount > 0 ? ` · bỏ qua ${dupCount} trùng` : ""}`,
        { variant: "success" }
      );
      setPicked(new Set());
      setWeekdays(new Set());
    } catch (err) {
      toast(errText(err), { variant: "error", duration: 6000 });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOne(slot: Slot) {
    const booked = bookedCount.get(slot.id) ?? 0;
    const warn = booked > 0 ? `\n⚠️ Khung giờ này đã có ${booked} lượt đặt.` : "";
    if (!confirm(`Xóa khung giờ ${fmtShort(slot.date)} ${slot.time}?${warn}`)) return;
    setBusy(true);
    try {
      await withTimeout(deleteSlot(slot.id));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(slot.id);
        return next;
      });
    } catch (err) {
      toast(errText(err), { variant: "error", duration: 6000 });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSelected() {
    const ids = [...selected];
    if (ids.length === 0 || busy) return;
    const bookedIds = ids.filter((id) => (bookedCount.get(id) ?? 0) > 0);
    const warn = bookedIds.length > 0 ? `\n⚠️ Trong đó ${bookedIds.length} khung đã có người đặt.` : "";
    if (!confirm(`Xóa ${ids.length} khung giờ đã chọn?${warn}`)) return;
    setBusy(true);
    try {
      await withTimeout(deleteSlots(ids));
      toast(`Đã xóa ${ids.length} khung giờ`, { variant: "success" });
      setSelected(new Set());
    } catch (err) {
      toast(errText(err), { variant: "error", duration: 6000 });
    } finally {
      setBusy(false);
    }
  }

  // ─── Nhóm theo tuần ────────────────────────────────────────────────────────

  const weekGroups = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of upcoming) {
      const key = toKey(mondayOf(fromKey(s.date)));
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    const thisMon = toKey(mondayOf(new Date()));
    const nextMon = toKey(addDays(mondayOf(new Date()), 7));
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mon, list]) => ({
        mon,
        label: mon === thisMon ? "Tuần này" : mon === nextMon ? "Tuần sau" : "Tuần",
        range: `${fmtShort(mon)} – ${fmtShort(toKey(addDays(fromKey(mon), 6)))}`,
        list: list.sort(
          (a, b) => a.date.localeCompare(b.date) || startOf(a.time).localeCompare(startOf(b.time))
        ),
      }));
  }, [upcoming]);

  // ─── Lưới lịch tháng ───────────────────────────────────────────────────────

  const calendarCells = useMemo(() => {
    const first = mondayOf(viewMonth);
    return [...Array(42)].map((_, i) => {
      const d = addDays(first, i);
      return { key: toKey(d), day: d.getDate(), inMonth: d.getMonth() === viewMonth.getMonth() };
    });
  }, [viewMonth]);

  // ─── UI ────────────────────────────────────────────────────────────────────

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.4rem 0.7rem",
    borderRadius: 8,
    fontSize: "0.78rem",
    fontWeight: 600,
    border: "1px solid",
    borderColor: active ? "var(--accent-primary)" : "var(--border)",
    background: active ? "var(--accent-primary)" : "var(--bg-primary)",
    color: active ? "#fff" : "var(--text-secondary)",
    cursor: "pointer",
    transition: "all .12s",
  });

  const fieldStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  function SlotRow({ slot }: { slot: Slot }) {
    const booked = bookedCount.get(slot.id) ?? 0;
    const checked = selected.has(slot.id);

    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
        style={{
          background: "var(--bg-elevated)",
          borderColor: checked ? "var(--accent-primary)" : "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setSelected((s) => toggle(s, slot.id))}
          aria-label={`Chọn khung giờ ${fmtShort(slot.date)} ${slot.time}`}
          className="w-4 h-4 shrink-0 cursor-pointer"
          style={{ accentColor: "var(--accent-primary)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {fmtFull(slot.date)}
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
        {booked > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-lg shrink-0"
            style={{ background: "rgba(34,197,94,0.12)", color: "rgb(21,128,61)" }}
          >
            {booked} đặt
          </span>
        )}
        <button
          onClick={() => handleDeleteOne(slot)}
          disabled={busy}
          className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors shrink-0"
          style={{
            borderColor: "rgba(239,68,68,0.3)",
            color: "rgb(220,38,38)",
            background: "rgba(239,68,68,0.06)",
            opacity: busy ? 0.5 : 1,
          }}
        >
          Xóa
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        ⏰ Khung giờ
      </h1>

      {/* ── Cảnh báo lệch cờ giữ chỗ ── */}
      {driftCount > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 border"
          style={{ background: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.35)" }}
        >
          <span className="text-sm flex-1 min-w-[220px]" style={{ color: "var(--text-primary)" }}>
            ⚠️ {driftCount} khung giờ đang hiển thị sai trạng thái còn trống với học viên.
          </span>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "var(--accent-primary)", color: "#fff", opacity: syncing ? 0.5 : 1 }}
          >
            {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
          </button>
        </div>
      )}

      {/* ── Bộ tạo khung giờ ── */}
      <section
        className="rounded-xl p-5 border space-y-5"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold mr-2" style={{ color: "var(--text-secondary)" }}>
            ➕ Tạo khung giờ
          </h2>
          {(
            [
              ["weekly", "Lặp theo thứ"],
              ["picker", "Chọn ngày"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={chipStyle(mode === m)}>
              {label}
            </button>
          ))}
        </div>

        {/* Bước 1 — ngày */}
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            1. Ngày
          </p>

          {mode === "weekly" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((w) => (
                  <button
                    key={w.idx}
                    type="button"
                    onClick={() => setWeekdays((s) => toggle(s, w.idx))}
                    style={{ ...chipStyle(weekdays.has(w.idx)), minWidth: 46 }}
                  >
                    {w.short}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                    Bắt đầu từ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value || today)}
                    className="px-3 py-2 rounded-lg text-sm border outline-none"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                    Lặp trong
                  </label>
                  <select
                    value={weeks}
                    onChange={(e) => setWeeks(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg text-sm border outline-none"
                    style={fieldStyle}
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} tuần
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2" style={{ maxWidth: 340 }}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                  className="px-2.5 py-1 rounded-lg text-sm border"
                  style={fieldStyle}
                >
                  ‹
                </button>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                  className="px-2.5 py-1 rounded-lg text-sm border"
                  style={fieldStyle}
                >
                  ›
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w) => (
                  <span key={w.idx} className="text-[0.68rem] py-1" style={{ color: "var(--text-muted)" }}>
                    {w.short}
                  </span>
                ))}
                {calendarCells.map((c) => {
                  const isPast = c.key < today;
                  const active = picked.has(c.key);
                  return (
                    <button
                      key={c.key}
                      type="button"
                      disabled={isPast}
                      onClick={() => setPicked((s) => toggle(s, c.key))}
                      className="py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        border: "1px solid",
                        borderColor: active ? "var(--accent-primary)" : "transparent",
                        background: active ? "var(--accent-primary)" : "transparent",
                        color: active
                          ? "#fff"
                          : isPast || !c.inMonth
                            ? "var(--text-muted)"
                            : "var(--text-primary)",
                        opacity: isPast ? 0.35 : c.inMonth ? 1 : 0.5,
                        cursor: isPast ? "not-allowed" : "pointer",
                      }}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
              {picked.size > 0 && (
                <button
                  type="button"
                  onClick={() => setPicked(new Set())}
                  className="text-xs underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  Bỏ chọn {picked.size} ngày
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bước 2 — giờ */}
        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            2. Khung giờ (chọn được nhiều)
          </p>
          <div className="flex flex-wrap gap-2">
            {timeChips.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimes((s) => toggle(s, t))}
                style={chipStyle(times.has(t))}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm border outline-none"
                style={fieldStyle}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
                Thời lượng
              </label>
              <select
                value={customDur}
                onChange={(e) => setCustomDur(Number(e.target.value))}
                className="px-3 py-2 rounded-lg text-sm border outline-none"
                style={fieldStyle}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} phút
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddCustomTime}
              disabled={!customStart}
              className="px-3 py-2 rounded-lg text-sm border"
              style={fieldStyle}
            >
              + Thêm giờ khác
            </button>
          </div>
        </div>

        {/* Bước 3 — ghi chú */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>
            3. Ghi chú (áp dụng cho tất cả)
          </label>
          <input
            type="text"
            placeholder="Online / Offline..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 rounded-lg text-sm border outline-none"
            style={fieldStyle}
          />
        </div>

        {/* Xem trước */}
        <div
          className="rounded-lg p-3 border space-y-2"
          style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Xem trước:{" "}
            {preview.length === 0
              ? "chọn ngày và khung giờ để xem"
              : `sẽ tạo ${toCreate.length} khung giờ${dupCount > 0 ? ` · bỏ qua ${dupCount} trùng` : ""}`}
          </p>
          {preview.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
              {preview.slice(0, 60).map((p) => (
                <span
                  key={`${p.date}|${p.time}`}
                  className="text-[0.7rem] px-2 py-1 rounded-md border"
                  style={{
                    borderColor: "var(--border)",
                    color: p.dup ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: p.dup ? "line-through" : "none",
                    opacity: p.dup ? 0.6 : 1,
                  }}
                  title={p.dup ? "Đã tồn tại — sẽ bỏ qua" : undefined}
                >
                  {fmtShort(p.date)} · {p.time}
                </span>
              ))}
              {preview.length > 60 && (
                <span className="text-[0.7rem] px-2 py-1" style={{ color: "var(--text-muted)" }}>
                  … +{preview.length - 60} nữa
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || toCreate.length === 0}
          className="text-sm font-semibold px-4 py-2.5 rounded-lg transition-opacity"
          style={{
            background: "var(--accent-primary)",
            color: "#fff",
            opacity: saving || toCreate.length === 0 ? 0.5 : 1,
            cursor: saving || toCreate.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Đang lưu..." : `Tạo ${toCreate.length || ""} khung giờ`.replace("  ", " ")}
        </button>
      </section>

      {/* ── Danh sách ── */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Sắp tới ({upcoming.length})
            </h2>
            {weekGroups.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Chưa có khung giờ nào.
              </p>
            ) : (
              weekGroups.map((g) => {
                const ids = g.list.map((s) => s.id);
                const allChecked = ids.every((id) => selected.has(id));
                return (
                  <div key={g.mon} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {g.label} · {g.range}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        ({g.list.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelected((s) => {
                            const next = new Set(s);
                            for (const id of ids) {
                              if (allChecked) next.delete(id);
                              else next.add(id);
                            }
                            return next;
                          })
                        }
                        className="text-xs underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {allChecked ? "Bỏ chọn tuần" : "Chọn cả tuần"}
                      </button>
                    </div>
                    {g.list.map((s) => (
                      <SlotRow key={s.id} slot={s} />
                    ))}
                  </div>
                );
              })
            )}
          </section>

          {past.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                Đã qua ({past.length})
              </h2>
              <div className="opacity-50 space-y-2">
                {past
                  .slice(-5)
                  .reverse()
                  .map((s) => (
                    <SlotRow key={s.id} slot={s} />
                  ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Thanh xóa hàng loạt ── */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            Đã chọn {selected.size}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs px-3 py-2 rounded-lg border"
            style={fieldStyle}
          >
            Bỏ chọn
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={busy}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ background: "rgb(220,38,38)", color: "#fff", opacity: busy ? 0.5 : 1 }}
          >
            {busy ? "Đang xóa..." : "Xóa đã chọn"}
          </button>
        </div>
      )}
    </div>
  );
}
