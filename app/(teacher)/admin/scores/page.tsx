"use client";

import { useState } from "react";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useStudent } from "@/hooks/firebase/useStudent";
import { pushStudentScore, deleteStudentScore } from "@/lib/firebase/helpers";
import type { ToeicScore } from "@/lib/firebase/types";

const EMPTY_FORM: Omit<ToeicScore, "score" | "date"> & { score: string; date: string } = {
  score: "",
  date: new Date().toISOString().slice(0, 10),
  testname: "",
  note: "",
};

function StudentScores({ code }: { code: string }) {
  const { student, loading } = useStudent(code);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const scores = student?.scores
    ? [...student.scores].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const score = Number(form.score);
    if (!score || !form.date) return;
    setSaving(true);
    await pushStudentScore(code, {
      score,
      date: form.date,
      testname: form.testname || undefined,
      note: form.note || undefined,
    });
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  async function handleDelete(index: number) {
    if (!confirm("Xóa điểm thi này?")) return;
    await deleteStudentScore(code, index);
  }

  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl" style={{ background: "var(--border)" }} />;
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="rounded-xl p-4 border space-y-3"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Thêm điểm thi
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Điểm *</label>
            <input
              type="number"
              min={10} max={990} step={5}
              required
              placeholder="750"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Ngày *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Tên đề thi</label>
            <input
              type="text"
              placeholder="ETS 2024 Test 1"
              value={form.testname}
              onChange={(e) => setForm((f) => ({ ...f, testname: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Ghi chú</label>
            <input
              type="text"
              placeholder="..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="text-sm font-semibold px-4 py-2.5 min-h-[44px] rounded-lg"
          style={{ background: "var(--accent-primary)", color: "#fff", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Đang lưu..." : "➕ Thêm"}
        </button>
      </form>

      {/* Scores list */}
      {scores.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          Chưa có điểm thi.
        </p>
      ) : (
        <div className="space-y-2">
          {scores.map((s, i) => (
            <div
              key={`${s.date}-${i}`}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <div>
                <span className="font-bold text-lg" style={{ color: "var(--accent-primary)" }}>
                  {s.score}
                </span>
                <span className="text-xs ml-3" style={{ color: "var(--text-muted)" }}>
                  {new Date(s.date).toLocaleDateString("vi-VN")}
                  {s.testname && ` · ${s.testname}`}
                  {s.note && ` · ${s.note}`}
                </span>
              </div>
              <button
                onClick={() => handleDelete(scores.length - 1 - i)}
                className="text-xs px-3 py-2 min-h-[44px] rounded-lg border"
                style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgb(220,38,38)" }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScoresAdminPage() {
  const { students, loading } = useAllStudents();
  const [selectedCode, setSelectedCode] = useState<string>("");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        🎯 Điểm số
      </h1>

      {/* Student picker */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
          Chọn học viên
        </label>
        {loading ? (
          <div className="h-10 w-64 rounded-lg animate-pulse" style={{ background: "var(--border)" }} />
        ) : (
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border outline-none w-full max-w-xs"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">-- Chọn học viên --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCode ? (
        <StudentScores key={selectedCode} code={selectedCode} />
      ) : (
        <div
          className="rounded-xl p-8 border text-center"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-3">🎯</div>
          <p style={{ color: "var(--text-secondary)" }}>
            Chọn học viên để xem và thêm điểm.
          </p>
        </div>
      )}
    </div>
  );
}
