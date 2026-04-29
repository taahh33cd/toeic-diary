"use client";

import { useState } from "react";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { setStudentFrozen, setStudentNote } from "@/lib/firebase/helpers";

// ─── Invite Modal ────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!email.trim()) { setError("Vui lòng nhập email học viên."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), studentCode: studentCode.trim() || undefined }),
      });
      const json = await res.json() as { inviteUrl?: string; error?: string };
      if (!res.ok) { setError(json.error ?? "Tạo lời mời thất bại."); return; }
      setInviteUrl(json.inviteUrl ?? null);
    } catch {
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            📨 Mời học viên
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {!inviteUrl ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Email học viên *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hocvien@email.com"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>
                  Mã học viên Firebase <span style={{ color: "var(--text-muted)" }}>(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="Ví dụ: HV001"
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Điền để tự động liên kết dữ liệu Firebase khi học viên chấp nhận.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "rgb(220,38,38)" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "var(--accent-primary)" }}
              >
                {loading ? "Đang tạo..." : "Tạo link mời"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <p className="text-xs font-medium" style={{ color: "rgb(5,150,105)" }}>
                ✅ Link mời đã được tạo — hiệu lực 7 ngày
              </p>
              <div
                className="rounded-lg px-3 py-2 text-xs font-mono break-all"
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              >
                {inviteUrl}
              </div>
              <button
                onClick={handleCopy}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: copied ? "rgba(16,185,129,0.15)" : "var(--accent-primary)",
                  color: copied ? "rgb(5,150,105)" : "#fff",
                }}
              >
                {copied ? "✓ Đã sao chép!" : "📋 Sao chép link"}
              </button>
            </div>

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Gửi link này cho học viên qua email hoặc tin nhắn.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setInviteUrl(null); setEmail(""); setStudentCode(""); }}
                className="px-4 py-2 rounded-xl text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Tạo link khác
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--accent-primary)" }}
              >
                Xong
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { students, loading } = useAllStudents();
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteVal, setNoteVal] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const filtered = students.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.id?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleFreeze(code: string, frozen: boolean) {
    await setStudentFrozen(code, frozen);
  }

  async function handleSaveNote(code: string) {
    await setStudentNote(code, noteVal);
    setEditingNote(null);
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              👥 Học viên
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {students.length} học viên
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <input
              type="search"
              placeholder="Tìm theo tên hoặc mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border outline-none w-48"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={() => setShowInvite(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              style={{ background: "var(--accent-primary)" }}
            >
              📨 Mời học viên
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-8 border text-center"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div className="text-4xl mb-3">👥</div>
            <p style={{ color: "var(--text-secondary)" }}>
              {search ? "Không tìm thấy học viên." : "Chưa có học viên nào."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((student) => {
              const latestScore = student.scores
                ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))[0]
                : null;

              return (
                <div
                  key={student.id}
                  className="rounded-xl p-4 border"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: student.frozen ? "rgba(239,68,68,0.3)" : "var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    opacity: student.frozen ? 0.75 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {student.name}
                        </span>
                        <code
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--border)", color: "var(--text-muted)" }}
                        >
                          {student.id}
                        </code>
                        {student.frozen && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(239,68,68,0.12)", color: "rgb(220,38,38)" }}
                          >
                            ❄️ Frozen
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>Tuần {student.currentWeek ?? "—"}</span>
                        {latestScore && (
                          <span style={{ color: "var(--accent-primary)" }}>
                            🎯 {latestScore.score}
                          </span>
                        )}
                        {student.homework?.length && (
                          <span>📝 {student.homework.length} bài</span>
                        )}
                      </div>

                      {/* Note */}
                      {editingNote === student.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={noteVal}
                            onChange={(e) => setNoteVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNote(student.id);
                              if (e.key === "Escape") setEditingNote(null);
                            }}
                            className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
                            style={{
                              background: "var(--bg-primary)",
                              borderColor: "var(--accent-primary)",
                              color: "var(--text-primary)",
                            }}
                            placeholder="Nhập ghi chú..."
                          />
                          <button
                            onClick={() => handleSaveNote(student.id)}
                            className="text-xs px-3 py-1.5 min-h-[44px] rounded-lg font-medium"
                            style={{ background: "var(--accent-primary)", color: "#fff" }}
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="text-xs px-2 py-1.5 min-h-[44px] rounded-lg"
                            style={{ background: "var(--border)", color: "var(--text-secondary)" }}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : student.note ? (
                        <p
                          className="mt-1.5 text-xs cursor-pointer hover:underline"
                          style={{ color: "var(--text-muted)" }}
                          onClick={() => {
                            setNoteVal(student.note ?? "");
                            setEditingNote(student.id);
                          }}
                        >
                          📌 {student.note}
                        </p>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap shrink-0">
                      <button
                        onClick={() => {
                          setNoteVal(student.note ?? "");
                          setEditingNote(student.id);
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)",
                          background: "var(--bg-primary)",
                        }}
                      >
                        ✏️ Ghi chú
                      </button>
                      <button
                        onClick={() => handleFreeze(student.id, !student.frozen)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                        style={{
                          borderColor: student.frozen ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)",
                          color: student.frozen ? "rgb(5,150,105)" : "rgb(220,38,38)",
                          background: student.frozen
                            ? "rgba(16,185,129,0.06)"
                            : "rgba(239,68,68,0.06)",
                        }}
                      >
                        {student.frozen ? "✓ Unfreeze" : "❄️ Freeze"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
