"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { get, ref as dbRef } from "firebase/database";
import { firebaseDb } from "@/lib/firebase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Pencil,
  UserMinus,
} from "lucide-react";
import { useClass } from "@/hooks/firebase/useClasses";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClassAttendance } from "@/hooks/firebase/useClassAttendance";
import {
  updateClass,
  deleteClass,
  pushClassHomework,
  updateClassHomework,
  deleteClassHomework,
  setAttendance,
  removeClassMember,
  pushHomework,
  updateHomework,
  deleteHomework,
} from "@/lib/firebase/helpers";
import type {
  SchoolClass,
  Homework,
  HwItem,
  AttendanceStatus,
  Student,
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

function hwTaskCount(hw: Homework) {
  return (
    (hw.vocab?.length ?? 0) +
    (hw.reading?.length ?? 0) +
    (hw.listening?.length ?? 0) +
    (hw.practice?.length ?? 0) +
    (hw.other?.length ?? 0)
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Btn({
  onClick,
  variant = "ghost",
  size = "sm",
  children,
  disabled,
}: {
  onClick?: () => void;
  variant?: "ghost" | "primary" | "danger";
  size?: "sm" | "xs";
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 font-medium rounded-lg transition-opacity disabled:opacity-40 cursor-pointer";
  const sz = size === "xs" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs";
  const col =
    variant === "primary"
      ? "text-white"
      : variant === "danger"
      ? ""
      : "";
  const style =
    variant === "primary"
      ? {
          background: "var(--accent-primary)",
          color: "white",
        }
      : variant === "danger"
      ? {
          background: "rgba(239,68,68,0.1)",
          color: "rgb(239,68,68)",
        }
      : {
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
        };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${col}`}
      style={style}
    >
      {children}
    </button>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
      }}
    />
  );
}

// ─── Attendance cycle ─────────────────────────────────────────────────────────

const ATT_CYCLE: (AttendanceStatus | null)[] = [null, "present", "absent", "late"];

function nextStatus(current: AttendanceStatus | undefined): AttendanceStatus | null {
  const idx = ATT_CYCLE.indexOf(current ?? null);
  return ATT_CYCLE[(idx + 1) % ATT_CYCLE.length];
}

function AttBadge({ status }: { status: AttendanceStatus | undefined }) {
  if (!status)
    return (
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs border"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        –
      </span>
    );
  if (status === "present")
    return (
      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-green-500/10 text-green-600 font-bold">
        ✓
      </span>
    );
  if (status === "absent")
    return (
      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-red-500/10 text-red-500 font-bold">
        ✗
      </span>
    );
  return (
    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs bg-yellow-500/10 text-yellow-600 font-bold">
      ~
    </span>
  );
}

// ─── Homework Modal ───────────────────────────────────────────────────────────

type HwCatKey = "vocab" | "reading" | "listening" | "practice" | "other";

const HW_CATS: { key: HwCatKey; label: string; color: string; hint?: string }[] = [
  { key: "vocab",    label: "Từ vựng",      color: "#3B82F6" },
  { key: "reading",  label: "Đọc",          color: "#10B981" },
  { key: "listening",label: "Nghe",         color: "#F97316" },
  { key: "other",    label: "Khác",         color: "#8B5CF6" },
  { key: "practice", label: "Đề luyện thi", color: "#EF4444",
    hint: "Học viên mở đề → làm → nộp link → nhập điểm ở Tab Điểm số" },
];

type HwItemDraft = { text: string; link: string; desc: string };
type HwSections = Record<HwCatKey, HwItemDraft[]>;

function emptyHwSections(): HwSections {
  return { vocab: [], reading: [], listening: [], practice: [], other: [] };
}

function hwToSections(hw: Homework): HwSections {
  const s = emptyHwSections();
  for (const cat of HW_CATS) {
    s[cat.key] = (hw[cat.key] ?? []).map((i) => ({ text: i.text, link: i.link ?? "", desc: i.desc ?? "" }));
  }
  return s;
}

function sectionsToHw(id: string, date: string, endDate: string, sections: HwSections, title?: string): Homework {
  const hw: Homework = {
    id,
    date,
    endDate: endDate || undefined,
    ...(title?.trim() ? { title: title.trim() } : {}),
  };
  for (const cat of HW_CATS) {
    const items = sections[cat.key]
      .filter((i) => i.text.trim())
      .map((i) => ({
        text: i.text.trim(),
        ...(i.link.trim() ? { link: i.link.trim() } : {}),
        ...(i.desc.trim() ? { desc: i.desc.trim() } : {}),
      }));
    if (items.length > 0) hw[cat.key] = items;
  }
  return hw;
}

function RichText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function wrap(tag: string) {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = el.value.slice(s, e);
    onChange(el.value.slice(0, s) + `<${tag}>${sel}</${tag}>` + el.value.slice(e));
    setTimeout(() => { el.focus(); const c = s + `<${tag}>`.length + sel.length; el.setSelectionRange(c, c); }, 0);
  }
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div className="flex gap-1 px-2 py-1" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
        {[["b","B"],["i","I"],["u","U"],["mark","HL"]].map(([tag, label]) => (
          <button key={tag} type="button" onMouseDown={(e) => { e.preventDefault(); wrap(tag); }}
            className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
            style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", cursor: "pointer", color: "var(--text-primary)" }}>
            {label}
          </button>
        ))}
        <span className="text-[10px] self-center ml-1" style={{ color: "var(--text-muted)" }}>Bôi đen → format</span>
      </div>
      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        rows={2} className="w-full px-3 py-2 text-xs outline-none resize-none"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }} />
    </div>
  );
}

function HomeworkModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Homework;
  onSave: (hw: Homework) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sections, setSections] = useState<HwSections>(initial ? hwToSections(initial) : emptyHwSections());
  const [saving, setSaving] = useState(false);

  function addItem(key: HwCatKey) {
    setSections((s) => ({ ...s, [key]: [...s[key], { text: "", link: "", desc: "" }] }));
  }
  function updateItem(key: HwCatKey, idx: number, field: keyof HwItemDraft, val: string) {
    setSections((s) => { const items = [...s[key]]; items[idx] = { ...items[idx], [field]: val }; return { ...s, [key]: items }; });
  }
  function removeItem(key: HwCatKey, idx: number) {
    setSections((s) => ({ ...s, [key]: s[key].filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!date) return;
    setSaving(true);
    await onSave(sectionsToHw(initial?.id ?? `hw${Date.now()}`, date, endDate, sections, title));
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl my-8 rounded-2xl border shadow-xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>
            {initial ? "Sửa BTVN lớp" : "Thêm BTVN lớp"}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>NGÀY BẮT ĐẦU</label>
              <TextInput type="date" value={date} onChange={setDate} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>NGÀY KẾT THÚC (để trống = 1 ngày)</label>
              <TextInput type="date" value={endDate} onChange={setEndDate} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>TIÊU ĐỀ (TUỲ CHỌN)</label>
              <TextInput value={title} onChange={setTitle} placeholder="VD: Ngày 24/3 – 26/3" />
            </div>
          </div>

          {HW_CATS.map(({ key, label, color, hint }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                </div>
                <Btn onClick={() => addItem(key)} size="xs"><Plus size={10} /> Thêm mục</Btn>
              </div>
              {hint && <p className="text-[10px] mb-2 px-2 py-1 rounded" style={{ color, background: `${color}12` }}>{hint}</p>}
              {sections[key].length === 0 ? (
                <button onClick={() => addItem(key)} className="w-full text-xs py-1.5 rounded-lg border-dashed border"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}>
                  + Thêm mục
                </button>
              ) : (
                <div className="space-y-3">
                  {sections[key].map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <RichText value={item.text} onChange={(v) => updateItem(key, idx, "text", v)} placeholder="Nội dung bài tập..." />
                        <TextInput value={item.link} onChange={(v) => updateItem(key, idx, "link", v)} placeholder="Link (paste vào đây)" />
                        <TextInput value={item.desc} onChange={(v) => updateItem(key, idx, "desc", v)} placeholder="+ Mô tả (tuỳ chọn)" />
                      </div>
                      <button onClick={() => removeItem(key, idx)} className="mt-1 shrink-0" style={{ color: "rgb(239,68,68)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <Btn onClick={onClose}>Huỷ</Btn>
          <Btn onClick={handleSave} variant="primary" disabled={!date || saving}>
            {saving ? "Đang lưu..." : "💾 Lưu BTVN"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── ClassInfoSection ─────────────────────────────────────────────────────────

function ClassInfoSection({
  cls,
  classId,
}: {
  cls: SchoolClass;
  classId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name ?? "");
  const [desc, setDesc] = useState(cls.desc ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateClass(classId, { name: name.trim(), desc: desc.trim() || undefined });
    setSaving(false);
    setEditing(false);
  }

  const DAYS_VI: Record<string, string> = {
    Monday: "Thứ 2",
    Tuesday: "Thứ 3",
    Wednesday: "Thứ 4",
    Thursday: "Thứ 5",
    Friday: "Thứ 6",
    Saturday: "Thứ 7",
    Sunday: "CN",
  };

  return (
    <SectionCard
      title="📋 Thông tin lớp"
      action={
        editing ? (
          <div className="flex gap-2">
            <Btn onClick={() => setEditing(false)} size="xs">Huỷ</Btn>
            <Btn onClick={handleSave} variant="primary" size="xs" disabled={saving}>
              {saving ? "..." : <><Check size={12} /> Lưu</>}
            </Btn>
          </div>
        ) : (
          <Btn onClick={() => setEditing(true)} size="xs">
            <Pencil size={12} /> Sửa
          </Btn>
        )
      }
    >
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Tên lớp
            </label>
            <TextInput value={name} onChange={setName} placeholder="VD: TOEIC 600 K3" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Mô tả
            </label>
            <TextInput value={desc} onChange={setDesc} placeholder="Mô tả ngắn..." />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {cls.name}
          </p>
          {cls.desc && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {cls.desc}
            </p>
          )}
          {cls.weeklySchedule && cls.weeklySchedule.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {cls.weeklySchedule.map((s, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(196,98,45,0.08)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {DAYS_VI[s.day] ?? s.day} · {s.time}
                  {s.room ? ` · ${s.room}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── StudentGridSection ───────────────────────────────────────────────────────

function StudentGridSection({
  cls,
  classId,
  allStudents,
}: {
  cls: SchoolClass;
  classId: string;
  allStudents: (Student & { id: string })[];
}) {
  const memberCodes = cls.members ?? [];

  const members = useMemo(
    () =>
      memberCodes
        .map((code) => allStudents.find((s) => s.id === code))
        .filter(Boolean) as (Student & { id: string })[],
    [memberCodes, allStudents]
  );

  async function handleRemove(code: string) {
    if (!confirm("Xoá học viên này khỏi lớp?")) return;
    await removeClassMember(classId, code);
  }

  return (
    <SectionCard title={`👥 Học viên (${members.length})`}>
      {members.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
          Chưa có học viên
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {members.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-primary)",
              }}
            >
              <Link
                href={`/admin/students/${student.id}`}
                className="flex-1 min-w-0"
              >
                <p
                  className="text-sm font-medium truncate hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {student.name ?? student.id}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tuần {student.currentWeek ?? 0}
                  {student.frozen ? " · 🧊 Đóng băng" : ""}
                </p>
              </Link>
              <button
                onClick={() => handleRemove(student.id)}
                className="shrink-0 p-1 rounded"
                style={{ color: "var(--text-muted)" }}
                title="Xoá khỏi lớp"
              >
                <UserMinus size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── ClassHomeworkSection ─────────────────────────────────────────────────────

function ClassHomeworkSection({
  classId,
  homework,
  memberCodes,
}: {
  classId: string;
  homework: Homework[];
  memberCodes: string[];
}) {
  const [modal, setModal] = useState<{ mode: "add" } | { mode: "edit"; hw: Homework } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [propagating, setPropagating] = useState(false);

  const sorted = useMemo(
    () => [...homework].sort((a, b) => b.date.localeCompare(a.date)),
    [homework]
  );

  // M7: Save HW to class + propagate to all member students
  async function handleSave(hw: Homework) {
    setPropagating(true);
    if (modal?.mode === "edit") {
      await updateClassHomework(classId, hw.id, hw);
      await Promise.all(memberCodes.map((code) => updateHomework(code, hw.id, hw)));
    } else {
      await pushClassHomework(classId, hw);
      await Promise.all(memberCodes.map((code) => pushHomework(code, hw)));
    }
    setPropagating(false);
  }

  // M7: Delete from class + propagate to all member students
  async function handleDelete(hwId: string) {
    if (!confirm("Xoá BTVN này? Sẽ xoá ở cả lớp lẫn từng học viên.")) return;
    await deleteClassHomework(classId, hwId);
    await Promise.all(memberCodes.map((code) => deleteHomework(code, hwId)));
  }

  function renderItems(items: HwItem[] | undefined, catLabel: string) {
    if (!items?.length) return null;
    return (
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
          {catLabel}
        </p>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs" style={{ color: "var(--text-primary)" }}>
              <div className="flex gap-1">
                <span style={{ color: "var(--text-muted)" }}>·</span>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
                    {item.text}
                  </a>
                ) : (
                  item.text
                )}
              </div>
              {item.desc && (
                <p className="ml-3 text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}
                  dangerouslySetInnerHTML={{ __html: item.desc }} />
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <SectionCard
        title="📚 BTVN lớp"
        action={
          <div className="flex items-center gap-2">
            {propagating && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Đang sync…</span>}
            <Btn onClick={() => setModal({ mode: "add" })} size="xs" variant="primary" disabled={propagating}>
              <Plus size={12} /> Thêm
            </Btn>
          </div>
        }
      >
        {sorted.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
            Chưa có BTVN
          </p>
        ) : (
          <div className="space-y-2">
            {sorted.map((hw) => {
              const isOpen = expanded === hw.id;
              const count = hwTaskCount(hw);
              return (
                <div
                  key={hw.id}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                    style={{ background: "var(--bg-primary)" }}
                    onClick={() => setExpanded(isOpen ? null : hw.id)}
                  >
                    <div>
                      {hw.title && (
                        <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                          {hw.title}
                        </p>
                      )}
                      <p className="text-xs" style={{ color: hw.title ? "var(--text-muted)" : "var(--text-primary)" }}>
                        {fmtDate(hw.date)}{hw.endDate ? ` → ${fmtDate(hw.endDate)}` : ""}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {count} task{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit", hw }); }}
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(hw.id); }}
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                      {isOpen ? (
                        <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
                      ) : (
                        <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                  </div>
                  {isOpen && (
                    <div
                      className="px-3 py-3 space-y-2 border-t"
                      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
                    >
                      {renderItems(hw.vocab, "Từ vựng")}
                      {renderItems(hw.listening, "Nghe")}
                      {renderItems(hw.reading, "Đọc")}
                      {renderItems(hw.practice, "Luyện đề")}
                      {renderItems(hw.other, "Khác")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {modal && (
        <HomeworkModal
          initial={modal.mode === "edit" ? modal.hw : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─── ProgressGridSection (M8) ────────────────────────────────────────────────

function ProgressGridSection({
  homework,
  memberCodes,
  allStudents,
}: {
  homework: Homework[];
  memberCodes: string[];
  allStudents: (Student & { id: string })[];
}) {
  const [dayLinksMap, setDayLinksMap] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingGrid, setLoadingGrid] = useState(true);

  const sorted = useMemo(
    () => [...homework].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [homework]
  );

  const members = useMemo(
    () => memberCodes.map((c) => allStudents.find((s) => s.id === c)).filter(Boolean) as (Student & { id: string })[],
    [memberCodes, allStudents]
  );

  useEffect(() => {
    if (memberCodes.length === 0 || sorted.length === 0) { setLoadingGrid(false); return; }
    let cancelled = false;
    setLoadingGrid(true);
    Promise.all(
      memberCodes.map(async (code) => {
        const snap = await get(dbRef(firebaseDb, `daylinks/${code}`));
        const data = snap.val() as Record<string, unknown> | null;
        return { code, data };
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, Record<string, boolean>> = {};
      for (const { code, data } of results) {
        map[code] = {};
        for (const hw of sorted) {
          map[code][hw.id] = !!(data && data[hw.id]);
        }
      }
      setDayLinksMap(map);
      setLoadingGrid(false);
    });
    return () => { cancelled = true; };
  }, [memberCodes, sorted]);

  if (sorted.length === 0 || members.length === 0) return null;

  return (
    <SectionCard title="📊 Tiến độ BTVN">
      {loadingGrid ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Đang tải…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".72rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: ".4rem .5rem", color: "var(--text-muted)", fontWeight: 600, minWidth: 90, borderBottom: "1px solid var(--border)" }}>
                  Học viên
                </th>
                {sorted.map((hw) => (
                  <th key={hw.id} style={{ textAlign: "center", padding: ".4rem .4rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" }}>
                    {fmtDate(hw.date)}{hw.endDate ? `→${fmtDate(hw.endDate)}` : ""}
                  </th>
                ))}
                <th style={{ textAlign: "center", padding: ".4rem .4rem", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((student) => {
                const submitted = sorted.map((hw) => !!dayLinksMap[student.id]?.[hw.id]);
                const doneCount = submitted.filter(Boolean).length;
                const pct = sorted.length > 0 ? Math.round((doneCount / sorted.length) * 100) : 0;
                return (
                  <tr key={student.id}>
                    <td style={{ padding: ".4rem .5rem", color: "var(--text-primary)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>
                      <Link href={`/admin/students/${student.id}`} className="hover:underline">
                        {student.name ?? student.id}
                      </Link>
                    </td>
                    {submitted.map((done, i) => (
                      <td key={i} style={{ textAlign: "center", padding: ".4rem", borderBottom: "1px solid var(--border)" }}>
                        {done ? (
                          <span style={{ color: "rgb(5,150,105)", fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ color: "var(--border)" }}>·</span>
                        )}
                      </td>
                    ))}
                    <td style={{ textAlign: "center", padding: ".4rem", borderBottom: "1px solid var(--border)" }}>
                      <span style={{
                        fontSize: ".68rem",
                        fontWeight: 700,
                        color: pct >= 80 ? "rgb(5,150,105)" : pct >= 50 ? "rgb(234,179,8)" : "rgb(220,38,38)",
                      }}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sorted.length >= 10 && (
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>Hiển thị 10 BTVN gần nhất</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ─── AttendanceSection ────────────────────────────────────────────────────────

function AttendanceSection({
  classId,
  cls,
  allStudents,
  attendance,
}: {
  classId: string;
  cls: SchoolClass;
  allStudents: (Student & { id: string })[];
  attendance: Record<string, Record<string, AttendanceStatus>>;
}) {
  const [date, setDate] = useState(today());

  const memberCodes = cls.members ?? [];
  const members = useMemo(
    () =>
      memberCodes
        .map((code) => allStudents.find((s) => s.id === code))
        .filter(Boolean) as (Student & { id: string })[],
    [memberCodes, allStudents]
  );

  const presentCount = useMemo(
    () => members.filter((s) => attendance[s.id]?.[date] === "present").length,
    [members, attendance, date]
  );

  async function handleToggle(studentCode: string) {
    const current = attendance[studentCode]?.[date] as AttendanceStatus | undefined;
    const next = nextStatus(current);
    await setAttendance(studentCode, date, next);
  }

  return (
    <SectionCard title="📅 Điểm danh">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border outline-none"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
          {members.length > 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {presentCount}/{members.length} có mặt
            </span>
          )}
        </div>

        {members.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
            Chưa có học viên
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 pb-1">
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-green-500/10 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
                  Có mặt
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-red-500/10 text-red-500 flex items-center justify-center text-xs font-bold">✗</span>
                  Vắng
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded bg-yellow-500/10 text-yellow-600 flex items-center justify-center text-xs font-bold">~</span>
                  Trễ
                </span>
              </div>
            </div>
            {members.map((student) => {
              const status = attendance[student.id]?.[date] as AttendanceStatus | undefined;
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <p className="text-sm flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                    {student.name ?? student.id}
                  </p>
                  <button
                    onClick={() => handleToggle(student.id)}
                    className="shrink-0"
                    title="Click để thay đổi"
                  >
                    <AttBadge status={status} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();

  const { schoolClass, loading } = useClass(classId);
  const { students: allStudents } = useAllStudents();
  const memberCodes = schoolClass?.members ?? [];
  const { attendance } = useClassAttendance(memberCodes);

  const [deletingClass, setDeletingClass] = useState(false);

  async function handleDeleteClass() {
    if (!confirm(`Xoá lớp "${schoolClass?.name}"?\nHành động này không thể hoàn tác.`)) return;
    setDeletingClass(true);
    await deleteClass(classId);
    router.push("/admin/classes");
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl"
            style={{ background: "var(--border)" }}
          />
        ))}
      </div>
    );
  }

  if (!schoolClass) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
          Không tìm thấy lớp học
        </p>
        <Link
          href="/admin/classes"
          className="text-sm mt-2 inline-block hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          ← Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  const homework: Homework[] = Array.isArray(schoolClass.homework)
    ? schoolClass.homework
    : [];

  return (
    <div className="space-y-5">
      {/* TopBar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/admin/classes"
          className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {schoolClass.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {(schoolClass.members ?? []).length} học viên
          </p>
        </div>
        {/* M3: Delete class */}
        <button
          onClick={handleDeleteClass}
          disabled={deletingClass}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-semibold border disabled:opacity-60"
          style={{ borderColor: "rgba(239,68,68,0.4)", color: "rgb(220,38,38)", background: "rgba(239,68,68,0.06)" }}
        >
          <Trash2 size={14} /> Xoá lớp
        </button>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          <ClassInfoSection cls={schoolClass} classId={classId} />
          <StudentGridSection
            cls={schoolClass}
            classId={classId}
            allStudents={allStudents as (Student & { id: string })[]}
          />
        </div>

        {/* Right col */}
        <div className="lg:col-span-3 space-y-5">
          <ClassHomeworkSection classId={classId} homework={homework} memberCodes={memberCodes} />
          <ProgressGridSection
            homework={homework}
            memberCodes={memberCodes}
            allStudents={allStudents as (Student & { id: string })[]}
          />
          <AttendanceSection
            classId={classId}
            cls={schoolClass}
            allStudents={allStudents as (Student & { id: string })[]}
            attendance={attendance as Record<string, Record<string, AttendanceStatus>>}
          />
        </div>
      </div>
    </div>
  );
}
