"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Plus, Trash2, ChevronDown, ChevronUp, ImageDown } from "lucide-react";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { useDayLinks } from "@/hooks/firebase/useDayLinks";
import { useHwViewed } from "@/hooks/firebase/useHwViewed";
import { useHwFiles } from "@/hooks/firebase/useHwFiles";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import HomeworkEditor from "@/components/admin/homework/HomeworkEditor";
import { assignHomeworkDecks, useAutoDoneOnMount } from "@/lib/homework/client";
import { HwExportModal } from "@/components/admin/HwExportModal";
import { ZoomableImage } from "@/components/admin/ZoomableImage";
import {
  updateStudent,
  deleteStudent,
  pushStudentScore,
  updateStudentScore,
  deleteStudentScore,
  addModule,
  updateModuleStatus,
  deleteModule,
  addScheduleItem,
  deleteScheduleItem,
  pushHomework,
  updateHomework,
  deleteHomework,
  pushClassHomework,
  markHwViewed,
  saveHwFileNote,
  deleteHwFile,
} from "@/lib/firebase/helpers";
import { calcEtsScore } from "@/lib/ets-scale";
import { StudentHeader } from "./_header";
import { StudentGoalPanel } from "./_goal-panel";
import { MessageSection } from "./_message";
import type { StudentOverview } from "@/app/api/admin/students/[code]/overview/route";
import { overdueHomework, shiftDay } from "@/lib/journal/homework";
import type {
  Student,
  ToeicScore,
  StudentModule,
  ScheduleItem,
  ClassSession,
  Homework,
  HwItem,
  HwFilesMap,
  HwViewedMap,
} from "@/lib/firebase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ title, action, children }: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder = "" }: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
      style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
    />
  );
}

// ─── 2. InternalNote ──────────────────────────────────────────────────────────

function InternalNoteSection({ student, code }: { student: Student; code: string }) {
  const [note, setNote] = useState(student.note ?? "");
  const [saving, setSaving] = useState(false);
  const debouncedNote = useDebounce(note, 1000);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) { setInitialized(true); return; }
    let cancelled = false;
    setSaving(true);
    updateStudent(code, { note: debouncedNote }).then(() => {
      if (!cancelled) setSaving(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNote]);

  return (
    <SectionCard
      title="🔒 Ghi chú nội bộ"
      action={
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {saving ? "Đang lưu..." : "(chỉ giáo viên thấy)"}
        </span>
      }
    >
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Ghi chú riêng về học viên này..."
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
    </SectionCard>
  );
}

// ─── 5. TOEIC Scores ─────────────────────────────────────────────────────────

const PARTS = [
  { key: "p1" as const, label: "P1", max: 6 },
  { key: "p2" as const, label: "P2", max: 25 },
  { key: "p3" as const, label: "P3", max: 39 },
  { key: "p4" as const, label: "P4", max: 30 },
  { key: "p5" as const, label: "P5", max: 30 },
  { key: "p6" as const, label: "P6", max: 16 },
  { key: "p7" as const, label: "P7", max: 54 },
];

type PartKey = "p1" | "p2" | "p3" | "p4" | "p5" | "p6" | "p7";

// Form thêm/sửa điểm — khớp tính năng với trang journal (journal/scores)
function AdminScoreForm({ initial, onSubmit, onCancel, submitLabel }: {
  initial?: ToeicScore;
  onSubmit: (entry: ToeicScore) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const initialHasParts = initial ? PARTS.some((p) => (initial[p.key] ?? 0) > 0) : false;
  const [mode, setMode] = useState<"simple" | "parts">(initialHasParts ? "parts" : "simple");
  const [date, setDate] = useState(initial?.date ?? today());
  const [testname, setTestname] = useState(initial?.testname ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [listening, setListening] = useState(initial?.l !== undefined ? String(initial.l) : "");
  const [reading, setReading] = useState(initial?.r !== undefined ? String(initial.r) : "");
  const [parts, setParts] = useState<Record<PartKey, string>>(() => {
    const base: Record<PartKey, string> = { p1: "", p2: "", p3: "", p4: "", p5: "", p6: "", p7: "" };
    if (initial) for (const p of PARTS) if (initial[p.key] !== undefined) base[p.key] = String(initial[p.key]);
    return base;
  });
  const [saving, setSaving] = useState(false);

  const parsed = { p1: parseInt(parts.p1)||0, p2: parseInt(parts.p2)||0, p3: parseInt(parts.p3)||0, p4: parseInt(parts.p4)||0, p5: parseInt(parts.p5)||0, p6: parseInt(parts.p6)||0, p7: parseInt(parts.p7)||0 };
  const lCorrect = parsed.p1 + parsed.p2 + parsed.p3 + parsed.p4;
  const rCorrect = parsed.p5 + parsed.p6 + parsed.p7;
  const calc = calcEtsScore(parsed.p1, parsed.p2, parsed.p3, parsed.p4, parsed.p5, parsed.p6, parsed.p7);

  const [manualOverride, setManualOverride] = useState(
    () => initialHasParts && (initial?.l !== calc.ls || initial?.r !== calc.rd)
  );
  const [manualL, setManualL] = useState(String(initial?.l ?? calc.ls));
  const [manualR, setManualR] = useState(String(initial?.r ?? calc.rd));

  const lScore = manualOverride ? (parseInt(manualL, 10) || 0) : calc.ls;
  const rScore = manualOverride ? (parseInt(manualR, 10) || 0) : calc.rd;
  const simpleTotal = listening && reading ? (parseInt(listening, 10) || 0) + (parseInt(reading, 10) || 0) : null;

  async function handleSubmit() {
    if (!date) return;
    setSaving(true);
    try {
      let entry: ToeicScore;
      if (mode === "simple") {
        const l = parseInt(listening, 10) || 0, r = parseInt(reading, 10) || 0;
        if (l < 0 || r < 0 || l > 495 || r > 495) { setSaving(false); return; }
        entry = { score: l + r, date, l, r };
      } else {
        if (PARTS.some((p) => parsed[p.key] < 0 || parsed[p.key] > p.max)) { setSaving(false); return; }
        const filled = Object.fromEntries(
          PARTS.filter((p) => parsed[p.key] > 0).map((p) => [p.key, parsed[p.key]])
        ) as Partial<Record<PartKey, number>>;
        entry = { score: lScore + rScore, date, l: lScore, r: rScore, ...filled };
      }
      if (testname.trim()) entry.testname = testname.trim();
      if (note.trim()) entry.note = note.trim();
      await onSubmit(entry);
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg self-start w-fit" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {(["simple", "parts"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className="px-3 py-1 rounded-md text-xs font-semibold"
            style={{ background: mode === m ? "var(--accent-primary)" : "transparent", color: mode === m ? "#fff" : "var(--text-muted)" }}>
            {m === "simple" ? "Tổng điểm" : "Theo từng Part"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InputRow label="TÊN ĐỀ THI">
          <Input value={testname} onChange={setTestname} placeholder="EST 2026 Test 1" />
        </InputRow>
        <InputRow label="NGÀY THI">
          <Input value={date} onChange={setDate} type="date" />
        </InputRow>
      </div>

      {mode === "simple" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <InputRow label="ĐIỂM NGHE (0–495)">
              <Input value={listening} onChange={setListening} type="number" placeholder="300" />
            </InputRow>
            <InputRow label="ĐIỂM ĐỌC (0–495)">
              <Input value={reading} onChange={setReading} type="number" placeholder="280" />
            </InputRow>
          </div>
          {simpleTotal !== null && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tổng điểm: <span className="font-bold" style={{ color: "var(--accent-primary)" }}>{simpleTotal}</span>/990
            </p>
          )}
        </>
      ) : (
        <>
          {/* Part inputs */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>SỐ CÂU ĐÚNG TỪNG PART (bỏ trống nếu không có)</p>
            <div className="grid grid-cols-7 gap-1">
              {PARTS.map((p) => (
                <div key={p.key}>
                  <label className="text-[10px] font-medium block mb-0.5 text-center" style={{ color: "var(--text-muted)" }}>
                    {p.label}<br /><span className="text-[9px]">/{p.max}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={p.max}
                    value={parts[p.key]}
                    onChange={(e) => setParts((prev) => ({ ...prev, [p.key]: e.target.value }))}
                    className="w-full text-center text-xs px-1 py-1.5 rounded-lg border outline-none"
                    style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              Đúng L: <strong style={{ color: "var(--accent-primary)" }}>{lCorrect}/100</strong> · Đúng R: <strong style={{ color: "var(--accent-primary)" }}>{rCorrect}/100</strong>
            </p>
          </div>

          {/* Live preview (ETS) */}
          <div className="flex gap-3 text-sm font-bold text-center rounded-lg p-3" style={{ background: "rgba(196,98,45,0.08)" }}>
            <div className="flex-1">
              <div className="text-xs font-normal mb-0.5" style={{ color: "var(--text-muted)" }}>Listening</div>
              <div style={{ color: "var(--accent-primary)" }}>{lScore}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-normal mb-0.5" style={{ color: "var(--text-muted)" }}>Reading</div>
              <div style={{ color: "var(--accent-primary)" }}>{rScore}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-normal mb-0.5" style={{ color: "var(--text-muted)" }}>Tổng</div>
              <div className="text-lg" style={{ color: "var(--accent-primary)" }}>{lScore + rScore}</div>
            </div>
          </div>

          {/* Manual override */}
          <div className="rounded-lg p-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={manualOverride} onChange={(e) => setManualOverride(e.target.checked)} />
              Ghi đè điểm L/R thủ công
            </label>
            {manualOverride && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <InputRow label="ĐIỂM L (THỦ CÔNG)">
                  <Input value={manualL} onChange={setManualL} type="number" />
                </InputRow>
                <InputRow label="ĐIỂM R (THỦ CÔNG)">
                  <Input value={manualR} onChange={setManualR} type="number" />
                </InputRow>
              </div>
            )}
          </div>
        </>
      )}

      <InputRow label="GHI CHÚ">
        <Input value={note} onChange={setNote} placeholder="Tuỳ chọn..." />
      </InputRow>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          Hủy
        </button>
        <button onClick={handleSubmit} disabled={saving || !date} className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50" style={{ background: "var(--accent-primary)", color: "#fff" }}>
          {saving ? "Đang lưu..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

function ToeicScoresSection({ student, code }: { student: Student; code: string }) {
  const scores = [...(student.scores ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Display list (giảm dần) → tìm index thật trong mảng đã lưu bằng date + score
  function originalIndexOf(s: ToeicScore): number {
    const orig = student.scores ?? [];
    return orig.findIndex((o) => o.date === s.date && o.score === s.score);
  }

  async function handleDelete(s: ToeicScore, key: string) {
    if (!confirm("Xoá điểm này?")) return;
    const idx = originalIndexOf(s);
    if (idx === -1) return;
    setDeletingKey(key);
    await deleteStudentScore(code, idx);
    setDeletingKey(null);
  }

  return (
    <SectionCard
      title="🎯 Điểm TOEIC"
      action={
        <button
          onClick={() => { setShowForm((v) => !v); setEditingKey(null); }}
          className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          <Plus size={12} /> Thêm
        </button>
      }
    >
      <div className="space-y-3">
        {/* Add form */}
        {showForm && (
          <AdminScoreForm
            submitLabel="Lưu điểm"
            onCancel={() => setShowForm(false)}
            onSubmit={async (entry) => { await pushStudentScore(code, entry); setShowForm(false); }}
          />
        )}

        {/* Score list */}
        {scores.length === 0 && !showForm && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Chưa có điểm nào</p>
        )}
        {scores.map((s, i) => {
          const key = `${s.date}-${s.score}-${i}`;
          const hasP = PARTS.some((p) => s[p.key] !== undefined);
          const isEditing = editingKey === key;
          if (isEditing) {
            return (
              <AdminScoreForm
                key={key}
                initial={s}
                submitLabel="Lưu thay đổi"
                onCancel={() => setEditingKey(null)}
                onSubmit={async (entry) => {
                  const idx = originalIndexOf(s);
                  if (idx !== -1) await updateStudentScore(code, idx, entry);
                  setEditingKey(null);
                }}
              />
            );
          }
          return (
            <div key={key} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-bold leading-none" style={{ color: "var(--accent-primary)", minWidth: 48 }}>
                {s.score}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.testname ?? "Bài test"}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(s.date)}
                  {(s.l !== undefined || s.r !== undefined) ? ` · Nghe ${s.l ?? "—"} · Đọc ${s.r ?? "—"}` : ""}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
                {hasP && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {PARTS.map((p) => s[p.key] !== undefined && (
                      <span key={p.key} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                        {p.label}:{s[p.key]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => { setEditingKey(key); setShowForm(false); }}
                  className="text-xs px-2 py-1 rounded-lg border hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--accent-primary)" }}
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(s, key)}
                  disabled={deletingKey === key}
                  className="text-xs px-2 py-1 rounded-lg hover:opacity-80 disabled:opacity-40 flex items-center justify-center"
                  style={{ color: "rgb(239,68,68)" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── 6. Error Log Viewer (L11) ────────────────────────────────────────────────

function ErrorLogSection({ student }: { student: Student }) {
  const [showSessions, setShowSessions] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const errorLog = student.errorLog;
  if (!errorLog || Object.keys(errorLog).length === 0) {
    return (
      <SectionCard title="📒 Nhật ký lỗi">
        <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>Chưa có dữ liệu nhật ký lỗi</p>
      </SectionCard>
    );
  }

  const sessions = Object.entries(errorLog)
    .map(([key, e]) => ({ key, ...e }))
    .sort((a, b) => (b.date ?? b.key).localeCompare(a.date ?? a.key));

  const totalLs = sessions.reduce((s, e) => s + (e.lsTotal ?? 0), 0);
  const totalRd = sessions.reduce((s, e) => s + (e.rdTotal ?? 0), 0);

  const lsCount: Record<string, number> = {};
  const rdCount: Record<string, number> = {};
  sessions.forEach((e) => {
    if (e.listening) Object.entries(e.listening).forEach(([k, v]) => { if (v) lsCount[k] = (lsCount[k] ?? 0) + (v as number); });
    if (e.reading)   Object.entries(e.reading).forEach(([k, v])   => { if (v) rdCount[k]  = (rdCount[k]  ?? 0) + (v as number); });
  });

  const top3Ls = Object.entries(lsCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const top3Rd = Object.entries(rdCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxVal = Math.max(...[...top3Ls, ...top3Rd].map(([, v]) => v), 1);

  return (
    <SectionCard
      title="📒 Nhật ký lỗi"
      action={
        <button
          onClick={() => setShowSessions((v) => !v)}
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{ background: "var(--border)", color: "var(--text-secondary)" }}
        >
          {showSessions ? "Ẩn buổi" : `${sessions.length} buổi →`}
        </button>
      }
    >
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Buổi log", val: sessions.length },
            { label: "Lỗi LS", val: totalLs },
            { label: "Lỗi RD", val: totalRd },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-lg p-2" style={{ background: "var(--bg-primary)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>{val}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Top error types chart */}
        <div className="grid grid-cols-2 gap-4">
          {[{ title: "Top lỗi Listening", data: top3Ls, color: "#3b82f6" }, { title: "Top lỗi Reading", data: top3Rd, color: "#f59e0b" }].map(({ title, data, color }) => (
            <div key={title}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{title}</p>
              <div className="space-y-1.5">
                {data.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>—</p>
                ) : data.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="flex-1 relative h-4 rounded" style={{ background: "var(--border)" }}>
                      <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${(count / maxVal) * 100}%`, background: color, opacity: 0.7 }} />
                      <span className="absolute inset-0 flex items-center px-1.5 text-[10px] font-medium" style={{ color: "var(--text-primary)" }}>{type}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color, minWidth: 16 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* L11: Session list */}
        {showSessions && (
          <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Chi tiết từng buổi</p>
            {sessions.map((s) => {
              const isOpen = expandedSession === s.key;
              const dateLabel = s.date ? fmtDate(s.date) : s.key;
              return (
                <div key={s.key} className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    style={{ background: "var(--bg-primary)" }}
                    onClick={() => setExpandedSession(isOpen ? null : s.key)}
                  >
                    <span className="text-xs font-medium flex-1" style={{ color: "var(--text-primary)" }}>{dateLabel}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                      LS: {s.lsTotal ?? 0}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                      RD: {s.rdTotal ?? 0}
                    </span>
                    {isOpen ? <ChevronUp size={12} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />}
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-2 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                      {s.testName && (
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>{s.testName}{s.sessionType ? ` · ${s.sessionType}` : ""}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { title: "Listening", data: s.listening, color: "#3b82f6" },
                          { title: "Reading", data: s.reading, color: "#f59e0b" },
                        ].map(({ title, data, color }) => (
                          data && Object.keys(data).length > 0 ? (
                            <div key={title}>
                              <p className="text-[10px] font-semibold mb-1" style={{ color }}>{title}</p>
                              {Object.entries(data as Record<string, number>)
                                .filter(([, v]) => v > 0)
                                .sort(([, a], [, b]) => b - a)
                                .map(([type, count]) => (
                                  <div key={type} className="flex justify-between text-[10px] mb-0.5">
                                    <span style={{ color: "var(--text-secondary)" }}>{type}</span>
                                    <span className="font-bold" style={{ color }}>{count}</span>
                                  </div>
                                ))
                              }
                            </div>
                          ) : null
                        ))}
                      </div>
                      {s.details && s.details.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Chi tiết câu sai</p>
                          {s.details.slice(0, 5).map((d, i) => (
                            <div key={i} className="text-[10px] flex gap-1 mb-0.5">
                              {d.qNum && <span style={{ color: "var(--text-muted)" }}>#{d.qNum}</span>}
                              {d.content && <span style={{ color: "var(--text-primary)" }} className="truncate">{d.content}</span>}
                              {d.reviewed === "yes" && <span style={{ color: "rgb(5,150,105)" }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── 9. Modules ───────────────────────────────────────────────────────────────

const MODULE_STATUSES = [
  { value: "done", label: "Hoàn thành", color: "rgb(5,150,105)", bg: "rgba(16,185,129,0.12)" },
  { value: "current", label: "Đang học", color: "rgb(234,179,8)", bg: "rgba(234,179,8,0.12)" },
  { value: "pending", label: "Chưa học", bg: "var(--border)", color: "var(--text-muted)" },
];

function statusStyle(status: string) {
  return MODULE_STATUSES.find((s) => s.value === status) ?? MODULE_STATUSES[2];
}

function ModulesSection({ student, code }: { student: Student; code: string }) {
  const modules = student.modules ?? [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", week: "1", weekName: "", type: "Listening", status: "pending" });
  const [saving, setSaving] = useState(false);

  // Group by week
  const grouped = modules.reduce<Record<number, StudentModule[]>>((acc, m) => {
    const w = m.week ?? 0;
    if (!acc[w]) acc[w] = [];
    acc[w].push(m);
    return acc;
  }, {});
  const weeks = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    const module: StudentModule = {
      id: `m${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      week: parseInt(form.week) || 0,
      weekName: form.weekName.trim() || undefined,
    };
    await addModule(code, module);
    setForm({ name: "", week: "1", weekName: "", type: "Listening", status: "pending" });
    setSaving(false);
    setShowAdd(false);
  }

  async function handleStatusChange(moduleId: string, status: string) {
    await updateModuleStatus(code, moduleId, status);
  }

  async function handleDelete(moduleId: string) {
    if (!confirm("Xoá học phần này?")) return;
    await deleteModule(code, moduleId);
  }

  return (
    <SectionCard
      title="📚 Học phần (Tuần + Module)"
      action={
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          <Plus size={12} /> Thêm
        </button>
      }
    >
      <div className="space-y-3">
        {/* Add form */}
        {showAdd && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="TUẦN SỐ"><Input value={form.week} onChange={(v) => setForm((f) => ({ ...f, week: v }))} type="number" placeholder="1" /></InputRow>
              <InputRow label="TÊN TUẦN"><Input value={form.weekName} onChange={(v) => setForm((f) => ({ ...f, weekName: v }))} placeholder="PART 1" /></InputRow>
            </div>
            <InputRow label="TÊN HỌC PHẦN"><Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="PART 1 - BÀI TẬP CƠ BẢN" /></InputRow>
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="LOẠI">
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-2 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  {["Listening", "Reading", "Grammar", "Vocabulary", "Speaking", "Other"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </InputRow>
              <InputRow label="TRẠNG THÁI">
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-2 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  {MODULE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </InputRow>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Hủy</button>
              <button onClick={handleAdd} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50" style={{ background: "var(--accent-primary)", color: "#fff" }}>{saving ? "Lưu..." : "Thêm học phần"}</button>
            </div>
          </div>
        )}

        {modules.length === 0 && !showAdd && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Chưa có học phần</p>
        )}

        {weeks.map((w) => {
          const wModules = grouped[w] ?? [];
          const done = wModules.filter((m) => m.status === "done").length;
          const firstWithWeekName = wModules.find((m) => m.weekName);
          return (
            <div key={w}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Tuần {w}{firstWithWeekName?.weekName ? ` · ${firstWithWeekName.weekName}` : ""}
                </span>
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{done}/{wModules.length}</span>
                <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${wModules.length > 0 ? (done / wModules.length) * 100 : 0}%`, background: "var(--accent-primary)" }} />
                </div>
              </div>
              <div className="space-y-1">
                {wModules.map((m) => {
                  const st = statusStyle(m.status);
                  return (
                    <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-primary)" }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.color }} />
                      <span className="flex-1 text-xs" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.type}</span>
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusChange(m.id, e.target.value)}
                        className="text-[10px] px-1.5 py-0.5 rounded border outline-none"
                        style={{ background: st.bg, borderColor: "transparent", color: st.color, fontWeight: 600 }}
                      >
                        {MODULE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <button onClick={() => handleDelete(m.id)} className="p-0.5 hover:opacity-70" style={{ color: "rgb(239,68,68)" }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── 10. Personal Homework ────────────────────────────────────────────────────

const HW_SECTIONS: {
  key: keyof Omit<Homework, "id" | "date" | "endDate" | "title">;
  label: string;
  emoji: string;
  color: string;
  hint?: string;
}[] = [
  { key: "vocab",    label: "Từ vựng",      emoji: "📖", color: "#3B82F6" },
  { key: "reading",  label: "Đọc",          emoji: "📄", color: "#10B981" },
  { key: "listening",label: "Nghe",         emoji: "🎧", color: "#F97316" },
  { key: "other",    label: "Khác",         emoji: "📌", color: "#8B5CF6" },
  { key: "practice", label: "Đề luyện thi", emoji: "✏️", color: "#EF4444",
    hint: "Học viên mở đề → làm → nộp link → nhập điểm ở Tab Điểm số" },
];

type HwSectionKey = keyof Omit<Homework, "id" | "date" | "endDate" | "title">;

// ─── Homework progress helper ─────────────────────────────────────────────────

const HW_KEYS = ["vocab", "listening", "reading", "practice", "other"] as const;

function calcHwProgress(
  hw: Homework,
  submissions: Record<string, { ticked?: boolean; url?: string }>,
  dayLinks: Record<string, { link?: string }>,
) {
  let total = 0;
  for (const k of HW_KEYS) total += hw[k]?.length ?? 0;
  if (total === 0) return { done: 0, total: 0 };
  let done = 0;
  for (const k of HW_KEYS) {
    const items = hw[k] ?? [];
    for (let i = 0; i < items.length; i++) {
      const sub = submissions[`${hw.id}_${k}_${i}`];
      if (sub?.ticked) done++;
    }
  }
  return { done, total };
}

// ─── Duplicate BTVN: target picker ────────────────────────────────────────────

type DupTarget =
  | { type: "student"; code: string; label: string; schedule?: ClassSession[] }
  | { type: "class"; classId: string; members: string[]; label: string; schedule?: ClassSession[] };

function DuplicateTargetModal({ hw, currentCode, onConfirm, onClose }: {
  hw: Homework;
  currentCode: string;
  onConfirm: (target: DupTarget) => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<"self" | "student" | "class">("self");
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { students } = useAllStudents();
  const { classes } = useClasses();

  const q = query.trim().toLowerCase();
  const filteredStudents = students
    .filter((s) => s.id !== currentCode)
    .filter((s) => !q || s.name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));

  const canConfirm = scope === "self" || (scope === "student" && !!selectedCode) || (scope === "class" && !!selectedClassId);

  function handleConfirm() {
    if (scope === "self") {
      onConfirm({ type: "student", code: currentCode, label: "Học viên này" });
    } else if (scope === "student" && selectedCode) {
      const s = students.find((s) => s.id === selectedCode);
      onConfirm({ type: "student", code: selectedCode, label: s ? `${s.name} (${s.id})` : selectedCode, schedule: s?.weeklySchedule });
    } else if (scope === "class" && selectedClassId) {
      const c = classes.find((c) => c.id === selectedClassId);
      if (c) onConfirm({ type: "class", classId: c.id, members: c.members ?? [], label: `${c.name} (${c.members?.length ?? 0} học viên)`, schedule: c.weeklySchedule });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>📋 Nhân bản BTVN</h3>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Chọn nơi nhân bản nội dung BTVN {hw.title ? `"${hw.title}"` : fmtDate(hw.date)} sang. Bạn sẽ chọn lại ngày ở bước tiếp theo.
          </p>

          <div className="flex gap-1.5">
            {([
              { key: "self", label: "Học viên này" },
              { key: "student", label: "Học viên khác" },
              { key: "class", label: "Cả lớp" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex-1"
                style={{
                  background: scope === key ? "var(--accent-primary)" : "var(--border)",
                  color: scope === key ? "#fff" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {scope === "student" && (
            <div className="space-y-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc mã học viên..."
                className="w-full px-3 py-2 text-xs rounded-lg border outline-none"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <div className="max-h-48 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
                {filteredStudents.length === 0 && (
                  <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>Không tìm thấy học viên</p>
                )}
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedCode(s.id)}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between"
                    style={{ background: selectedCode === s.id ? "rgba(196,98,45,0.1)" : "transparent", color: "var(--text-primary)" }}
                  >
                    <span>{s.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>{s.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {scope === "class" && (
            <div className="max-h-48 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
              {classes.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>Chưa có lớp học nào</p>
              )}
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between"
                  style={{ background: selectedClassId === c.id ? "rgba(196,98,45,0.1)" : "transparent", color: "var(--text-primary)" }}
                >
                  <span>{c.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{c.members?.length ?? 0} học viên</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Hủy</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonalHWSection({
  homework,
  code,
  submissions,
  dayLinks,
  hwFiles,
  ownSchedule,
  pendingGrading = 0,
  lastHwReminderAt,
}: {
  homework: Homework[];
  code: string;
  submissions: Record<string, { ticked?: boolean; url?: string; updatedAt?: string }>;
  dayLinks: Record<string, { link?: string }>;
  hwFiles: HwFilesMap;
  ownSchedule?: ClassSession[];
  /** Bài Speaking/Writing HV đã nộp, chờ chấm (Postgres). */
  pendingGrading?: number;
  lastHwReminderAt?: string;
}) {
  // HV thuộc lớp thì theo lịch lớp, không thì lịch riêng — giống mục Lịch học cố định.
  const { classes: allClasses } = useClasses();
  const schedule = allClasses.find((c) => c.members?.includes(code))?.weeklySchedule ?? ownSchedule;
  useAutoDoneOnMount(true, [code]);
  const [filter, setFilter] = useState<"active" | "all" | "done" | "expired">("active");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Mở sẵn ngày BTVN gần nhất đang chạy (một lần, khi dữ liệu về).
  const [autoOpened, setAutoOpened] = useState(false);
  if (!autoOpened && homework.length > 0) {
    const t = today();
    const running = homework
      .filter((hw) => hw.date <= t && (hw.endDate ?? hw.date) >= t)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
      ?? [...homework].sort((a, b) => b.date.localeCompare(a.date))[0];
    setAutoOpened(true);
    if (running) setExpanded(new Set([running.id]));
  }
  const [reminding, setReminding] = useState(false);
  const [remindMsg, setRemindMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; initial?: Homework } | null>(null);
  const [dupPick, setDupPick] = useState<Homework | null>(null);
  const [exporting, setExporting] = useState<Homework | null>(null);
  const [dupModal, setDupModal] = useState<{ initial: Homework; target: DupTarget } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fileModal, setFileModal] = useState<{ hwId: string; index: number } | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const autosavedHwIdRef = useRef<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const { hwViewed } = useHwViewed(code);

  // Danh sách file của BTVN đang mở, để duyệt qua lại. Bài nộp kiểu cũ chỉ có
  // một link Drive nên coi như danh sách một phần tử (id "__legacy__").
  const modalFiles: { id: string; url: string }[] = (() => {
    if (!fileModal) return [];
    const entries = Object.entries(hwFiles[fileModal.hwId] ?? {}).map(([id, f]) => ({ id, url: f.url }));
    if (entries.length > 0) return entries;
    const legacy = dayLinks[fileModal.hwId]?.link;
    return legacy ? [{ id: "__legacy__", url: legacy }] : [];
  })();

  const modalUrl = fileModal ? modalFiles[fileModal.index]?.url ?? "" : "";
  const modalFileId = fileModal ? modalFiles[fileModal.index]?.id ?? "" : "";
  const modalHwId = fileModal?.hwId ?? null;

  // Nhận xét bám theo từng file: đổi ảnh thì nạp lại đúng nhận xét của ảnh đó.
  const hwViewedRef = useRef<HwViewedMap>(hwViewed);
  hwViewedRef.current = hwViewed;
  useEffect(() => {
    if (!modalHwId) return;
    setNoteInput(hwViewedRef.current[modalHwId]?.fileNotes?.[modalFileId]?.text ?? "");
    setNoteSaved(false);
  }, [modalHwId, modalFileId]);

  const stepFile = useCallback((delta: number) => {
    setFileModal((cur) => {
      if (!cur) return cur;
      const count = Object.values(hwFiles[cur.hwId] ?? {}).length || 1;
      const next = cur.index + delta;
      // Dừng ở hai đầu thay vì vòng lại: giáo viên biết ngay đã xem hết.
      if (next < 0 || next >= count) return cur;
      return { ...cur, index: next };
    });
  }, [hwFiles]);

  useEffect(() => {
    if (!fileModal) return;
    function onKey(e: KeyboardEvent) {
      // Đang gõ nhận xét thì ←/→ phải là di chuyển con trỏ, không phải đổi ảnh.
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        if (e.key === "Escape") (el as HTMLInputElement).blur();
        return;
      }
      if (e.key === "ArrowRight") { e.preventDefault(); stepFile(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stepFile(-1); }
      else if (e.key === "Escape") setFileModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fileModal, stepFile]);

  const todayStr = today();

  function isDone(hw: Homework) {
    const { done, total } = calcHwProgress(hw, submissions, dayLinks);
    return total > 0 && done === total;
  }

  const counts = {
    all:     homework.length,
    active:  homework.filter((hw) => (hw.endDate ?? hw.date) >= todayStr).length,
    done:    homework.filter(isDone).length,
    expired: homework.filter((hw) => (hw.endDate ?? hw.date) < todayStr).length,
  };

  const filtered = homework.filter((hw) => {
    if (filter === "all")     return true;
    if (filter === "active")  return (hw.endDate ?? hw.date) >= todayStr;
    if (filter === "done")    return isDone(hw);
    return (hw.endDate ?? hw.date) < todayStr;
  });

  // Tóm tắt: bài quá hạn (cùng định nghĩa với nút nhắc), tỉ lệ hoàn thành đầu việc 4 tuần.
  const overdueCount = overdueHomework(homework, submissions, dayLinks, todayStr).length;
  const since28 = shiftDay(todayStr, -28);
  const recent4w = homework.filter((hw) => hw.date >= since28 && hw.date <= todayStr)
    .reduce((a, hw) => { const p = calcHwProgress(hw, submissions, dayLinks); return { done: a.done + p.done, total: a.total + p.total }; }, { done: 0, total: 0 });
  const rate4w = recent4w.total > 0 ? Math.round((recent4w.done / recent4w.total) * 100) : null;

  async function remind() {
    setReminding(true); setRemindMsg(null);
    try {
      const res = await fetch("/api/admin/homework-remind", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCodes: [code] }),
      });
      const data = (await res.json().catch(() => ({}))) as { results?: { status: string }[]; error?: string };
      const st = data.results?.[0]?.status;
      setRemindMsg(!res.ok ? `Không gửi được: ${data.error ?? res.status}`
        : st === "sent" ? "Đã nhắc ✓"
        : st === "no-subs" ? "Đã vào chuông (HV chưa bật thông báo)"
        : st === "no-profile" ? "Đã vào chuông (HV chưa có tài khoản)"
        : st === "clear" ? "HV đã làm xong, không cần nhắc"
        : "Lỗi, thử lại");
    } catch {
      setRemindMsg("Lỗi mạng, thử lại");
    } finally {
      setReminding(false);
    }
  }

  function toggle(id: string) {
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleAutosaveHw(hw: Homework, isNew: boolean) {
    if (isNew) {
      await pushHomework(code, hw);
      autosavedHwIdRef.current = hw.id;
    } else {
      await updateHomework(code, hw.id, hw);
    }
  }

  async function handleSaveHw(hw: Homework, isEdit: boolean) {
    const alreadyPushed = !isEdit && autosavedHwIdRef.current === hw.id;
    if (isEdit || alreadyPushed) await updateHomework(code, hw.id, hw);
    else await pushHomework(code, hw);
    await assignHomeworkDecks(hw, [code]);
    autosavedHwIdRef.current = null;
    setModal(null);
  }

  async function handleDelete(hwId: string) {
    if (!confirm("Xoá bài tập này?")) return;
    setDeleting(hwId);
    await deleteHomework(code, hwId);
    setDeleting(null);
  }

  function handleDupTargetConfirm(hw: Homework, target: DupTarget) {
    const copy: Homework = { ...hw, id: `hw${Date.now()}`, date: "" };
    delete copy.endDate;
    setDupModal({ initial: copy, target });
    setDupPick(null);
  }

  async function handleSaveDuplicate(hw: Homework, target: DupTarget) {
    if (target.type === "student") {
      await pushHomework(target.code, hw);
    } else {
      await pushClassHomework(target.classId, hw);
      await Promise.all(target.members.map((memberCode) => pushHomework(memberCode, hw)));
    }
    await assignHomeworkDecks(hw, target.type === "class" ? target.members : [target.code]);
    setDupModal(null);
  }

  const FILTER_TABS: { key: typeof filter; label: string }[] = [
    { key: "active",  label: `Đang học ${counts.active}` },
    { key: "all",     label: `Tất cả ${counts.all}` },
    { key: "done",    label: `✓ Hoàn thành ${counts.done}` },
    { key: "expired", label: `⏰ Hết hạn ${counts.expired}` },
  ];

  return (
    <>
      {modal && (
        <HomeworkEditor
          initial={modal.initial}
          isEdit={modal.mode === "edit"}
          heading={modal.mode === "edit" ? "Sửa BTVN" : "Thêm BTVN"}
          targetLabel={code}
          schedule={schedule}
          history={homework}
          extraTargets={{ exclude: [{ type: "student", id: code }] }}
          saveLabel="💾 Lưu BTVN"
          onSave={(hw) => handleSaveHw(hw, modal.mode === "edit")}
          onAutosave={handleAutosaveHw}
          onClose={() => { setModal(null); autosavedHwIdRef.current = null; }}
        />
      )}

      {exporting && (
        <HwExportModal hw={exporting} label={code} onClose={() => setExporting(null)} />
      )}

      {dupPick && (
        <DuplicateTargetModal
          hw={dupPick}
          currentCode={code}
          onConfirm={(target) => handleDupTargetConfirm(dupPick, target)}
          onClose={() => setDupPick(null)}
        />
      )}

      {dupModal && (
        <HomeworkEditor
          initial={dupModal.initial}
          heading="Nhân bản BTVN"
          targetLabel={dupModal.target.label}
          schedule={dupModal.target.schedule ?? (dupModal.target.type === "student" && dupModal.target.code === code ? schedule : undefined)}
          saveLabel="💾 Lưu BTVN"
          onSave={(hw) => handleSaveDuplicate(hw, dupModal.target)}
          onClose={() => setDupModal(null)}
        />
      )}

      <SectionCard
        title="📋 BTVN (Bài tập về nhà)"
        action={
          <button
            onClick={() => setModal({ mode: "add" })}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <Plus size={12} /> Thêm ngày
          </button>
        }
      >
        <div className="space-y-3">
          {/* Tóm tắt + nhắc làm bài */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs rounded-lg px-3 py-2"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <span style={{ color: overdueCount > 0 ? "#dc2626" : "var(--text-secondary)", fontWeight: overdueCount > 0 ? 600 : 400 }}>
              {overdueCount > 0 ? `⏰ ${overdueCount} bài quá hạn` : "✓ Không có bài quá hạn"}
            </span>
            <Link href={`/admin/grading?code=${encodeURIComponent(code)}`} className="hover:underline"
              style={{ color: pendingGrading > 0 ? "#b45309" : "var(--text-secondary)", fontWeight: pendingGrading > 0 ? 600 : 400 }}>
              🖊️ {pendingGrading} bài S/W chờ chấm
            </Link>
            <span style={{ color: "var(--text-secondary)" }}>
              📈 Hoàn thành 4 tuần: <strong style={{ color: "var(--text-primary)" }}>{rate4w === null ? "—" : `${rate4w}%`}</strong>
              {recent4w.total > 0 && <span style={{ color: "var(--text-muted)" }}> ({recent4w.done}/{recent4w.total} việc)</span>}
            </span>
            <span className="ml-auto flex items-center gap-2">
              {remindMsg
                ? <span style={{ color: "var(--text-muted)" }}>{remindMsg}</span>
                : lastHwReminderAt && <span style={{ color: "var(--text-muted)" }}>Nhắc lần cuối {new Date(lastHwReminderAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
              <button type="button" onClick={remind} disabled={reminding || overdueCount === 0}
                title={overdueCount === 0 ? "Không có bài quá hạn để nhắc" : "Gửi chuông + push nhắc HV làm bài quá hạn"}
                className="px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
                style={{ background: "#f59e0b", color: "#fff" }}>
                {reminding ? "Đang nhắc…" : "🔔 Nhắc làm bài"}
              </button>
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{
                  background: filter === key ? "var(--accent-primary)" : "var(--border)",
                  color: filter === key ? "#fff" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              {homework.length === 0 ? "Chưa có bài tập nào" : "Không có bài trong mục này"}
            </p>
          )}

          {filtered.map((hw) => {
            const isExp = (hw.endDate ?? hw.date) < todayStr;
            const { done, total } = calcHwProgress(hw, submissions, dayLinks);
            const isCompleted = total > 0 && done === total;
            const dayLink = dayLinks[hw.id]?.link;
            const dateLabel = hw.endDate ? `${fmtDate(hw.date)} → ${fmtDate(hw.endDate)}` : fmtDate(hw.date);
            const isOpen = expanded.has(hw.id);

            return (
              <div key={hw.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {/* Row header */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                  onClick={() => toggle(hw.id)}
                  style={{ background: "var(--bg-primary)" }}
                >
                  <div className="flex-1 min-w-0">
                    {hw.title && (
                      <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{hw.title}</p>
                    )}
                    <span className="text-xs" style={{ color: hw.title ? "var(--text-muted)" : "var(--text-primary)" }}>{dateLabel}</span>
                  </div>

                  {/* Status badge */}
                  {isCompleted ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ background: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)" }}>
                      ✓ Hoàn thành
                    </span>
                  ) : isExp ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: "rgba(239,68,68,0.1)", color: "rgb(220,38,38)" }}>
                      Hết hạn
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: "rgba(16,185,129,0.1)", color: "rgb(5,150,105)" }}>
                      Đang học
                    </span>
                  )}

                  {/* Progress count */}
                  {total > 0 && (
                    <span className="text-[10px] font-semibold shrink-0"
                      style={{ color: done === total ? "rgb(5,150,105)" : "var(--text-muted)" }}>
                      {done}/{total} đã tick
                    </span>
                  )}

                  {/* File submitted badge */}
                  {dayLink && (
                    hwViewed[hw.id] ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: "rgba(5,150,105,.12)", color: "rgb(5,150,105)" }}>
                        {/\.(mp4|mov|avi|webm|mkv)/i.test(dayLink.split("?")[0]) ? "🎬" : "📷"}✓
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: "rgba(245,158,11,.15)", color: "rgb(180,110,0)" }}>
                        {/\.(mp4|mov|avi|webm|mkv)/i.test(dayLink.split("?")[0]) ? "🎬" : "📷"} Chưa xem
                      </span>
                    )
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit", initial: hw }); }}
                    className="p-1 hover:opacity-70 shrink-0" style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronDown size={12} style={{ display: "none" }} />✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExporting(hw); }}
                    title="Xuất ảnh đề bài để gửi học viên"
                    className="p-1 hover:opacity-70 shrink-0" style={{ color: "rgb(16,185,129)" }}
                  >
                    <ImageDown size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDupPick(hw); }}
                    title="Nhân bản BTVN"
                    className="p-1 hover:opacity-70 shrink-0" style={{ color: "var(--text-muted)" }}
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(hw.id); }}
                    disabled={deleting === hw.id}
                    className="p-1 hover:opacity-70 disabled:opacity-40 shrink-0"
                    style={{ color: "rgb(239,68,68)" }}
                  ><Trash2 size={12} /></button>
                  {isOpen
                    ? <ChevronUp size={14} className="shrink-0" style={{ color: "var(--text-muted)" }} />
                    : <ChevronDown size={14} className="shrink-0" style={{ color: "var(--text-muted)" }} />}
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: "var(--border)" }}>
                    {/* File gallery row */}
                    {(() => {
                      const files = hwFiles[hw.id] ?? {};
                      const fileEntries = Object.entries(files);
                      const hasNewFiles = fileEntries.length > 0;
                      const oldLink = dayLink && !dayLink.startsWith("https://firebasestorage.googleapis.com") ? dayLink : null;
                      if (!hasNewFiles && !dayLink) return (
                        <div className="flex items-center gap-2 px-3 py-2 border-b text-xs" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                          <span className="font-semibold shrink-0 text-[10px]" style={{ color: "var(--text-secondary)" }}>📎 BÀI NỘP:</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Chưa nộp</span>
                        </div>
                      );
                      return (
                        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-[10px] shrink-0" style={{ color: "var(--text-secondary)" }}>📎 BÀI NỘP:</span>
                            {hwViewed[hw.id] && <span className="text-[10px] font-semibold" style={{ color: "rgb(5,150,105)" }}>✓ Đã xem</span>}
                            <button
                              onClick={() => setFileModal({ hwId: hw.id, index: 0 })}
                              className="text-[10px] px-1.5 py-0.5 rounded hover:opacity-75"
                              style={{ background: "rgba(26,62,128,.1)", color: "#2860A8" }}
                            >
                              {hwViewed[hw.id] ? "Xem lại" : "Xem & đánh dấu"}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {fileEntries.map(([fileId, file], fileIdx) => {
                              const isVid = /\.(mp4|mov|avi|webm|mkv)/i.test(file.url.split("?")[0]);
                              return (
                                <div key={fileId} style={{ position: "relative" }}>
                                  <button onClick={() => setFileModal({ hwId: hw.id, index: fileIdx })} className="hover:opacity-80 transition-opacity">
                                    {isVid ? (
                                      <div style={{ width: 52, height: 52, background: "rgba(26,62,128,.08)", border: "1px solid rgba(26,62,128,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🎬</div>
                                    ) : (
                                      <img src={file.url} alt="" style={{ width: 52, height: 52, objectFit: "cover", border: "1px solid var(--border)", display: "block" }} />
                                    )}
                                  </button>
                                  {!!hwViewed[hw.id]?.fileNotes?.[fileId]?.text && (
                                    <span
                                      title={hwViewed[hw.id].fileNotes![fileId].text}
                                      style={{ position: "absolute", bottom: -4, left: -4, fontSize: ".55rem", lineHeight: 1, background: "#C4622D", borderRadius: "50%", width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >💬</span>
                                  )}
                                  <button
                                    onClick={async () => { if (confirm("Xoá file này?")) await deleteHwFile(code, hw.id, fileId, file.url); }}
                                    style={{ position: "absolute", top: -5, right: -5, width: 15, height: 15, borderRadius: "50%", background: "rgba(239,68,68,.85)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".5rem", fontWeight: 700, padding: 0 }}
                                  >✕</button>
                                </div>
                              );
                            })}
                            {oldLink && (
                              <a href={oldLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] px-2 py-1 rounded" style={{ background: "rgba(74,124,89,.1)", color: "#4A7C59", border: "1px solid rgba(74,124,89,.2)" }}>
                                🔗 Drive
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Per-section items */}
                    <div className="px-3 py-3 space-y-3">
                      {HW_SECTIONS.map(({ key, label: secLabel, color }) => {
                        const items = hw[key] ?? [];
                        if (items.length === 0) return null;
                        return (
                          <div key={key} className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${color}30` }}>
                            <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${color}14`, borderBottom: `1px solid ${color}25` }}>
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                              <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{secLabel}</span>
                            </div>
                            <div className="px-3 py-2.5 space-y-3" style={{ background: "var(--bg-primary)" }}>
                              {items.map((item, idx) => {
                                const subKey = `${hw.id}_${key}_${idx}`;
                                const sub = submissions[subKey];
                                const subDone = !!(sub?.ticked || sub?.url);
                                const subTime = sub?.updatedAt
                                  ? new Date(sub.updatedAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                                  : null;
                                return (
                                  <div key={idx} className="flex gap-2.5 items-start">
                                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                          {item.link ? (
                                            <a href={item.link} target="_blank" rel="noopener noreferrer"
                                              className="text-sm font-medium leading-snug hover:opacity-75 break-words"
                                              style={{ color }}
                                              dangerouslySetInnerHTML={{ __html: item.text }} />
                                          ) : (
                                            <span className="text-sm leading-snug break-words"
                                              style={{ color: "var(--text-primary)" }}
                                              dangerouslySetInnerHTML={{ __html: item.text }} />
                                          )}
                                          {item.desc && (
                                            <div className="mt-1.5 text-xs leading-relaxed px-2 py-1.5 rounded-lg"
                                              style={{ color: "var(--text-muted)", background: `${color}08`, borderLeft: `2px solid ${color}40` }}
                                              dangerouslySetInnerHTML={{ __html: item.desc }} />
                                          )}
                                        </div>
                                        {subDone ? (
                                          <span className="text-[10px] shrink-0 font-semibold" style={{ color: "rgb(5,150,105)" }}>
                                            ✓ Đã nộp{subTime ? ` · ${subTime}` : ""}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>—</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── File viewer modal ── */}
      {fileModal && (
        <div
          onClick={() => setFileModal(null)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <button
            type="button"
            onClick={() => setFileModal(null)}
            style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "min(90vw,700px)", maxHeight: "90vh" }}
          >
            {/* File preview */}
            <div
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}
              onTouchStart={(e) => { touchStartXRef.current = e.touches[0]?.clientX ?? null; }}
              onTouchEnd={(e) => {
                const start = touchStartXRef.current;
                touchStartXRef.current = null;
                if (start === null) return;
                const dx = (e.changedTouches[0]?.clientX ?? start) - start;
                if (Math.abs(dx) < 50) return;
                stepFile(dx < 0 ? 1 : -1);
              }}
            >
              {modalFiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => stepFile(-1)}
                  disabled={fileModal.index === 0}
                  aria-label="File trước"
                  style={{
                    position: "absolute", left: 0, zIndex: 2, width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: "1.2rem",
                    cursor: fileModal.index === 0 ? "default" : "pointer",
                    opacity: fileModal.index === 0 ? 0.25 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ‹
                </button>
              )}

              {/\.(mp4|mov|avi|webm|mkv)/i.test(modalUrl.split("?")[0]) ? (
                // key: đổi file phải nạp lại thẻ video, không thì trình duyệt giữ nguyên khung cũ.
                // Bỏ autoPlay: lướt nhanh qua nhiều file mà video nào cũng tự phát thì rất khó chịu.
                <video key={modalUrl} src={modalUrl} controls style={{ maxWidth: "100%", maxHeight: "65vh" }} />
              ) : (
                // key: đổi file thì component mount lại nên mức zoom tự về 100%.
                <ZoomableImage key={modalUrl} src={modalUrl} alt="Bài nộp" />
              )}

              {modalFiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => stepFile(1)}
                  disabled={fileModal.index >= modalFiles.length - 1}
                  aria-label="File kế tiếp"
                  style={{
                    position: "absolute", right: 0, zIndex: 2, width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: "1.2rem",
                    cursor: fileModal.index >= modalFiles.length - 1 ? "default" : "pointer",
                    opacity: fileModal.index >= modalFiles.length - 1 ? 0.25 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ›
                </button>
              )}
            </div>

            {/* Bộ đếm + dải thumbnail */}
            {modalFiles.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem" }}>
                <span style={{ color: "rgba(255,255,255,.65)", fontSize: ".78rem", fontWeight: 600 }}>
                  {fileModal.index + 1}/{modalFiles.length}
                  <span style={{ marginLeft: ".6rem", color: "rgba(255,255,255,.35)", fontWeight: 400 }}>
                    ← → để chuyển · Esc để đóng
                  </span>
                </span>
                <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", justifyContent: "center", maxHeight: 96, overflowY: "auto" }}>
                  {modalFiles.map(({ id, url }, i) => {
                    const isVid = /\.(mp4|mov|avi|webm|mkv)/i.test(url.split("?")[0]);
                    const active = i === fileModal.index;
                    const hasNote = !!hwViewed[fileModal.hwId]?.fileNotes?.[id]?.text;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFileModal((cur) => (cur ? { ...cur, index: i } : cur))}
                        style={{
                          width: 44, height: 44, padding: 0, cursor: "pointer", position: "relative",
                          border: active ? "2px solid #fff" : "1px solid rgba(255,255,255,.25)",
                          background: "rgba(255,255,255,.08)",
                          opacity: active ? 1 : 0.55,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {hasNote && (
                          <span style={{ position: "absolute", top: -4, right: -4, fontSize: ".6rem", lineHeight: 1, background: "#C4622D", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>💬</span>
                        )}
                        {isVid ? (
                          <span style={{ fontSize: "1rem" }}>🎬</span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Review panel */}
            <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "1rem", display: "flex", flexDirection: "column", gap: ".65rem" }}>
              {hwViewed[fileModal.hwId] ? (
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <span style={{ color: "rgb(52,211,153)", fontWeight: 700, fontSize: ".85rem" }}>✓ Đã xem</span>
                  <span style={{ color: "rgba(255,255,255,.4)", fontSize: ".75rem" }}>
                    {new Date(hwViewed[fileModal.hwId].viewedAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ) : (
                <button
                  onClick={async () => { await markHwViewed(code, fileModal.hwId); }}
                  style={{ alignSelf: "flex-start", padding: ".4rem 1rem", background: "rgba(52,211,153,.2)", border: "1px solid rgba(52,211,153,.4)", color: "rgb(52,211,153)", borderRadius: 6, cursor: "pointer", fontSize: ".82rem", fontWeight: 600 }}
                >
                  Đánh dấu đã xem ✓
                </button>
              )}

              {!!hwViewed[fileModal.hwId]?.note && (
                <div style={{ padding: ".5rem .7rem", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 6 }}>
                  <div style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".06em", color: "rgba(255,255,255,.45)", marginBottom: ".25rem" }}>
                    NHẬN XÉT CHUNG CẢ BUỔI (cũ)
                  </div>
                  <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,.85)", whiteSpace: "pre-wrap" }}>
                    {hwViewed[fileModal.hwId].note}
                  </div>
                </div>
              )}

              <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.5)" }}>
                Nhận xét cho <strong style={{ color: "rgba(255,255,255,.8)" }}>file {fileModal.index + 1}/{modalFiles.length}</strong> — học viên xem được ngay tại ảnh/video này.
              </div>

              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Nhận xét cho ảnh/video đang xem..."
                rows={2}
                style={{ width: "100%", padding: ".5rem .7rem", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", borderRadius: 6, fontSize: ".82rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <button
                onClick={async () => {
                  setSavingNote(true);
                  setNoteSaved(false);
                  try {
                    const hw = homework.find((h) => h.id === fileModal.hwId);
                    const hwLabel = hw ? fmtDate(hw.date) : undefined;
                    const text = noteInput.trim();
                    await saveHwFileNote(code, fileModal.hwId, modalFileId, text, hwLabel);
                    if (text) {
                      fetch("/api/push/hw-note", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ studentCode: code, note: text, hwLabel }),
                      }).catch(() => {});
                    }
                    setNoteSaved(true);
                    setTimeout(() => setNoteSaved(false), 2000);
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    alert("Lưu thất bại: " + msg);
                  } finally {
                    setSavingNote(false);
                  }
                }}
                disabled={savingNote}
                style={{ alignSelf: "flex-end", padding: ".4rem 1.1rem", background: noteSaved ? "rgb(5,150,105)" : "#C4622D", color: "#fff", border: "none", borderRadius: 6, cursor: savingNote ? "not-allowed" : "pointer", fontSize: ".82rem", fontWeight: 600, opacity: savingNote ? 0.6 : 1, transition: "background .2s" }}
              >
                {savingNote ? "Đang lưu…" : noteSaved ? "✓ Đã lưu" : "Lưu nhận xét"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 11. Personal Schedule ────────────────────────────────────────────────────

function PersonalScheduleSection({ student, code }: { student: Student; code: string }) {
  const schedule = [...(student.schedule ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", date: today(), time: "", kind: "" });
  const [saving, setSaving] = useState(false);

  const todayStr = today();

  async function handleAdd() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    const item: ScheduleItem = {
      id: `sch${Date.now()}`,
      title: form.title.trim(),
      date: form.date,
      time: form.time || undefined,
      kind: form.kind || undefined,
    };
    await addScheduleItem(code, item);
    setForm({ title: "", date: today(), time: "", kind: "" });
    setSaving(false);
    setShowAdd(false);
  }

  async function handleDelete(itemId: string) {
    if (!confirm("Xoá lịch này?")) return;
    await deleteScheduleItem(code, itemId ?? "");
  }

  return (
    <SectionCard
      title="🗓 Lịch học cá nhân"
      action={
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          <Plus size={12} /> Thêm
        </button>
      }
    >
      <div className="space-y-2">
        {showAdd && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <InputRow label="TIÊU ĐỀ">
              <Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Ôn Part 3, 4" />
            </InputRow>
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="NGÀY"><Input value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} type="date" /></InputRow>
              <InputRow label="GIỜ"><Input value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} placeholder="10:00" /></InputRow>
            </div>
            <InputRow label="LOẠI (tuỳ chọn)">
              <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))} className="w-full px-2 py-2 rounded-lg text-sm border outline-none" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                <option value="">—</option>
                <option value="1-1">1-1</option>
                <option value="class">Lớp</option>
                <option value="self">Tự học</option>
              </select>
            </InputRow>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Hủy</button>
              <button onClick={handleAdd} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50" style={{ background: "var(--accent-primary)", color: "#fff" }}>{saving ? "Lưu..." : "Thêm lịch"}</button>
            </div>
          </div>
        )}

        {schedule.length === 0 && !showAdd && (
          <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>Chưa có lịch học</p>
        )}

        {schedule.map((item, i) => {
          const isPast = item.date < todayStr;
          return (
            <div key={item.id ?? i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-primary)", opacity: isPast ? 0.6 : 1 }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(item.date)}{item.time ? ` · ${item.time}` : ""}
                  {item.kind ? ` · ${item.kind}` : ""}
                </p>
              </div>
              {item.date === todayStr && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(196,98,45,0.15)", color: "var(--accent-primary)" }}>Hôm nay</span>
              )}
              <button onClick={() => handleDelete(item.id ?? "")} className="p-1 hover:opacity-70" style={{ color: "rgb(239,68,68)" }}>
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── 12. Fixed weekly schedule ────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: "Monday",    label: "Thứ 2" },
  { value: "Tuesday",   label: "Thứ 3" },
  { value: "Wednesday", label: "Thứ 4" },
  { value: "Thursday",  label: "Thứ 5" },
  { value: "Friday",    label: "Thứ 6" },
  { value: "Saturday",  label: "Thứ 7" },
  { value: "Sunday",    label: "CN" },
];
const DAYS_VI: Record<string, string> = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.label]));

function FixedScheduleSection({ student, code }: { student: Student; code: string }) {
  const { classes } = useClasses();
  const memberClass = classes.find((c) => c.members?.includes(code));

  const [editing, setEditing] = useState(false);
  const [sessions, setSessions] = useState<ClassSession[]>(student.weeklySchedule ?? []);
  const [saving, setSaving] = useState(false);

  // Read-only mirror khi HV thuộc lớp
  if (memberClass) {
    const cls = memberClass;
    return (
      <SectionCard title="⏰ Lịch học cố định">
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Đồng bộ từ lớp{" "}
            <Link href={`/admin/classes/${cls.id}`} className="font-semibold" style={{ color: "var(--accent-primary)" }}>
              {cls.name}
            </Link>
          </p>
          {cls.weeklySchedule && cls.weeklySchedule.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {cls.weeklySchedule.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}>
                  {DAYS_VI[s.day] ?? s.day} · {s.time}{s.room ? ` · ${s.room}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>
              Lớp chưa có lịch cố định. Thêm ở trang lớp.
            </p>
          )}
        </div>
      </SectionCard>
    );
  }

  // Editable khi HV học lẻ
  async function handleSave() {
    setSaving(true);
    await updateStudent(code, { weeklySchedule: sessions.length > 0 ? sessions : [] });
    setSaving(false);
    setEditing(false);
  }

  function updateSession(i: number, field: "day" | "time", val: string) {
    setSessions((prev) => prev.map((s, j) => (j === i ? { ...s, [field]: val } : s)));
  }

  return (
    <SectionCard
      title="⏰ Lịch học cố định"
      action={
        editing ? (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setSessions(student.weeklySchedule ?? []); }} className="text-xs px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Huỷ</button>
            <button onClick={handleSave} disabled={saving} className="text-xs px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-50" style={{ background: "var(--accent-primary)", color: "#fff" }}>{saving ? "..." : "Lưu"}</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1" style={{ background: "var(--accent-primary)", color: "#fff" }}>
            <Plus size={12} /> Sửa
          </button>
        )
      }
    >
      {editing ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSessions((prev) => [...prev, { day: "Monday", time: "20:00" }])}
            className="text-[11px] font-semibold px-2 py-1 rounded"
            style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}
          >
            + Thêm buổi
          </button>
          {sessions.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Chưa có buổi cố định.</p>
          ) : (
            sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={s.day}
                  onChange={(e) => updateSession(i, "day", e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border flex-1"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                >
                  {DAY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <input
                  type="time"
                  value={s.time}
                  onChange={(e) => updateSession(i, "time", e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border)", width: "7.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setSessions((prev) => prev.filter((_, j) => j !== i))}
                  className="p-1 hover:opacity-70 shrink-0"
                  style={{ color: "rgb(239,68,68)" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {student.weeklySchedule && student.weeklySchedule.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {student.weeklySchedule.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}>
                  {DAYS_VI[s.day] ?? s.day} · {s.time}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>Chưa có lịch cố định</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
//
// Bố cục (chốt 26/11): header gọn dính đầu trang → Mục tiêu (full) → BTVN (2/3)
// + Nhắn HV / Ghi chú nội bộ (1/3) → tab các mục ít dùng. Thông tin cơ bản sửa
// trong ngăn kéo từ nút "Sửa thông tin" ở header.

type TabKey = "scores" | "errors" | "modules" | "schedule";
const TAB_STORE = "admin.student.tab";

function BottomTabs({ student, code }: { student: Student; code: string }) {
  const [tab, setTab] = useState<TabKey>(() => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(TAB_STORE) : null;
      return v === "errors" || v === "modules" || v === "schedule" ? v : "scores";
    } catch { return "scores"; }
  });
  function pick(t: TabKey) {
    setTab(t);
    try { localStorage.setItem(TAB_STORE, t); } catch { /* ignore */ }
  }
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "scores", label: "🎯 Điểm TOEIC", count: student.scores?.length ?? 0 },
    { key: "errors", label: "📒 Nhật ký lỗi", count: Object.keys(student.errorLog ?? {}).length },
    { key: "modules", label: "📚 Học phần", count: student.modules?.length ?? 0 },
    { key: "schedule", label: "🗓 Lịch học" },
  ];
  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Mục khác" className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => pick(t.key)}
            className="text-sm px-3 py-1.5 rounded-lg font-semibold"
            style={tab === t.key
              ? { background: "var(--accent-primary)", color: "#fff" }
              : { background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            {t.label}{t.count !== undefined && <span className="ml-1.5 opacity-75">{t.count}</span>}
          </button>
        ))}
      </div>
      {tab === "scores" && <ToeicScoresSection student={student} code={code} />}
      {tab === "errors" && <ErrorLogSection student={student} />}
      {tab === "modules" && <ModulesSection student={student} code={code} />}
      {tab === "schedule" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FixedScheduleSection student={student} code={code} />
          <PersonalScheduleSection student={student} code={code} />
        </div>
      )}
    </div>
  );
}

export default function StudentEditorPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const { student, loading } = useStudent(code);
  const { homework } = useHomework(code);
  const { dayLinks } = useDayLinks(code);
  const { submissions } = useSubmissions(code);
  const { hwFiles } = useHwFiles(code);

  const [deleting, setDeleting] = useState(false);
  const [overview, setOverview] = useState<StudentOverview | null>(null);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    fetch(`/api/admin/students/${encodeURIComponent(code)}/overview`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setOverview(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [code]);

  async function handleDelete() {
    if (!confirm(`Xoá học viên "${student?.name ?? code}"?\nHành động này không thể hoàn tác.`)) return;
    if (!confirm("Xác nhận lần 2: Xoá vĩnh viễn toàn bộ dữ liệu học viên này?")) return;
    setDeleting(true);
    await deleteStudent(code);
    router.push("/admin/students");
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl">🔍</div>
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Không tìm thấy học viên</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Mã học viên: <code>{code}</code></p>
        <Link href="/admin/students" className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 -mt-6 md:-mt-8">
      <StudentHeader code={code} student={student} overview={overview} onDelete={handleDelete} deleting={deleting} />

      <StudentGoalPanel code={code} student={student} overview={overview} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2">
          <PersonalHWSection
            homework={homework}
            code={code}
            submissions={submissions}
            dayLinks={dayLinks}
            hwFiles={hwFiles}
            ownSchedule={student.weeklySchedule}
            pendingGrading={overview?.pendingGrading ?? 0}
            lastHwReminderAt={student.lastHwReminderAt}
          />
        </div>
        <div className="space-y-5">
          <MessageSection student={student} code={code} />
          <InternalNoteSection student={student} code={code} />
        </div>
      </div>

      <BottomTabs student={student} code={code} />
    </div>
  );
}
