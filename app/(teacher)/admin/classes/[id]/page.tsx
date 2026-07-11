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
  RefreshCw,
  Copy,
} from "lucide-react";
import { useClass, useClasses } from "@/hooks/firebase/useClasses";
import { useAllStudents } from "@/hooks/firebase/useAllStudents";
import { useClassAttendance } from "@/hooks/firebase/useClassAttendance";
import {
  updateClass,
  deleteClass,
  pushClassHomework,
  updateClassHomework,
  deleteClassHomework,
  setAttendance,
  addClassMember,
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
  headerOverride,
  targetLabel,
}: {
  initial?: Homework;
  onSave: (hw: Homework) => Promise<void>;
  onAutosave?: (hw: Homework, isNew: boolean) => Promise<void>;
  onClose: () => void;
  headerOverride?: string;
  targetLabel?: string;
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
          <div>
            <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>
              📋 {headerOverride ?? (initial ? "Sửa BTVN lớp" : "Thêm BTVN lớp")}
            </h3>
            {targetLabel && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>→ {targetLabel}</p>
            )}
          </div>
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

const DAYS_VI: Record<string, string> = {
  Monday: "Thứ 2", Tuesday: "Thứ 3", Wednesday: "Thứ 4",
  Thursday: "Thứ 5", Friday: "Thứ 6", Saturday: "Thứ 7", Sunday: "CN",
};

const DAY_OPTIONS = [
  { value: "Monday",    label: "Thứ 2" },
  { value: "Tuesday",   label: "Thứ 3" },
  { value: "Wednesday", label: "Thứ 4" },
  { value: "Thursday",  label: "Thứ 5" },
  { value: "Friday",    label: "Thứ 6" },
  { value: "Saturday",  label: "Thứ 7" },
  { value: "Sunday",    label: "CN" },
];

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
  const [sessions, setSessions] = useState<import("@/lib/firebase/types").ClassSession[]>(cls.weeklySchedule ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateClass(classId, {
      name: name.trim(),
      desc: desc.trim() || undefined,
      weeklySchedule: sessions.length > 0 ? sessions : undefined,
    });
    setSaving(false);
    setEditing(false);
  }

  function updateSession(i: number, field: "day" | "time", val: string) {
    setSessions(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));
  }

  return (
    <SectionCard
      title="📋 Thông tin lớp"
      action={
        editing ? (
          <div className="flex gap-2">
            <Btn onClick={() => { setEditing(false); setName(cls.name ?? ""); setDesc(cls.desc ?? ""); setSessions(cls.weeklySchedule ?? []); }} size="xs">Huỷ</Btn>
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
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tên lớp</label>
            <TextInput value={name} onChange={setName} placeholder="VD: TOEIC 600 K3" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Mô tả</label>
            <TextInput value={desc} onChange={setDesc} placeholder="Mô tả ngắn..." />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Buổi học</label>
              <button
                type="button"
                onClick={() => setSessions(prev => [...prev, { day: "Monday", time: "20:00" }])}
                className="text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}
              >
                + Thêm buổi
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Chưa có buổi học.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={s.day}
                      onChange={e => updateSession(i, "day", e.target.value)}
                      className="text-xs px-2 py-1.5 rounded border flex-1"
                      style={{ background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                    >
                      {DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <input
                      type="time"
                      value={s.time}
                      onChange={e => updateSession(i, "time", e.target.value)}
                      className="text-xs px-2 py-1.5 rounded border"
                      style={{ background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border)", width: "7.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setSessions(prev => prev.filter((_, j) => j !== i))}
                      className="p-1 hover:opacity-70 shrink-0"
                      style={{ color: "rgb(239,68,68)" }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}>
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

// ─── AddMemberModal ───────────────────────────────────────────────────────────

function AddMemberModal({
  classId,
  allStudents,
  memberCodes,
  onClose,
}: {
  classId: string;
  allStudents: (Student & { id: string })[];
  memberCodes: string[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const available = useMemo(
    () =>
      allStudents.filter(
        (s) =>
          !memberCodes.includes(s.id) &&
          !added.has(s.id) &&
          (search === "" ||
            (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            s.id.includes(search))
      ),
    [allStudents, memberCodes, added, search]
  );

  async function addStudent(code: string, name?: string) {
    const trimmed = code.trim();
    if (!trimmed || adding) return;
    setAdding(trimmed);
    setError("");
    try {
      await addClassMember(classId, trimmed);
      setAdded((prev) => new Set(prev).add(trimmed));
      setManualCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    }
    setAdding(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Thêm học viên vào lớp
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Manual code */}
        <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>NHẬP MÃ HỌC VIÊN THỦ CÔNG</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addStudent(manualCode); }}
              placeholder="VD: 0386761664"
              className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => addStudent(manualCode)}
              disabled={!manualCode.trim() || !!adding}
              className="px-3 py-2 rounded-lg text-xs font-bold"
              style={{ background: "var(--accent-primary)", color: "#fff", border: "none", cursor: "pointer", opacity: !manualCode.trim() || !!adding ? 0.5 : 1 }}
            >
              {adding === manualCode.trim() ? "..." : "Thêm"}
            </button>
          </div>
          {error && <p className="text-xs mt-1.5" style={{ color: "rgb(220,38,38)" }}>{error}</p>}
        </div>

        {/* Search from list */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>CHỌN TỪ DANH SÁCH</p>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã..."
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {available.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>
              {search ? "Không tìm thấy học viên phù hợp" : "Tất cả học viên đã trong lớp"}
            </p>
          ) : (
            available.slice(0, 30).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border"
                style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.name ?? s.id}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.id} · Tuần {s.currentWeek ?? 0}</p>
                </div>
                <button
                  onClick={() => addStudent(s.id, s.name)}
                  disabled={!!adding}
                  className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)", border: "none", cursor: "pointer" }}
                >
                  {adding === s.id ? "..." : "+ Thêm"}
                </button>
              </div>
            ))
          )}
          {added.size > 0 && (
            <p className="text-xs text-center pt-2" style={{ color: "rgb(5,150,105)" }}>
              ✓ Đã thêm {added.size} học viên
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t flex justify-end" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            Xong
          </button>
        </div>
      </div>
    </div>
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
  const [showAdd, setShowAdd] = useState(false);

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
    <>
      <SectionCard
        title={`👥 Học viên (${members.length})`}
        action={
          <Btn onClick={() => setShowAdd(true)} variant="primary" size="xs">
            <Plus size={12} /> Thêm
          </Btn>
        }
      >
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

      {showAdd && (
        <AddMemberModal
          classId={classId}
          allStudents={allStudents}
          memberCodes={memberCodes}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}

// ─── Duplicate BTVN: target picker ────────────────────────────────────────────

type DupTarget =
  | { type: "class"; classId: string; members: string[]; label: string }
  | { type: "student"; code: string; label: string };

function ClassDupTargetModal({ hw, currentClassId, currentMembers, onConfirm, onClose }: {
  hw: Homework;
  currentClassId: string;
  currentMembers: string[];
  onConfirm: (target: DupTarget) => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<"self" | "class" | "student">("self");
  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const { classes } = useClasses();
  const { students } = useAllStudents();

  const q = query.trim().toLowerCase();
  const otherClasses = classes.filter((c) => c.id !== currentClassId);
  const filteredStudents = students
    .filter((s) => !q || s.name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));

  const canConfirm = scope === "self"
    || (scope === "class" && !!selectedClassId)
    || (scope === "student" && !!selectedCode);

  function handleConfirm() {
    if (scope === "self") {
      onConfirm({ type: "class", classId: currentClassId, members: currentMembers, label: "Lớp này" });
    } else if (scope === "class" && selectedClassId) {
      const c = classes.find((c) => c.id === selectedClassId);
      if (c) onConfirm({ type: "class", classId: c.id, members: c.members ?? [], label: `${c.name} (${c.members?.length ?? 0} học viên)` });
    } else if (scope === "student" && selectedCode) {
      const s = students.find((s) => s.id === selectedCode);
      onConfirm({ type: "student", code: selectedCode, label: s ? `${s.name} (${s.id})` : selectedCode });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-md rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold" style={{ color: "var(--accent-primary)" }}>📋 Nhân bản BTVN</h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Chọn nơi nhân bản nội dung BTVN {hw.title ? `"${hw.title}"` : fmtDate(hw.date)} sang. Bạn sẽ chọn lại ngày ở bước tiếp theo.
          </p>

          <div className="flex gap-1.5">
            {([
              { key: "self", label: "Lớp này" },
              { key: "class", label: "Lớp khác" },
              { key: "student", label: "Học viên" },
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

          {scope === "class" && (
            <div className="max-h-48 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
              {otherClasses.length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>Không có lớp khác</p>
              )}
              {otherClasses.map((c) => (
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

          {scope === "student" && (
            <div className="space-y-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc mã học viên..."
                className="w-full px-3 py-2 text-xs rounded-lg border outline-none"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <div className="max-h-44 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--border)" }}>
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
  const [dupPick, setDupPick] = useState<Homework | null>(null);
  const [dupModal, setDupModal] = useState<{ initial: Homework; target: DupTarget } | null>(null);
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

  async function handleSync(hw: Homework) {
    if (!confirm(`Đồng bộ BTVN "${hw.title ?? fmtDate(hw.date)}" sang ${memberCodes.length} học viên?`)) return;
    setPropagating(true);
    await Promise.all(memberCodes.map((code) => updateHomework(code, hw.id, hw)));
    setPropagating(false);
  }

  function handleDupTargetConfirm(source: Homework, target: DupTarget) {
    const initial: Homework = { ...source, id: `hw${Date.now()}`, date: "", endDate: undefined };
    setDupModal({ initial, target });
    setDupPick(null);
  }

  async function handleSaveDuplicate(hw: Homework, target: DupTarget) {
    setPropagating(true);
    if (target.type === "class") {
      await pushClassHomework(target.classId, hw);
      await Promise.all(target.members.map((code) => pushHomework(code, hw)));
    } else {
      await pushHomework(target.code, hw);
    }
    setPropagating(false);
    setDupModal(null);
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
                        title="Sửa BTVN"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDupPick(hw); }}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                        title="Nhân bản BTVN"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSync(hw); }}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "rgb(59,130,246)", background: "rgba(59,130,246,0.08)" }}
                        title="Đồng bộ lại cho học viên"
                        disabled={propagating}
                      >
                        <RefreshCw size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(hw.id); }}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "rgb(239,68,68)", background: "rgba(239,68,68,0.08)" }}
                        title="Xoá BTVN"
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

      {dupPick && (
        <ClassDupTargetModal
          hw={dupPick}
          currentClassId={classId}
          currentMembers={memberCodes}
          onConfirm={(target) => handleDupTargetConfirm(dupPick, target)}
          onClose={() => setDupPick(null)}
        />
      )}

      {dupModal && (
        <HomeworkModal
          initial={dupModal.initial}
          headerOverride="Nhân bản BTVN"
          targetLabel={dupModal.target.label}
          onSave={(hw) => handleSaveDuplicate(hw, dupModal.target)}
          onClose={() => setDupModal(null)}
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

// ─── WeekProgressSection ────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  while (cur <= endD) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function WeekProgressSection({
  homework,
  memberCodes,
  allStudents,
  attendance,
}: {
  homework: Homework[];
  memberCodes: string[];
  allStudents: (Student & { id: string })[];
  attendance: Record<string, Record<string, AttendanceStatus>>;
}) {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()).toISOString().slice(0, 10));
  const [dayLinksMap, setDayLinksMap] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(false);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }, [weekStart]);

  const weekDates = useMemo(() => datesBetween(weekStart, weekEnd), [weekStart, weekEnd]);

  const weekHomework = useMemo(
    () => homework.filter((hw) => hw.date >= weekStart && hw.date <= weekEnd),
    [homework, weekStart, weekEnd]
  );

  const members = useMemo(
    () => memberCodes.map((c) => allStudents.find((s) => s.id === c)).filter(Boolean) as (Student & { id: string })[],
    [memberCodes, allStudents]
  );

  useEffect(() => {
    if (memberCodes.length === 0 || weekHomework.length === 0) { setDayLinksMap({}); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      memberCodes.map(async (code) => {
        const snap = await get(dbRef(firebaseDb, `daylinks/${code}`));
        return { code, data: snap.val() as Record<string, unknown> | null };
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, Record<string, boolean>> = {};
      for (const { code, data } of results) {
        map[code] = {};
        for (const hw of weekHomework) map[code][hw.id] = !!(data?.[hw.id]);
      }
      setDayLinksMap(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [memberCodes, weekHomework]);

  function shiftWeek(delta: number) {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d.toISOString().slice(0, 10));
  }

  if (members.length === 0) return null;

  const weekLabel = `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;

  return (
    <SectionCard
      title="📈 Tiến độ tuần"
      action={
        <div className="flex items-center gap-1">
          <button onClick={() => shiftWeek(-1)} className="p-1 rounded hover:opacity-70" style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1 }}>‹</button>
          <span className="text-xs px-2" style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{weekLabel}</span>
          <button onClick={() => shiftWeek(1)} className="p-1 rounded hover:opacity-70" style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1 }}>›</button>
        </div>
      }
    >
      {loading ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Đang tải…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".72rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: ".4rem .5rem", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", minWidth: 100 }}>Học viên</th>
                <th style={{ textAlign: "center", padding: ".4rem", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>Tuần HV</th>
                <th style={{ textAlign: "center", padding: ".4rem", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>Điểm danh tuần</th>
                <th style={{ textAlign: "center", padding: ".4rem", color: "var(--text-muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  BTVN tuần {weekHomework.length > 0 ? `(${weekHomework.length})` : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((student) => {
                const attPresent = weekDates.filter((d) => attendance[student.id]?.[d] === "present").length;
                const attLate    = weekDates.filter((d) => attendance[student.id]?.[d] === "late").length;
                const attAbsent  = weekDates.filter((d) => attendance[student.id]?.[d] === "absent").length;
                const attTotal   = attPresent + attLate + attAbsent;
                const hwDone     = weekHomework.filter((hw) => dayLinksMap[student.id]?.[hw.id]).length;
                const hwTotal    = weekHomework.length;

                return (
                  <tr key={student.id}>
                    <td style={{ padding: ".4rem .5rem", color: "var(--text-primary)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>
                      <Link href={`/admin/students/${student.id}`} className="hover:underline">{student.name ?? student.id}</Link>
                    </td>
                    <td style={{ textAlign: "center", padding: ".4rem", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      T.{student.currentWeek ?? 0}
                    </td>
                    <td style={{ textAlign: "center", padding: ".4rem", borderBottom: "1px solid var(--border)" }}>
                      {attTotal === 0 ? (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      ) : (
                        <span style={{ color: attPresent > 0 ? "rgb(5,150,105)" : "var(--text-secondary)", fontWeight: 600 }}>
                          {attPresent > 0 && <span style={{ color: "rgb(5,150,105)" }}>✓{attPresent}</span>}
                          {attLate > 0 && <span style={{ color: "rgb(234,179,8)", marginLeft: attPresent > 0 ? 4 : 0 }}>~{attLate}</span>}
                          {attAbsent > 0 && <span style={{ color: "rgb(239,68,68)", marginLeft: attTotal > attAbsent ? 4 : 0 }}>✗{attAbsent}</span>}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: ".4rem", borderBottom: "1px solid var(--border)" }}>
                      {hwTotal === 0 ? (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      ) : (
                        <span style={{
                          fontWeight: 700,
                          color: hwDone === hwTotal ? "rgb(5,150,105)" : hwDone > 0 ? "rgb(234,179,8)" : "rgb(239,68,68)",
                        }}>
                          {hwDone}/{hwTotal}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {weekHomework.length === 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Tuần này chưa có BTVN được giao.</p>
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
          <WeekProgressSection
            homework={homework}
            memberCodes={memberCodes}
            allStudents={allStudents as (Student & { id: string })[]}
            attendance={attendance as Record<string, Record<string, AttendanceStatus>>}
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
