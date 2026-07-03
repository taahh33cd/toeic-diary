"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Plus, Trash2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useStudent } from "@/hooks/firebase/useStudent";
import { useHomework } from "@/hooks/firebase/useHomework";
import { useSubmissions } from "@/hooks/firebase/useSubmissions";
import { useDayLinks } from "@/hooks/firebase/useDayLinks";
import { useHwViewed } from "@/hooks/firebase/useHwViewed";
import { useHwFiles } from "@/hooks/firebase/useHwFiles";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClasses } from "@/hooks/firebase/useClasses";
import {
  updateStudent,
  deleteStudent,
  setStudentFrozen,
  pushComment,
  sendNotification,
  pushStudentScore,
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
  deleteHwFile,
} from "@/lib/firebase/helpers";
import { calcEtsScore } from "@/lib/ets-scale";
import type {
  Student,
  ToeicScore,
  StudentModule,
  ScheduleItem,
  Homework,
  HwItem,
  HwFilesMap,
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

// ─── 1. BasicInfo ─────────────────────────────────────────────────────────────

function BasicInfoSection({ student, code, saveRef }: {
  student: Student;
  code: string;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}) {
  const [name, setName] = useState(student.name ?? "");
  const [week, setWeek] = useState(String(student.currentWeek ?? 1));
  const [courseType, setCourseType] = useState<"group" | "per-session" | "package">(student.courseType ?? "per-session");
  const [price, setPrice] = useState(String(student.pricePerSession ?? ""));
  const [totalFee, setTotalFee] = useState(String(student.totalFee ?? ""));
  const [paid, setPaid] = useState(String(student.paidAmount ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateStudent(code, {
        name: name.trim(),
        currentWeek: parseInt(week) || 1,
        courseType: courseType as Student["courseType"],
        pricePerSession: courseType !== "package" ? (parseInt(price) || undefined) : undefined,
        totalFee: courseType === "package" ? (parseInt(totalFee) || undefined) : undefined,
        paidAmount: courseType === "package" ? (parseInt(paid) || undefined) : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[handleSave]", err);
      alert("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  // L14: expose save fn to parent via ref
  useEffect(() => {
    if (saveRef) saveRef.current = handleSave;
  });


  return (
    <SectionCard
      title="📋 Thông tin cơ bản"
      action={
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60"
          style={{ background: saved ? "rgba(16,185,129,0.15)" : "var(--accent-primary)", color: saved ? "rgb(5,150,105)" : "#fff" }}
        >
          {saving ? "Đang lưu..." : saved ? "✓ Đã lưu" : "Lưu tất cả"}
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <InputRow label="HỌ VÀ TÊN">
            <Input value={name} onChange={setName} placeholder="Tên học viên" />
          </InputRow>
        </div>
        <InputRow label="MÃ HỌC VIÊN">
          <input
            value={code}
            disabled
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{ background: "var(--border)", borderColor: "var(--border)", color: "var(--text-muted)" }}
          />
        </InputRow>
        <InputRow label="TUẦN HIỆN TẠI">
          <Input value={week} onChange={setWeek} type="number" placeholder="1" />
        </InputRow>
        <div className="col-span-2">
          <InputRow label="LOẠI KHOÁ HỌC">
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value as "group" | "per-session" | "package")}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="per-session">1-1 theo buổi</option>
              <option value="group">Lớp nhóm</option>
              <option value="package">1-1 Trọn gói</option>
            </select>
          </InputRow>
        </div>
        {courseType !== "package" ? (
          <div className="col-span-2">
            <InputRow label="ĐƠN GIÁ / BUỔI (VND)">
              <Input value={price} onChange={setPrice} type="number" placeholder="vd. 150000" />
            </InputRow>
          </div>
        ) : (
          <>
            <InputRow label="TỔNG HỌC PHÍ (VND)">
              <Input value={totalFee} onChange={setTotalFee} type="number" placeholder="vd. 3000000" />
            </InputRow>
            <InputRow label="ĐÃ THANH TOÁN (VND)">
              <Input value={paid} onChange={setPaid} type="number" placeholder="vd. 1500000" />
            </InputRow>
          </>
        )}
      </div>
    </SectionCard>
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

// ─── 3. Comments ─────────────────────────────────────────────────────────────

function CommentsSection({ student, code }: { student: Student; code: string }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const comments = Object.entries(student.comments ?? {})
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    const commentText = text.trim();
    await pushComment(code, commentText);
    fetch("/api/push/comment-new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentCode: code, comment: commentText }),
    }).catch(() => {});
    setText("");
    setSending(false);
  }

  return (
    <SectionCard title="💬 Nhận xét">
      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Viết nhận xét cho học viên..."
          className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
          style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          {sending ? "Đang gửi..." : "📨 Gửi nhận xét & thông báo"}
        </button>
        {comments.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Lịch sử nhận xét</p>
            {comments.map((c) => (
              <div key={c.key} className="rounded-lg p-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(c.ts).toLocaleString("vi-VN")}
                </p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── 4. SendNotification ─────────────────────────────────────────────────────

function SendNotifSection({ student, code }: { student: Student; code: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!title.trim()) return;
    setSending(true);
    await sendNotification(code, { type: "manual", title: title.trim(), body: body.trim(), createdAt: new Date().toISOString() });
    setTitle(""); setBody("");
    setSending(false); setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <SectionCard title="🔔 Gửi thông báo">
      <div className="space-y-2">
        <InputRow label="TIÊU ĐỀ">
          <Input value={title} onChange={setTitle} placeholder="VD: Nhớ làm bài nhé!" />
        </InputRow>
        <InputRow label="NỘI DUNG">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder={`VD: Bài TOEIC Part 5 hạn nộp Chủ nhật này đó nhé~`}
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </InputRow>
        <button
          onClick={handleSend}
          disabled={sending || !title.trim()}
          className="w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{
            background: sent ? "rgba(16,185,129,0.15)" : "var(--accent-primary)",
            color: sent ? "rgb(5,150,105)" : "#fff",
          }}
        >
          {sending ? "Đang gửi..." : sent ? `✓ Đã gửi cho ${student.name}` : `Gửi cho ${student.name}`}
        </button>
      </div>
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

function ToeicScoresSection({ student, code }: { student: Student; code: string }) {
  const scores = [...(student.scores ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ testname: "", date: today(), note: "" });
  const [parts, setParts] = useState<Record<PartKey, string>>({ p1: "", p2: "", p3: "", p4: "", p5: "", p6: "", p7: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const parsed = { p1: parseInt(parts.p1)||0, p2: parseInt(parts.p2)||0, p3: parseInt(parts.p3)||0, p4: parseInt(parts.p4)||0, p5: parseInt(parts.p5)||0, p6: parseInt(parts.p6)||0, p7: parseInt(parts.p7)||0 };
  const hasAnyPart = Object.values(parsed).some((v) => v > 0);
  const calc = calcEtsScore(parsed.p1, parsed.p2, parsed.p3, parsed.p4, parsed.p5, parsed.p6, parsed.p7);

  async function handleAdd() {
    if (!form.date) return;
    setSaving(true);
    const score: ToeicScore = {
      score: hasAnyPart ? calc.total : parseInt(form.testname) || 0,
      date: form.date,
      testname: form.testname || undefined,
      note: form.note || undefined,
      ...(hasAnyPart ? parsed : {}),
    };
    await pushStudentScore(code, score);
    setForm({ testname: "", date: today(), note: "" });
    setParts({ p1: "", p2: "", p3: "", p4: "", p5: "", p6: "", p7: "" });
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(index: number) {
    if (!confirm("Xoá điểm này?")) return;
    setDeleting(index);
    await deleteStudentScore(code, index);
    setDeleting(null);
  }

  return (
    <SectionCard
      title="🎯 Điểm TOEIC"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
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
          <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="TÊN ĐỀ THI">
                <Input value={form.testname} onChange={(v) => setForm((f) => ({ ...f, testname: v }))} placeholder="EST 2026 Test 1" />
              </InputRow>
              <InputRow label="NGÀY THI">
                <Input value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} type="date" />
              </InputRow>
            </div>
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
            </div>
            {/* Live preview */}
            {hasAnyPart && (
              <div className="flex gap-3 text-sm font-bold text-center rounded-lg p-3" style={{ background: "rgba(196,98,45,0.08)" }}>
                <div className="flex-1">
                  <div className="text-xs font-normal mb-0.5" style={{ color: "var(--text-muted)" }}>Listening</div>
                  <div style={{ color: "var(--accent-primary)" }}>{calc.ls}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-normal mb-0.5" style={{ color: "var(--text-muted)" }}>Reading</div>
                  <div style={{ color: "var(--accent-primary)" }}>{calc.rd}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-normal mb-0.5" style={{ color: "var(--text-muted)" }}>Tổng</div>
                  <div className="text-lg" style={{ color: "var(--accent-primary)" }}>{calc.total}</div>
                </div>
              </div>
            )}
            <InputRow label="GHI CHÚ">
              <Input value={form.note} onChange={(v) => setForm((f) => ({ ...f, note: v }))} placeholder="Tuỳ chọn..." />
            </InputRow>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Hủy
              </button>
              <button onClick={handleAdd} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50" style={{ background: "var(--accent-primary)", color: "#fff" }}>
                {saving ? "Đang lưu..." : "Lưu điểm"}
              </button>
            </div>
          </div>
        )}

        {/* Score list */}
        {scores.length === 0 && !showForm && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Chưa có điểm nào</p>
        )}
        {scores.map((s, i) => {
          const hasP = PARTS.some((p) => s[p.key] !== undefined);
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
              <div className="text-2xl font-bold leading-none" style={{ color: "var(--accent-primary)", minWidth: 48 }}>
                {s.score}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.testname ?? "Bài test"}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{fmtDate(s.date)}{s.note ? ` · ${s.note}` : ""}</p>
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
              <button
                onClick={() => handleDelete(i)}
                disabled={deleting === i}
                className="text-xs p-1.5 rounded-lg hover:opacity-80 disabled:opacity-40"
                style={{ color: "rgb(239,68,68)" }}
              >
                <Trash2 size={14} />
              </button>
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

// ─── 7. Homework Progress (read-only) ─────────────────────────────────────────

function HomeworkProgressSection({ homework, dayLinks, hwFiles }: { homework: Homework[]; dayLinks: Record<string, unknown>; hwFiles: HwFilesMap }) {
  const recent = homework.slice(0, 7);

  if (recent.length === 0) {
    return (
      <SectionCard title="📊 Tiến độ nhiệm vụ">
        <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>Chưa có bài tập</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="📊 Tiến độ nhiệm vụ">
      <div className="space-y-2">
        {recent.map((hw) => {
          const submitted = !!dayLinks[hw.id] || Object.keys(hwFiles[hw.id] ?? {}).length > 0;
          const allItems = [
            ...(hw.vocab ?? []), ...(hw.listening ?? []),
            ...(hw.reading ?? []), ...(hw.practice ?? []), ...(hw.other ?? []),
          ];
          const label = hw.endDate ? `${fmtDate(hw.date)} → ${fmtDate(hw.endDate)}` : fmtDate(hw.date);
          return (
            <div key={hw.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{label}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {allItems.length > 0 ? `${allItems.length} mục` : "Không có mục"}
                </p>
              </div>
              <div className="shrink-0">
                {submitted ? (
                  <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)" }}>
                    ✓ Có file
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                    Chưa có file
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── 8. Student Link ──────────────────────────────────────────────────────────

function StudentLinkSection({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_STUDENT_URL ?? "https://toeic-dictation-diary.vercel.app"}/auth/login?auto=${code}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SectionCard title="🔗 Link học viên">
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono break-all" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <span className="flex-1 truncate">{url}</span>
        </div>
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
          style={{
            background: copied ? "rgba(16,185,129,0.1)" : "var(--border)",
            color: copied ? "rgb(5,150,105)" : "var(--text-secondary)",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Đã sao chép!" : "Sao chép link"}
        </button>
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

interface HwFormState {
  date: string;
  endDate: string;
  title: string;
  sections: Record<HwSectionKey, HwItem[]>;
}

function emptyHwForm(): HwFormState {
  return {
    date: today(),
    endDate: "",
    title: "",
    sections: { vocab: [], listening: [], reading: [], practice: [], other: [] },
  };
}

// ─── Rich-text toolbar input ──────────────────────────────────────────────────

function RichTextInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const internalVal = useRef<string>("");

  useEffect(() => {
    if (ref.current && value !== internalVal.current) {
      ref.current.innerHTML = value;
      internalVal.current = value;
    }
  }, [value]);

  function wrap(tag: string) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!ref.current?.contains(range.commonAncestorContainer)) return;
    const wrapper = document.createElement(tag);
    try {
      range.surroundContents(wrapper);
    } catch {
      const fragment = range.extractContents();
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
    }
    sel.removeAllRanges();
    const html = ref.current!.innerHTML;
    internalVal.current = html;
    onChange(html);
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div className="flex gap-1 px-2 py-1" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
        {[
          { tag: "b",    label: "B",  s: { fontWeight: 700 } },
          { tag: "i",    label: "I",  s: { fontStyle: "italic" } },
          { tag: "u",    label: "U",  s: { textDecoration: "underline" } },
          { tag: "mark", label: "HL", s: { background: "#fef08a", color: "#000", padding: "0 2px" } },
        ].map(({ tag, label, s }) => (
          <button
            key={tag}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); wrap(tag); }}
            className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
            style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", cursor: "pointer", color: "var(--text-primary)", ...s }}
          >{label}</button>
        ))}
        <span className="text-[10px] self-center ml-1" style={{ color: "var(--text-muted)" }}>Bôi đen → format</span>
      </div>
      <div style={{ position: "relative" }}>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const html = (e.currentTarget as HTMLDivElement).innerHTML;
            internalVal.current = html;
            onChange(html);
          }}
          className="w-full px-3 py-2 text-xs outline-none min-h-[3rem]"
          style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
        />
        {!value && (
          <span className="absolute top-2 left-3 text-xs pointer-events-none" style={{ color: "var(--text-muted)" }}>
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

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

// Per-item component to keep desc-toggle state local
function HwItemRow({ item, onUpdate, onRemove }: {
  item: HwItem;
  onUpdate: (field: "text" | "link" | "desc", val: string) => void;
  onRemove: () => void;
}) {
  const [showDesc, setShowDesc] = useState(!!(item.desc));
  return (
    <div className="space-y-1.5 rounded-lg p-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
      {/* Row 1: text + link + +Mô tả + X */}
      <div className="flex gap-2 items-center">
        <input
          value={item.text}
          onChange={(e) => onUpdate("text", e.target.value)}
          placeholder="Nội dung bài tập..."
          className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg border outline-none"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <input
          value={item.link ?? ""}
          onChange={(e) => onUpdate("link", e.target.value)}
          placeholder="Link (paste vào đây)"
          className="w-44 px-2 py-1.5 text-xs rounded-lg border outline-none shrink-0"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <button
          type="button"
          onClick={() => setShowDesc((v) => !v)}
          className="text-[10px] px-2 py-1.5 rounded-lg border shrink-0 whitespace-nowrap"
          style={{
            borderColor: showDesc ? "var(--accent-primary)" : "var(--border)",
            color: showDesc ? "var(--accent-primary)" : "var(--text-muted)",
            background: showDesc ? "rgba(196,98,45,0.08)" : "transparent",
          }}
        >
          {showDesc ? "✓ Mô tả" : "+ Mô tả"}
        </button>
        <button type="button" onClick={onRemove} className="p-1 shrink-0 hover:opacity-70" style={{ color: "rgb(239,68,68)" }}>
          <Trash2 size={12} />
        </button>
      </div>
      {/* Row 2: rich text desc (toggleable) */}
      {showDesc && (
        <RichTextInput
          value={item.desc ?? ""}
          onChange={(v) => onUpdate("desc", v)}
          placeholder="Mô tả chi tiết (hỗ trợ B/I/U/HL)..."
        />
      )}
    </div>
  );
}

function buildHwFromForm(form: HwFormState, hwId: string): Homework {
  const hw: Homework = {
    id: hwId,
    date: form.date,
    ...(form.endDate ? { endDate: form.endDate } : {}),
    ...(form.title.trim() ? { title: form.title.trim() } : {}),
  };
  HW_SECTIONS.forEach(({ key }) => {
    const items = form.sections[key].filter((i) => i.text.trim());
    if (items.length > 0) hw[key] = items.map((i) => ({
      text: i.text,
      ...(i.link ? { link: i.link } : {}),
      ...(i.desc ? { desc: i.desc } : {}),
    }));
  });
  return hw;
}

function HwModal({ initial, editId, targetLabel, onSave, onAutosave, onClose }: {
  initial: HwFormState;
  editId?: string;
  targetLabel?: string;
  onSave: (form: HwFormState, hwId: string) => Promise<void>;
  onAutosave?: (hw: Homework, isNew: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<HwFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hwIdRef = useRef(editId ?? `hw${Date.now()}`);
  const isNewRef = useRef(!editId);
  const onAutosaveRef = useRef(onAutosave);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { onAutosaveRef.current = onAutosave; }, [onAutosave]);

  useEffect(() => {
    if (!onAutosaveRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!onAutosaveRef.current) return;
      setSaveStatus("saving");
      const hw = buildHwFromForm(form, hwIdRef.current);
      await onAutosaveRef.current(hw, isNewRef.current);
      isNewRef.current = false;
      setSaveStatus("saved");
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [form]);

  function addItem(sec: HwSectionKey) {
    setForm((f) => ({ ...f, sections: { ...f.sections, [sec]: [...f.sections[sec], { text: "", link: "", desc: "" }] } }));
  }
  function updateItem(sec: HwSectionKey, idx: number, field: "text" | "link" | "desc", val: string) {
    setForm((f) => {
      const items = [...f.sections[sec]];
      items[idx] = { ...items[idx], [field]: val };
      return { ...f, sections: { ...f.sections, [sec]: items } };
    });
  }
  function removeItem(sec: HwSectionKey, idx: number) {
    setForm((f) => ({ ...f, sections: { ...f.sections, [sec]: f.sections[sec].filter((_, i) => i !== idx) } }));
  }

  async function handleSave() {
    if (!form.date) return;
    setSaving(true);
    clearTimeout(timerRef.current);
    try {
      await onSave(form, hwIdRef.current);
    } catch (err) {
      console.error("[HwModal handleSave]", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("Lưu thất bại: " + msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-2xl my-8 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>📋 {editId ? "Sửa BTVN" : "Thêm BTVN"}</h3>
            {targetLabel && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>→ {targetLabel}</p>
            )}
          </div>
          <button onClick={onClose} className="text-xl" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Dates + Title */}
          <div className="grid grid-cols-3 gap-3">
            <InputRow label="NGÀY BẮT ĐẦU">
              <Input value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} type="date" />
            </InputRow>
            <InputRow label="NGÀY KẾT THÚC (để trống = 1 ngày)">
              <Input value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} type="date" />
            </InputRow>
            <InputRow label="TIÊU ĐỀ (TUỲ CHỌN)">
              <Input value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="VD: Ngày 24/3 – 26/3" />
            </InputRow>
          </div>

          {/* Sections */}
          {HW_SECTIONS.map(({ key, label, emoji, color, hint }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{emoji} {label.toUpperCase()}</span>
                </div>
                <button
                  onClick={() => addItem(key)}
                  className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1"
                  style={{ color: "var(--accent-primary)", background: "rgba(196,98,45,0.08)" }}
                >
                  <Plus size={10} /> Thêm mục
                </button>
              </div>

              {hint && (
                <p className="text-[10px] mb-2 px-2 py-1 rounded" style={{ color, background: `${color}12` }}>{hint}</p>
              )}

              {form.sections[key].length === 0 ? (
                <button
                  onClick={() => addItem(key)}
                  className="w-full text-xs py-1.5 rounded-lg border-dashed border"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}
                >
                  + Thêm mục
                </button>
              ) : (
                <div className="space-y-2">
                  {form.sections[key].map((item, idx) => (
                    <HwItemRow
                      key={idx}
                      item={item}
                      onUpdate={(field, val) => updateItem(key, idx, field, val)}
                      onRemove={() => removeItem(key, idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {saveStatus === "saving" ? "Đang lưu tự động..." : saveStatus === "saved" ? "✓ Đã lưu tự động" : ""}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Hủy</button>
            <button onClick={handleSave} disabled={saving || !form.date} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "var(--accent-primary)", color: "#fff" }}>
              {saving ? "Đang lưu..." : "💾 Lưu BTVN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Duplicate BTVN: target picker ────────────────────────────────────────────

type DupTarget =
  | { type: "student"; code: string; label: string }
  | { type: "class"; classId: string; members: string[]; label: string };

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
      onConfirm({ type: "student", code: selectedCode, label: s ? `${s.name} (${s.id})` : selectedCode });
    } else if (scope === "class" && selectedClassId) {
      const c = classes.find((c) => c.id === selectedClassId);
      if (c) onConfirm({ type: "class", classId: c.id, members: c.members ?? [], label: `${c.name} (${c.members?.length ?? 0} học viên)` });
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
}: {
  homework: Homework[];
  code: string;
  submissions: Record<string, { ticked?: boolean; url?: string; updatedAt?: string }>;
  dayLinks: Record<string, { link?: string }>;
  hwFiles: HwFilesMap;
}) {
  const [filter, setFilter] = useState<"active" | "all" | "done" | "expired">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: "add" | "edit"; initial: HwFormState; editId?: string } | null>(null);
  const [dupPick, setDupPick] = useState<Homework | null>(null);
  const [dupModal, setDupModal] = useState<{ initial: HwFormState; target: DupTarget } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [fileModal, setFileModal] = useState<{ url: string; hwId: string } | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const autosavedHwIdRef = useRef<string | null>(null);

  const { hwViewed } = useHwViewed(code);

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

  function toggle(id: string) {
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function formFromHw(hw: Homework): HwFormState {
    const sections: Record<HwSectionKey, HwItem[]> = { vocab: [], listening: [], reading: [], practice: [], other: [] };
    HW_SECTIONS.forEach(({ key }) => {
      sections[key] = (hw[key] ?? []).map((i) => ({ text: i.text, link: i.link ?? "", desc: i.desc ?? "" }));
    });
    return { date: hw.date, endDate: hw.endDate ?? "", title: hw.title ?? "", sections };
  }

  async function handleAutosaveHw(hw: Homework, isNew: boolean, editId?: string) {
    if (isNew) {
      await pushHomework(code, hw);
      autosavedHwIdRef.current = hw.id;
    } else {
      await updateHomework(code, editId ?? hw.id, hw);
    }
  }

  async function handleSaveHw(form: HwFormState, editId?: string, modalHwId?: string) {
    const resolvedId = editId ?? modalHwId ?? `hw${Date.now()}`;
    const hwBase = {
      id: resolvedId,
      date: form.date,
      endDate: form.endDate || undefined,
      ...(form.title.trim() ? { title: form.title.trim() } : {}),
    } as Homework;
    HW_SECTIONS.forEach(({ key }) => {
      const items = form.sections[key].filter((i) => i.text.trim());
      if (items.length > 0) hwBase[key] = items.map((i) => ({
        text: i.text,
        ...(i.link ? { link: i.link } : {}),
        ...(i.desc ? { desc: i.desc } : {}),
      }));
    });
    const alreadyPushed = !editId && autosavedHwIdRef.current === resolvedId;
    if (editId || alreadyPushed) await updateHomework(code, resolvedId, hwBase);
    else await pushHomework(code, hwBase);
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
    setDupModal({ initial: { ...formFromHw(hw), date: "", endDate: "" }, target });
    setDupPick(null);
  }

  async function handleSaveDuplicate(form: HwFormState, hwId: string, target: DupTarget) {
    const hw = buildHwFromForm(form, hwId);
    if (target.type === "student") {
      await pushHomework(target.code, hw);
    } else {
      await pushClassHomework(target.classId, hw);
      await Promise.all(target.members.map((memberCode) => pushHomework(memberCode, hw)));
    }
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
        <HwModal
          initial={modal.initial}
          editId={modal.editId}
          onSave={(form, hwId) => handleSaveHw(form, modal.editId, hwId)}
          onAutosave={(hw, isNew) => handleAutosaveHw(hw, isNew, modal.editId)}
          onClose={() => { setModal(null); autosavedHwIdRef.current = null; }}
        />
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
        <HwModal
          initial={dupModal.initial}
          targetLabel={dupModal.target.label}
          onSave={(form, hwId) => handleSaveDuplicate(form, hwId, dupModal.target)}
          onClose={() => setDupModal(null)}
        />
      )}

      <SectionCard
        title="📋 BTVN (Bài tập về nhà)"
        action={
          <button
            onClick={() => setModal({ mode: "add", initial: emptyHwForm() })}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <Plus size={12} /> Thêm ngày
          </button>
        }
      >
        <div className="space-y-3">
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
                    onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit", initial: formFromHw(hw), editId: hw.id }); }}
                    className="p-1 hover:opacity-70 shrink-0" style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronDown size={12} style={{ display: "none" }} />✏️
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
                              onClick={() => { setFileModal({ url: fileEntries[0]?.[1]?.url ?? dayLink ?? "", hwId: hw.id }); setNoteInput(hwViewed[hw.id]?.note ?? ""); }}
                              className="text-[10px] px-1.5 py-0.5 rounded hover:opacity-75"
                              style={{ background: "rgba(26,62,128,.1)", color: "#2860A8" }}
                            >
                              {hwViewed[hw.id] ? "Xem lại" : "Xem & đánh dấu"}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {fileEntries.map(([fileId, file]) => {
                              const isVid = /\.(mp4|mov|avi|webm|mkv)/i.test(file.url.split("?")[0]);
                              return (
                                <div key={fileId} style={{ position: "relative" }}>
                                  <button onClick={() => { setFileModal({ url: file.url, hwId: hw.id }); setNoteInput(hwViewed[hw.id]?.note ?? ""); }} className="hover:opacity-80 transition-opacity">
                                    {isVid ? (
                                      <div style={{ width: 52, height: 52, background: "rgba(26,62,128,.08)", border: "1px solid rgba(26,62,128,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🎬</div>
                                    ) : (
                                      <img src={file.url} alt="" style={{ width: 52, height: 52, objectFit: "cover", border: "1px solid var(--border)", display: "block" }} />
                                    )}
                                  </button>
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
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {/\.(mp4|mov|avi|webm|mkv)/i.test(fileModal.url.split("?")[0]) ? (
                <video src={fileModal.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "65vh" }} />
              ) : (
                <img src={fileModal.url} alt="Bài nộp" style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain" }} />
              )}
            </div>

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

              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Nhận xét về bài nộp này..."
                rows={2}
                style={{ width: "100%", padding: ".5rem .7rem", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", borderRadius: 6, fontSize: ".82rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              <button
                onClick={async () => {
                  setSavingNote(true);
                  setNoteSaved(false);
                  try {
                    await markHwViewed(code, fileModal.hwId, noteInput.trim() || undefined);
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentEditorPage() {
  const params = useParams();
  const code = params?.code as string;
  const router = useRouter();

  const { student, loading } = useStudent(code);
  const { homework } = useHomework(code);
  const { dayLinks } = useDayLinks(code);
  const { submissions } = useSubmissions(code);
  const { hwFiles } = useHwFiles(code);

  const [freezing, setFreezing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchSaved, setBatchSaved] = useState(false);
  const basicInfoSaveRef = useRef<(() => Promise<void>) | null>(null);

  async function handleToggleFreeze() {
    if (!student) return;
    setFreezing(true);
    await setStudentFrozen(code, !student.frozen);
    setFreezing(false);
  }

  async function handleBatchSave() {
    setBatchSaving(true);
    if (basicInfoSaveRef.current) await basicInfoSaveRef.current();
    setBatchSaving(false);
    setBatchSaved(true);
    setTimeout(() => setBatchSaved(false), 2000);
  }

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
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/admin/students"
          className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} /> Danh sách
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{student.name}</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            ID: {code} · Tuần {student.currentWeek}
          </p>
        </div>
        <button
          onClick={handleToggleFreeze}
          disabled={freezing}
          className="text-sm px-4 py-2 rounded-xl font-semibold border disabled:opacity-60"
          style={student.frozen ? {
            borderColor: "rgba(16,185,129,0.4)",
            color: "rgb(5,150,105)",
            background: "rgba(16,185,129,0.06)",
          } : {
            borderColor: "rgba(239,68,68,0.4)",
            color: "rgb(220,38,38)",
            background: "rgba(239,68,68,0.06)",
          }}
        >
          {student.frozen ? "✓ Bỏ đóng băng" : "❄️ Đóng băng"}
        </button>
        {/* L14: Batch save */}
        <button
          onClick={handleBatchSave}
          disabled={batchSaving}
          className="text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
          style={batchSaved ? {
            background: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)",
          } : {
            background: "var(--accent-primary)", color: "#fff",
          }}
        >
          {batchSaving ? "Đang lưu..." : batchSaved ? "✓ Đã lưu" : "Lưu tất cả"}
        </button>
        {/* L3: Delete student */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm px-3 py-2 rounded-xl font-semibold border disabled:opacity-60"
          style={{ borderColor: "rgba(239,68,68,0.4)", color: "rgb(220,38,38)", background: "rgba(239,68,68,0.06)" }}
          title="Xoá học viên"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 space-y-5">
          <BasicInfoSection student={student} code={code} saveRef={basicInfoSaveRef} />
          <InternalNoteSection student={student} code={code} />
          <CommentsSection student={student} code={code} />
          <SendNotifSection student={student} code={code} />
          <ToeicScoresSection student={student} code={code} />
          <ErrorLogSection student={student} />
          <PersonalHWSection
            homework={homework}
            code={code}
            submissions={submissions}
            dayLinks={dayLinks}
            hwFiles={hwFiles}
          />
        </div>

        {/* Right column (1/3 width) */}
        <div className="space-y-5">
          <StudentLinkSection code={code} />
          <ModulesSection student={student} code={code} />
          <PersonalScheduleSection student={student} code={code} />
        </div>
      </div>
    </div>
  );
}
