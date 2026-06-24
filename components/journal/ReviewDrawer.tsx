"use client";

import { useEffect, useRef, useState } from "react";
import { ref as dbRef } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { firebaseDb } from "@/lib/firebase/client";
import {
  setReviewStep, clearReviewProgress, buildScoreKey,
  saveVocabWord, addParaphraseEntry, addReviewNote, deleteReviewNote,
} from "@/lib/firebase/helpers";
import type { ToeicScore, ReviewScoreProgress, ReviewNote, ReviewNotesMap } from "@/lib/firebase/types";
import React from "react";

// ─── Step definitions ─────────────────────────────────────────────────────────

const DICTATION_URL = "https://toeic-dictation-diary.vercel.app/dictation";

type StepDef = { id: string; text: string; dictation?: true; trap?: true };

const STEPS: Record<string, StepDef[]> = {
  p1: [
    { id: "s1", text: "Tra từ vựng mới" },
    { id: "s2", text: "Phân tích tranh — đối tượng + hành động trong ảnh" },
    { id: "s3", text: "Luyện nghe – chép chính tả các câu sai", dictation: true },
  ],
  p2: [
    { id: "s1", text: "Tra từ vựng mới" },
    { id: "s2", text: "Phân tích hàm ý / bối cảnh câu hỏi và đáp án đúng" },
    { id: "s3", text: "Chỉ ra lý do sai của từng lựa chọn sai", trap: true },
    { id: "s4", text: "Luyện nghe – chép chính tả các câu sai", dictation: true },
  ],
  p3: [
    { id: "s1", text: "Tra từ vựng mới" },
    { id: "s2", text: "Luyện nghe – chép chính tả các bài nghe sai >1 câu hỏi", dictation: true },
    { id: "s3", text: "Tóm tắt & ghi chú từ đồng nghĩa trong đáp án và transcript" },
  ],
  p4: [
    { id: "s1", text: "Tra từ vựng mới" },
    { id: "s2", text: "Luyện nghe – chép chính tả các bài nghe sai >1 câu hỏi", dictation: true },
    { id: "s3", text: "Tóm tắt & ghi chú từ đồng nghĩa trong đáp án và transcript" },
  ],
  p5: [
    { id: "s1", text: "Chia cụm SVOC của câu" },
    { id: "s2", text: "Tra từ mới" },
    { id: "s3", text: "Tự phân tích lý do đáp án đúng" },
    { id: "s4", text: "Dịch câu với đáp án đúng" },
  ],
  p6: [
    { id: "s1", text: "Chia cụm SVOC với bài đọc" },
    { id: "s2", text: "Tra từ mới" },
    { id: "s3", text: "Tự phân tích lý do đáp án đúng" },
    { id: "s4", text: "Dịch bài đọc" },
  ],
  p7: [
    { id: "s1", text: "Chia cụm SVOC với bài đọc" },
    { id: "s2", text: "Tra từ mới" },
    { id: "s3", text: "Ghi chú từ đồng nghĩa & cách paraphrase đáp án đúng và bài đọc" },
    { id: "s4", text: "Dịch bài đọc" },
    { id: "s5", text: "Tóm tắt bài đọc bằng tiếng Việt" },
  ],
};

const PART_META: Record<string, { num: number; name: string; section: "L" | "R" }> = {
  p1: { num: 1, name: "Photographs",          section: "L" },
  p2: { num: 2, name: "Question–Response",     section: "L" },
  p3: { num: 3, name: "Conversations",         section: "L" },
  p4: { num: 4, name: "Talks",                 section: "L" },
  p5: { num: 5, name: "Incomplete Sentences",  section: "R" },
  p6: { num: 6, name: "Text Completion",       section: "R" },
  p7: { num: 7, name: "Reading Comprehension", section: "R" },
};

const L_PARTS = ["p1", "p2", "p3", "p4"];
const R_PARTS = ["p5", "p6", "p7"];
const PART_NUMS = [1, 2, 3, 4, 5, 6, 7];

// ─── Checklist helpers ────────────────────────────────────────────────────────

function getActiveParts(score: ToeicScore): string[] {
  return (["p1", "p2", "p3", "p4", "p5", "p6", "p7"] as const).filter(
    (k) => (score[k] ?? 0) > 0
  );
}

function totalSteps(activeParts: string[]): number {
  return activeParts.reduce((acc, pk) => acc + (STEPS[pk]?.length ?? 0), 0);
}

function doneSteps(activeParts: string[], progress: ReviewScoreProgress | null): number {
  if (!progress) return 0;
  return activeParts.reduce((acc, pk) => {
    const partProg = progress[pk] ?? {};
    return acc + Object.values(partProg).filter(Boolean).length;
  }, 0);
}

function partDone(pk: string, progress: ReviewScoreProgress | null): number {
  if (!progress) return 0;
  return Object.values(progress[pk] ?? {}).filter(Boolean).length;
}

// ─── NodeState ────────────────────────────────────────────────────────────────

function NodeState({ pk, activeParts, progress, isL, onClick }: {
  pk: string; activeParts: string[]; progress: ReviewScoreProgress | null;
  isL: boolean; onClick: () => void;
}) {
  const isActive = activeParts.includes(pk);
  const steps = STEPS[pk] ?? [];
  const done = isActive ? partDone(pk, progress) : 0;
  const total = steps.length;
  const meta = PART_META[pk];
  const state = !isActive ? "inactive" : done === 0 ? "none" : done < total ? "partial" : "done";

  const nodeStyle: React.CSSProperties =
    state === "inactive"
      ? { background: "var(--bg-primary)", border: "2px solid var(--border)", color: "var(--text-muted)" }
      : state === "none"
      ? { background: "var(--bg-elevated)", border: "2px solid var(--border)", color: "var(--text-muted)" }
      : state === "partial"
      ? isL
        ? { background: "rgba(59,91,219,0.08)", border: "2px solid #3b5bdb", color: "#3b5bdb" }
        : { background: "rgba(47,158,68,0.08)", border: "2px solid #2f9e44", color: "#2f9e44" }
      : isL
        ? { background: "#3b5bdb", border: "2px solid #3b5bdb", color: "#fff" }
        : { background: "#2f9e44", border: "2px solid #2f9e44", color: "#fff" };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
        cursor: isActive ? "pointer" : "default", flex: 1 }}
      onClick={isActive ? onClick : undefined}
      title={isActive ? `Part ${meta.num}: ${done}/${total} bước` : `Part ${meta.num}: không có lỗi`}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800,
        position: "relative", zIndex: 1, transition: "transform .15s", ...nodeStyle }}
        onMouseEnter={(e) => isActive && ((e.currentTarget as HTMLDivElement).style.transform = "scale(1.1)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "scale(1)")}
      >
        {state === "done" ? "✓" : meta.num}
      </div>
      <span style={{ fontSize: 10, color: state === "inactive" ? "var(--text-muted)" : isL ? "#3b5bdb" : "#2f9e44",
        fontWeight: state !== "inactive" ? 600 : 400, opacity: state === "inactive" ? 0.5 : 1 }}>
        {isActive ? `${done}/${total}` : "–"}
      </span>
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.1px", textTransform: "uppercase",
        color, background: color === "#3b5bdb" ? "rgba(59,91,219,0.08)" : "rgba(47,158,68,0.08)",
        padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ─── PartCard ─────────────────────────────────────────────────────────────────

const PartCard = React.forwardRef<HTMLDivElement, {
  pk: string; progress: ReviewScoreProgress | null;
  isL: boolean; onToggle: (stepId: string) => void;
}>(function PartCard({ pk, progress, isL, onToggle }, ref) {
  const meta = PART_META[pk];
  const steps = STEPS[pk] ?? [];
  const done = partDone(pk, progress);
  const accentColor = isL ? "#3b5bdb" : "#2f9e44";
  const accentFaint = isL ? "rgba(59,91,219,0.08)" : "rgba(47,158,68,0.08)";
  const accentBorder = isL ? "rgba(59,91,219,0.25)" : "rgba(47,158,68,0.25)";

  return (
    <div id={`card-${pk}`} ref={ref}
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
        borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
          background: accentFaint, color: accentColor }}>
          Part {meta.num}
        </span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {meta.name}
        </span>
        <span style={{ fontSize: 11, color: done === steps.length ? "#2f9e44" : "var(--text-muted)",
          fontWeight: done === steps.length ? 700 : 400 }}>
          {done}/{steps.length}
        </span>
      </div>

      <div style={{ padding: "4px 16px 8px" }}>
        {steps.map((step) => {
          const isDone = progress?.[pk]?.[step.id] === true;
          return (
            <div key={step.id}
              onClick={() => onToggle(step.id)}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0",
                borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone ? "#2f9e44" : "transparent",
                border: isDone ? "2px solid #2f9e44" : "2px solid var(--border)",
                transition: "background .15s, border-color .15s" }}>
                {isDone && (
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path d="M1 5.5L3.5 8.5L7 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.55,
                  color: isDone ? "var(--text-muted)" : "var(--text-secondary)",
                  textDecoration: isDone ? "line-through" : "none",
                  textDecorationColor: "var(--border)" }}>
                  {step.text}
                </div>
                {step.trap && !isDone && (
                  <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600,
                    padding: "2px 6px", borderRadius: 4, marginTop: 4,
                    background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>
                    ⚠ Bẫy âm thanh &amp; bẫy từ vựng
                  </span>
                )}
                {step.dictation && (
                  <a href={DICTATION_URL} target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 7,
                      fontSize: 11, fontWeight: 600, textDecoration: "none",
                      padding: "4px 10px", borderRadius: 6,
                      background: accentFaint, color: accentColor, border: `1px solid ${accentBorder}`,
                      opacity: isDone ? 0.35 : 1, pointerEvents: isDone ? "none" : "auto" }}>
                    → Mở Dictation
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Thành phẩm (Notes Tab) components ───────────────────────────────────────

const NOTE_INP: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid var(--border)", background: "var(--bg-primary)",
  color: "var(--text-primary)", borderRadius: 6, fontSize: 13, width: "100%",
  outline: "none", boxSizing: "border-box",
};

function PartSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...NOTE_INP, width: "auto", minWidth: 72, cursor: "pointer" }}>
      <option value="">Part…</option>
      {PART_NUMS.map((p) => <option key={p} value={p}>P{p}</option>)}
    </select>
  );
}

function NoteSection({ title, count, accentColor, children }: {
  title: string; count: number; accentColor: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, padding: "0 0 10px", textAlign: "left" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: ".8px", color: accentColor }}>{title}</span>
        {count > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
            background: accentColor + "1a", color: accentColor }}>{count}</span>
        )}
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <>{children}</>}
    </div>
  );
}

function NoteItem({ note, onDelete }: { note: ReviewNote; onDelete: () => void }) {
  const hasP = !!note.part;
  const isL = hasP && note.part! <= 4;
  const pc = isL ? "#3b5bdb" : "#2f9e44";
  return (
    <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 36px 10px 12px", marginBottom: 6, position: "relative" }}>
      {hasP && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
          marginBottom: 5, display: "inline-block",
          background: isL ? "rgba(59,91,219,0.08)" : "rgba(47,158,68,0.08)", color: pc }}>
          P{note.part}
        </span>
      )}
      <button onClick={onDelete}
        style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none",
          cursor: "pointer", color: "var(--text-muted)", fontSize: 14, lineHeight: 1 }}>
        ✕
      </button>
      {note.type === "vocab" && (
        <>
          <div>
            <strong style={{ color: "var(--text-primary)", fontSize: 14 }}>{note.content}</strong>
            {note.extra && <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: 8 }}>— {note.extra}</span>}
          </div>
          {note.example && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginTop: 3 }}>
              {note.example}
            </div>
          )}
        </>
      )}
      {note.type === "grammar" && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>
          {note.content}
        </div>
      )}
      {note.type === "paraphrase" && (
        <>
          <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{note.content}</div>
          {note.extra && (
            <div style={{ fontSize: 13, color: "#2f9e44", marginTop: 4 }}>→ {note.extra}</div>
          )}
        </>
      )}
    </div>
  );
}

function VocabForm({ studentCode, scoreKey }: { studentCode: string; scoreKey: string }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [part, setPart] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const canSave = !!(word.trim() && meaning.trim());

  async function handleAdd() {
    if (!canSave || saving) return;
    setErr("");
    setSaving(true);
    try {
      const partNum = part ? parseInt(part, 10) : 5;
      const today = new Date().toISOString().slice(0, 10);
      await saveVocabWord(studentCode, {
        word: word.trim(), vi: meaning.trim(),
        example: example.trim() || undefined,
        part: partNum, addedDate: today, repCount: 0,
      });
      await addReviewNote(studentCode, scoreKey, {
        type: "vocab", content: word.trim(), extra: meaning.trim(),
        example: example.trim() || undefined, part: partNum || undefined,
      });
      setWord(""); setMeaning(""); setExample(""); setPart("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 8, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
        <input value={word} onChange={(e) => setWord(e.target.value)}
          placeholder="Từ mới…" style={NOTE_INP} />
        <input value={meaning} onChange={(e) => setMeaning(e.target.value)}
          placeholder="Nghĩa tiếng Việt…" style={NOTE_INP} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6, marginBottom: 8 }}>
        <input value={example} onChange={(e) => setExample(e.target.value)}
          placeholder="Ví dụ câu (tuỳ chọn)…" style={NOTE_INP} />
        <PartSelect value={part} onChange={setPart} />
      </div>
      {err && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 6 }}>{err}</div>}
      <button
        onClick={handleAdd}
        disabled={!canSave || saving}
        style={{ width: "100%", padding: "8px", border: "none", borderRadius: 6,
          fontWeight: 600, fontSize: 13,
          background: canSave && !saving ? "#3b5bdb" : "var(--border)",
          color: canSave && !saving ? "#fff" : "var(--text-muted)",
          cursor: canSave && !saving ? "pointer" : "not-allowed" }}>
        {saving ? "Đang lưu…" : "+ Lưu vào Vocab Bank"}
      </button>
    </div>
  );
}

function ParaForm({ studentCode, scoreKey }: { studentCode: string; scoreKey: string }) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [part, setPart] = useState("3");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const canSave = !!(source.trim() && target.trim());

  async function handleAdd() {
    if (!canSave || saving) return;
    setErr("");
    setSaving(true);
    try {
      const partNum = part ? parseInt(part, 10) : 3;
      await addParaphraseEntry(studentCode, { source: source.trim(), target: target.trim(), part: partNum });
      await addReviewNote(studentCode, scoreKey, {
        type: "paraphrase", content: source.trim(), extra: target.trim(), part: partNum,
      });
      setSource(""); setTarget(""); setPart("3");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 8, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        <input value={source} onChange={(e) => setSource(e.target.value)}
          placeholder="Câu gốc…" style={NOTE_INP} />
        <input value={target} onChange={(e) => setTarget(e.target.value)}
          placeholder="Paraphrase…" style={NOTE_INP} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <PartSelect value={part} onChange={setPart} />
        </div>
      </div>
      {err && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 6 }}>{err}</div>}
      <button
        onClick={handleAdd}
        disabled={!canSave || saving}
        style={{ width: "100%", padding: "8px", border: "none", borderRadius: 6,
          fontWeight: 600, fontSize: 13,
          background: canSave && !saving ? "#2f9e44" : "var(--border)",
          color: canSave && !saving ? "#fff" : "var(--text-muted)",
          cursor: canSave && !saving ? "pointer" : "not-allowed" }}>
        {saving ? "Đang lưu…" : "+ Lưu vào Paraphrase Log"}
      </button>
    </div>
  );
}

function NotesTab({ studentCode, scoreKey }: { studentCode: string; scoreKey: string }) {
  const [notesRaw] = useObjectVal<ReviewNotesMap>(
    dbRef(firebaseDb, `students/${studentCode}/reviewNotes/${scoreKey}`)
  );
  const allNotes: [string, ReviewNote][] = notesRaw
    ? (Object.entries(notesRaw) as [string, ReviewNote][]).sort(
        (a, b) => b[1].addedAt.localeCompare(a[1].addedAt)
      )
    : [];

  const vocabNotes = allNotes.filter(([, n]) => n.type === "vocab");
  const paraNotes  = allNotes.filter(([, n]) => n.type === "paraphrase");

  async function del(k: string) {
    try { await deleteReviewNote(studentCode, scoreKey, k); } catch { /* ignore */ }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
      <NoteSection title="📝 Từ vựng mới" count={vocabNotes.length} accentColor="#3b5bdb">
        <VocabForm studentCode={studentCode} scoreKey={scoreKey} />
        {vocabNotes.map(([k, n]) => (
          <NoteItem key={k} note={n} onDelete={() => del(k)} />
        ))}
      </NoteSection>

      <NoteSection title="🔁 Paraphrase" count={paraNotes.length} accentColor="#2f9e44">
        <ParaForm studentCode={studentCode} scoreKey={scoreKey} />
        {paraNotes.map(([k, n]) => (
          <NoteItem key={k} note={n} onDelete={() => del(k)} />
        ))}
      </NoteSection>
    </div>
  );
}

// ─── DrawerContent ────────────────────────────────────────────────────────────

function DrawerContent({ score, studentCode, onClose }: {
  score: ToeicScore; studentCode: string; onClose: () => void;
}) {
  const scoreKey = buildScoreKey(score);
  const activeParts = getActiveParts(score);
  const [activeTab, setActiveTab] = useState<"checklist" | "notes">("checklist");

  const [rawProgress] = useObjectVal<ReviewScoreProgress>(
    dbRef(firebaseDb, `students/${studentCode}/reviewProgress/${scoreKey}`)
  );
  const progress = rawProgress ?? null;

  const total = totalSteps(activeParts);
  const done  = doneSteps(activeParts, progress);
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  async function toggleStep(pk: string, stepId: string) {
    const current = progress?.[pk]?.[stepId] ?? false;
    await setReviewStep(studentCode, scoreKey, pk, stepId, !current);
  }

  async function handleReset() {
    if (!window.confirm("Đặt lại toàn bộ tiến độ chữa bài này?")) return;
    await clearReviewProgress(studentCode, scoreKey);
  }

  const firstIncRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (activeTab !== "checklist") return;
    const timer = setTimeout(() => firstIncRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const dateFormatted = score.date.split("-").reverse().join("/");
  const lActiveParts = L_PARTS.filter((pk) => activeParts.includes(pk));
  const rActiveParts = R_PARTS.filter((pk) => activeParts.includes(pk));
  const hasL = lActiveParts.length > 0;
  const hasR = rActiveParts.length > 0;

  let firstIncSet = false;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.3px", textTransform: "uppercase",
              color: "var(--text-muted)", marginBottom: 4 }}>
              Chữa bài
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Lora', serif" }}>
              {score.score} điểm
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {dateFormatted}{score.testname ? ` · ${score.testname}` : ""}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 20, lineHeight: 1, padding: "4px 6px",
              borderRadius: 6, flexShrink: 0 }}
            aria-label="Đóng">
            ✕
          </button>
        </div>

        {/* Progress bar (checklist only) */}
        {activeParts.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tiến độ checklist</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                {done} / {total} bước
              </span>
            </div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`,
                background: "linear-gradient(90deg, #3b5bdb, #2f9e44)", transition: "width .35s ease" }} />
            </div>
            {done > 0 && (
              <button onClick={handleReset}
                style={{ marginTop: 8, display: "block", marginLeft: "auto", fontSize: 11,
                  color: "var(--text-muted)", background: "none", cursor: "pointer",
                  border: "1px solid var(--border)", borderRadius: 5, padding: "3px 10px" }}>
                Đặt lại
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {(["checklist", "notes"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: "10px 12px", background: "none", border: "none",
              cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: ".7px",
              textTransform: "uppercase",
              color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "2px solid #3b5bdb" : "2px solid transparent",
              marginBottom: -1, transition: "color .15s" }}>
            {tab === "checklist" ? "Checklist" : "Thành phẩm"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "checklist" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>
          {activeParts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
              Nhập điểm từng Part để dùng tính năng này.
            </div>
          )}

          {hasL && (
            <div style={{ marginBottom: 28 }}>
              <SectionLabel label="🎧 Listening" color="#3b5bdb" />
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "16px 12px 12px", marginBottom: 14, position: "relative" }}>
                <div style={{ display: "flex", position: "relative" }}>
                  {L_PARTS.length > 1 && (
                    <div style={{ position: "absolute", top: 17, left: `${100 / (L_PARTS.length * 2)}%`,
                      right: `${100 / (L_PARTS.length * 2)}%`, height: 2,
                      background: "rgba(59,91,219,0.2)", zIndex: 0 }} />
                  )}
                  {L_PARTS.map((pk) => (
                    <NodeState key={pk} pk={pk} activeParts={activeParts} progress={progress} isL
                      onClick={() => document.getElementById(`card-${pk}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", marginTop: 6 }}>
                  {L_PARTS.map((pk) => (
                    <div key={pk} style={{ flex: 1, textAlign: "center", fontSize: 10,
                      color: activeParts.includes(pk) ? "var(--text-secondary)" : "var(--text-muted)",
                      opacity: activeParts.includes(pk) ? 1 : 0.4 }}>
                      {PART_META[pk].name.split(" ")[0]}
                    </div>
                  ))}
                </div>
              </div>
              {lActiveParts.map((pk) => {
                const isFirstInc = !firstIncSet && partDone(pk, progress) < (STEPS[pk]?.length ?? 0);
                if (isFirstInc) firstIncSet = true;
                return (
                  <PartCard key={pk} pk={pk} progress={progress} isL
                    ref={isFirstInc ? firstIncRef : null}
                    onToggle={(stepId) => toggleStep(pk, stepId)}
                  />
                );
              })}
            </div>
          )}

          {hasR && (
            <div>
              <SectionLabel label="📖 Reading" color="#2f9e44" />
              <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "16px 12px 12px", marginBottom: 14, position: "relative" }}>
                <div style={{ display: "flex", position: "relative" }}>
                  {R_PARTS.length > 1 && (
                    <div style={{ position: "absolute", top: 17, left: `${100 / (R_PARTS.length * 2)}%`,
                      right: `${100 / (R_PARTS.length * 2)}%`, height: 2,
                      background: "rgba(47,158,68,0.2)", zIndex: 0 }} />
                  )}
                  {R_PARTS.map((pk) => (
                    <NodeState key={pk} pk={pk} activeParts={activeParts} progress={progress} isL={false}
                      onClick={() => document.getElementById(`card-${pk}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", marginTop: 6 }}>
                  {R_PARTS.map((pk) => (
                    <div key={pk} style={{ flex: 1, textAlign: "center", fontSize: 10,
                      color: activeParts.includes(pk) ? "var(--text-secondary)" : "var(--text-muted)",
                      opacity: activeParts.includes(pk) ? 1 : 0.4 }}>
                      {PART_META[pk].name.split(" ")[0]}
                    </div>
                  ))}
                </div>
              </div>
              {rActiveParts.map((pk) => {
                const isFirstInc = !firstIncSet && partDone(pk, progress) < (STEPS[pk]?.length ?? 0);
                if (isFirstInc) firstIncSet = true;
                return (
                  <PartCard key={pk} pk={pk} progress={progress} isL={false}
                    ref={isFirstInc ? firstIncRef : null}
                    onToggle={(stepId) => toggleStep(pk, stepId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <NotesTab studentCode={studentCode} scoreKey={scoreKey} />
      )}
    </div>
  );
}

// ─── ReviewDrawer (outer shell) ───────────────────────────────────────────────

export default function ReviewDrawer({ score, studentCode, onClose }: {
  score: ToeicScore | null; studentCode: string; onClose: () => void;
}) {
  const isOpen = score !== null;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          zIndex: 50, backdropFilter: "blur(2px)" }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(420px, 100vw)",
        background: "var(--bg-primary)",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        zIndex: 51, display: "flex", flexDirection: "column",
        animation: "slideIn .22s ease",
      }}>
        <DrawerContent score={score} studentCode={studentCode} onClose={onClose} />
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}
