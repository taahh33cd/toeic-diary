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

function RichTextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const internalVal = useRef<string>(value);
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
    try { range.surroundContents(wrapper); }
    catch { const fragment = range.extractContents(); wrapper.appendChild(fragment); range.insertNode(wrapper); }
    sel.removeAllRanges();
    const html = ref.current!.innerHTML;
    internalVal.current = html;
    onChange(html);
  }
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div className="flex gap-1 px-2 py-1" style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
        {[{ tag: "b", label: "B" }, { tag: "i", label: "I" }, { tag: "u", label: "U" }, { tag: "mark", label: "HL" }].map(({ tag, label }) => (
          <button key={tag} type="button" onMouseDown={(e) => { e.preventDefault(); wrap(tag); }}
            className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
            style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", cursor: "pointer", color: "var(--text-primary)" }}>
            {label}
          </button>
        ))}
        <span className="text-[10px] self-center ml-1" style={{ color: "var(--text-muted)" }}>Bôi đen → format</span>
      </div>
      <div style={{ position: "relative" }}>
        <div ref={ref} contentEditable suppressContentEditableWarning
          onInput={(e) => {
            const html = (e.currentTarget as HTMLDivElement).innerHTML;
            internalVal.current = html;
            onChange(html);
          }}
          className="w-full px-3 py-2 text-xs outline-none min-h-[3rem]"
          style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
        />
        {!value && <span className="absolute top-2 left-3 text-xs pointer-events-none" style={{ color: "var(--text-muted)" }}>{placeholder}</span>}
      </div>
    </div>
  );
}

function HwItemRow({ item, onUpdate, onRemove }: {
  item: HwItemDraft;
  onUpdate: (field: keyof HwItemDraft, val: string) => void;
  onRemove: () => void;
}) {
  const [showDesc, setShowDesc] = useState(!!item.desc);
  return (
    <div className="space-y-1.5 rounded-lg p-2" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
      <div className="flex gap-2 items-center">
        <input
          value={item.text}
          onChange={(e) => onUpdate("text", e.target.value)}
          placeholder="Nội dung bài tập..."
          className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-lg border outline-none"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
        <input
          value={item.link}
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
      {showDesc && (
        <RichTextInput
          value={item.desc}
          onChange={(v) => onUpdate("desc", v)}
          placeholder="Mô tả chi tiết (hỗ trợ B/I/U/HL)..."
        />
      )}
    </div>
  );
}

function HomeworkModal({
  initial,
  onSave,
  onAutosave,
  onClose,
}: {
  initial?: Homework;
  onSave: (hw: Homework) => Promise<void>;
  onAutosave?: (hw: Homework, isNew: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? today());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sections, setSections] = useState<HwSections>(initial ? hwToSections(initial) : emptyHwSections());
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hwIdRef = useRef(initial?.id ?? `hw${Date.now()}`);
  const isNewRef = useRef(!initial);
  const onAutosaveRef = useRef(onAutosave);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { onAutosaveRef.current = onAutosave; }, [onAutosave]);

  useEffect(() => {
    if (!onAutosaveRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!onAutosaveRef.current) return;
      setSaveStatus("saving");
      const hw = sectionsToHw(hwIdRef.current, date, endDate, sections, title);
      await onAutosaveRef.current(hw, isNewRef.current);
      isNewRef.current = false;
      setSaveStatus("saved");
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [date, endDate, title, sections]);

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
    clearTimeout(timerRef.current);
    await onSave(sectionsToHw(hwIdRef.current, date, endDate, sections, title));
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-2xl my-8 rounded-2xl border shadow-xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>
            📋 {initial ? "Sửa BTVN lớp" : "Thêm BTVN lớp"}
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
                <button
                  onClick={() => addItem(key)}
                  className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1"
                  style={{ color: "var(--accent-primary)", background: "rgba(196,98,45,0.08)" }}
                >
                  <Plus size={10} /> Thêm mục
                </button>
              </div>
              {hint && <p className="text-[10px] mb-2 px-2 py-1 rounded" style={{ color, background: `${color}12` }}>{hint}</p>}
              {sections[key].length === 0 ? (
                <button onClick={() => addItem(key)} className="w-full text-xs py-1.5 rounded-lg border-dashed border"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}>
                  + Thêm mục
                </button>
              ) : (
                <div className="space-y-2">
                  {sections[key].map((item, idx) => (
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
            <Btn onClick={onClose}>Huỷ</Btn>
            <Btn onClick={handleSave} variant="primary" disabled={!date || saving}>
              {saving ? "Đang lưu..." : "💾 Lưu & Giao cho HV"}
            </Btn>
          </div>
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
  const autosavedHwIdRef = useRef<string | null>(null);

  const sorted = useMemo(
    () => [...homework].sort((a, b) => b.date.localeCompare(a.date)),
    [homework]
  );

  async function handleAutosave(hw: Homework, isNew: boolean) {
    if (isNew) {
      await pushClassHomework(classId, hw);
      autosavedHwIdRef.current = hw.id;
    } else {
      await updateClassHomework(classId, hw.id, hw);
    }
  }

  // M7: Save HW to class + propagate to all member students
  async function handleSave(hw: Homework) {
    setPropagating(true);
    const alreadyCreated = autosavedHwIdRef.current === hw.id;
    if (modal?.mode === "edit") {
      // Edit mode: class record + student records both already exist
      await updateClassHomework(classId, hw.id, hw);
      await Promise.all(memberCodes.map((code) => updateHomework(code, hw.id, hw)));
    } else if (alreadyCreated) {
      // Autosave created the class record but never pushed to students
      await updateClassHomework(classId, hw.id, hw);
      await Promise.all(memberCodes.map((code) => pushHomework(code, hw)));
    } else {
      await pushClassHomework(classId, hw);
      await Promise.all(memberCodes.map((code) => pushHomework(code, hw)));
    }
    autosavedHwIdRef.current = null;
    setPropagating(false);
  }

  // M7: Delete from class + propagate to all member students
  async function handleDelete(hwId: string) {
    if (!confirm("Xoá BTVN này? Sẽ xoá ở cả lớp lẫn từng học viên.")) return;
    await deleteClassHomework(classId, hwId);
    await Promise.all(memberCodes.map((code) => deleteHomework(code, hwId)));
  }

  function renderItems(items: HwItem[] | undefined, catLabel: string, color: string) {
    if (!items?.length) return null;
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${color}30` }}>
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${color}14`, borderBottom: `1px solid ${color}25` }}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{catLabel}</span>
        </div>
        <div className="px-3 py-2.5 space-y-3" style={{ background: "var(--bg-primary)" }}>
          {items.map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium leading-snug hover:opacity-75 break-words"
                    style={{ color }}
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                ) : (
                  <span className="text-sm leading-snug break-words" style={{ color: "var(--text-primary)" }}
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                )}
                {item.desc && (
                  <div className="mt-1.5 text-xs leading-relaxed px-2 py-1.5 rounded-lg"
                    style={{ color: "var(--text-secondary)", background: `${color}08`, borderLeft: `2px solid ${color}40` }}
                    dangerouslySetInnerHTML={{ __html: item.desc }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
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
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    style={{ background: "var(--bg-primary)" }}
                    onClick={() => setExpanded(isOpen ? null : hw.id)}
                  >
                    <div className="flex-1 min-w-0">
                      {hw.title && (
                        <p className="text-sm font-bold leading-tight mb-0.5" style={{ color: "var(--text-primary)" }}>
                          {hw.title}
                        </p>
                      )}
                      <p className="text-sm font-medium" style={{ color: hw.title ? "var(--text-muted)" : "var(--accent-primary)" }}>
                        {fmtDate(hw.date)}{hw.endDate ? ` → ${fmtDate(hw.endDate)}` : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Category dots preview */}
                        {HW_CATS.filter(({ key }) => hw[key]?.length).map(({ key, color, label }) => (
                          <span key={key} className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: `${color}15`, color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                            {label} ({hw[key]!.length})
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit", hw }); }}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(hw.id); }}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "rgb(239,68,68)", background: "rgba(239,68,68,0.08)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                      {isOpen ? (
                        <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                  </div>
                  {/* Expanded content */}
                  {isOpen && (
                    <div
                      className="px-4 py-4 space-y-3 border-t"
                      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
                    >
                      {HW_CATS.map(({ key, label, color }) => renderItems(hw[key], label, color))}
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
          onAutosave={handleAutosave}
          onClose={() => { setModal(null); autosavedHwIdRef.current = null; }}
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
