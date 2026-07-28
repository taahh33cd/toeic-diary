"use client";

import { useState } from "react";
import Link from "next/link";
import { useClasses } from "@/hooks/firebase/useClasses";
import { createClass } from "@/lib/firebase/helpers";
import type { ClassSession } from "@/lib/firebase/types";

// Lưu tên ngày tiếng Anh cho khớp form sửa lớp / sửa HV (dữ liệu cũ dạng "Thứ 2" hay "0".."6" vẫn đọc được qua dayToNum)
const DAYS = [
  { value: "Monday",    label: "Thứ 2" },
  { value: "Tuesday",   label: "Thứ 3" },
  { value: "Wednesday", label: "Thứ 4" },
  { value: "Thursday",  label: "Thứ 5" },
  { value: "Friday",    label: "Thứ 6" },
  { value: "Saturday",  label: "Thứ 7" },
  { value: "Sunday",    label: "CN" },
];
const DAY_LABEL: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.value, d.label]));

function AddClassModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addSession() {
    setSessions((prev) => [...prev, { day: "Monday", time: "08:00" }]);
  }

  function removeSession(i: number) {
    setSessions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSession(i: number, field: keyof ClassSession, value: string) {
    setSessions((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Tên lớp không được để trống."); return; }
    setSaving(true);
    setError("");
    try {
      const id = await createClass({
        name: name.trim(),
        desc: desc.trim() || undefined,
        weeklySchedule: sessions.length > 0 ? sessions : undefined,
      });
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            Thêm lớp học mới
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              Tên lớp <span style={{ color: "var(--accent-primary)" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Lớp TOEIC cơ bản A"
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                outline: "none",
              }}
              required
            />
          </div>

          {/* Desc */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
              Mô tả (tuỳ chọn)
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="VD: Khoá học buổi tối, 3 tháng"
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* Weekly schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Lịch học hàng tuần
              </label>
              <button
                type="button"
                onClick={addSession}
                className="text-xs px-2 py-1 rounded-lg font-semibold"
                style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)", border: "none", cursor: "pointer" }}
              >
                + Thêm buổi
              </button>
            </div>
            {sessions.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Chưa có buổi học nào.</p>
            )}
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={s.day}
                    onChange={(e) => updateSession(i, "day", e.target.value)}
                    className="rounded-lg px-2 py-1.5 text-xs border flex-1"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  >
                    {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  <input
                    type="time"
                    value={s.time}
                    onChange={(e) => updateSession(i, "time", e.target.value)}
                    className="rounded-lg px-2 py-1.5 text-xs border"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)", width: "90px" }}
                  />
                  <input
                    type="text"
                    value={s.room ?? ""}
                    onChange={(e) => updateSession(i, "room", e.target.value)}
                    placeholder="Phòng"
                    className="rounded-lg px-2 py-1.5 text-xs border flex-1"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSession(i)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "16px", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(180,60,40,0.07)", color: "#A03020" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-2 text-sm font-semibold border"
              style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl py-2 text-sm font-bold"
              style={{
                background: saving ? "var(--border)" : "var(--accent-primary)",
                color: "#fff",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Đang tạo…" : "Tạo lớp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const { classes, loading } = useClasses();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          🏫 Lớp học
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{
            background: "var(--accent-primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          + Thêm lớp
        </button>
      </div>

      {classes.length === 0 ? (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">🏫</div>
          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
            Chưa có lớp học
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Nhấn &ldquo;+ Thêm lớp&rdquo; để tạo lớp học đầu tiên.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/admin/classes/${cls.id}`}
              className="block rounded-xl p-4 border hover:opacity-80 transition-opacity"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {cls.name}
                  </p>
                  {cls.desc && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {cls.desc}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    👥 {cls.members?.length ?? 0} học viên
                  </p>
                  {cls.weeklySchedule && cls.weeklySchedule.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {cls.weeklySchedule.map((session, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(196,98,45,0.08)",
                            color: "var(--accent-primary)",
                          }}
                        >
                          {DAY_LABEL[session.day] ?? session.day} · {session.time}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <AddClassModal
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
