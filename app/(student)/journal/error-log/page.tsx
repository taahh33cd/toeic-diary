"use client";

import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useStudent } from "@/hooks/firebase/useStudent";
import {
  addErrorEntry,
  deleteErrorEntry,
  markDetailReviewed,
  addParaphraseEntry,
  reviewParaphraseEntry,
  deleteParaphraseEntry,
} from "@/lib/firebase/helpers";
import type { ErrorLogEntry, ErrorDetail, ParaphraseEntry } from "@/lib/firebase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_TYPES = [
  { key: "distractor",   label: "Distractor" },
  { key: "miss_keyword", label: "Miss từ khoá" },
  { key: "inference",    label: "Inference" },
  { key: "no_read_q",    label: "Không đọc đề kịp" },
  { key: "paraphrase",   label: "Paraphrase" },
  { key: "graphic",      label: "Graphic" },
  { key: "new_word",     label: "Từ mới" },
  { key: "speed",        label: "Tốc độ nhanh" },
  { key: "accent",       label: "Ngữ điệu lạ" },
] as const;

const RD_TYPES = [
  { key: "vocabulary",   label: "Từ vựng" },
  { key: "grammar",      label: "Ngữ pháp" },
  { key: "text_logic",   label: "Logic văn bản" },
  { key: "detail_error", label: "Đọc sai chi tiết" },
  { key: "inference_r",  label: "Inference R" },
  { key: "cross_ref",    label: "Cross-reference" },
  { key: "no_time",      label: "Không đủ TG" },
] as const;

const PARTS = ["Part 1","Part 2","Part 3","Part 4","Part 5","Part 6","Part 7"];
const PARTS_NUM = [1, 2, 3, 4, 5, 6, 7];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10); }

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function addDaysStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

const PARA_SRS = [1, 3, 7, 14, 30];

function isParaDue(e: ParaphraseEntry, td: string): boolean {
  if (!e.lastReview) return true;
  const interval = PARA_SRS[Math.min(e.repCount, PARA_SRS.length - 1)];
  return addDaysStr(e.lastReview, interval) <= td;
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("vi-VN", {
    weekday: "short", day: "numeric", month: "numeric", year: "numeric",
  });
}

const inputSt = {
  background: "var(--bg-primary)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
} as React.CSSProperties;

// ─── Counter button ───────────────────────────────────────────────────────────

function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 26, height: 26,
          background: "var(--border)",
          color: "var(--text-secondary)",
          border: "none", cursor: "pointer",
          fontSize: "1rem", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >−</button>
      <span
        style={{
          width: 22, textAlign: "center",
          fontSize: "0.875rem", fontWeight: 600,
          color: value > 0 ? "var(--accent-primary)" : "var(--text-muted)",
        }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={{
          width: 26, height: 26,
          background: value > 0 ? "var(--accent-primary)" : "var(--border)",
          color: value > 0 ? "white" : "var(--text-secondary)",
          border: "none", cursor: "pointer",
          fontSize: "1rem", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >+</button>
    </div>
  );
}

// ─── Add Session Form ─────────────────────────────────────────────────────────

type LsKey = typeof LS_TYPES[number]["key"];
type RdKey = typeof RD_TYPES[number]["key"];

function AddSessionForm({ studentCode }: { studentCode: string }) {
  const [date, setDate] = useState(today());
  const [testName, setTestName] = useState("");
  const [sessionType, setSessionType] = useState<"full" | "part">("full");
  const [lsCounts, setLsCounts] = useState<Record<LsKey, number>>(
    Object.fromEntries(LS_TYPES.map(t => [t.key, 0])) as Record<LsKey, number>
  );
  const [rdCounts, setRdCounts] = useState<Record<RdKey, number>>(
    Object.fromEntries(RD_TYPES.map(t => [t.key, 0])) as Record<RdKey, number>
  );
  const [details, setDetails] = useState<Partial<ErrorDetail>[]>([]);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const lsTotal = Object.values(lsCounts).reduce((s, v) => s + v, 0);
  const rdTotal = Object.values(rdCounts).reduce((s, v) => s + v, 0);

  function addDetailRow() {
    setDetails(d => [...d, { content: "", qNum: "", part: "", paraphrase: "", reviewed: "no" }]);
  }

  function updateDetail(idx: number, patch: Partial<ErrorDetail>) {
    setDetails(d => d.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  function removeDetail(idx: number) {
    setDetails(d => d.filter((_, i) => i !== idx));
  }

  function reset() {
    setDate(today()); setTestName(""); setSessionType("full");
    setLsCounts(Object.fromEntries(LS_TYPES.map(t => [t.key, 0])) as Record<LsKey, number>);
    setRdCounts(Object.fromEntries(RD_TYPES.map(t => [t.key, 0])) as Record<RdKey, number>);
    setDetails([]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const filteredDetails = details.filter(d => d.content?.trim() || d.qNum?.trim());
      const entry: Omit<ErrorLogEntry, "savedAt"> = {
        date, testName: testName.trim() || undefined, sessionType, lsTotal, rdTotal,
        listening: lsTotal > 0 ? { ...lsCounts } : undefined,
        reading: rdTotal > 0 ? { ...rdCounts } : undefined,
        details: filteredDetails.length > 0 ? filteredDetails as ErrorDetail[] : undefined,
      };
      await addErrorEntry(studentCode, entry);
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Guide collapsible */}
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <button
          onClick={() => setGuideOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            📖 Hướng dẫn & phân loại lỗi
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{guideOpen ? "▲" : "▼"}</span>
        </button>
        {guideOpen && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="pt-3">
              <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-primary)" }}>Listening — 9 loại lỗi</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {LS_TYPES.map(t => (
                  <p key={t.key} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    · {t.label}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "rgb(99,102,241)" }}>Reading — 7 loại lỗi</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {RD_TYPES.map(t => (
                  <p key={t.key} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    · {t.label}
                  </p>
                ))}
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Tip: Chọn loại lỗi phù hợp nhất cho mỗi câu sai. Một câu có thể có nhiều nguyên nhân nhưng chỉ chọn nguyên nhân chính.
            </p>
          </div>
        )}
      </div>

      {/* Session info */}
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Thông tin buổi luyện</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="journal-lbl">Ngày luyện đề</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="journal-input" style={inputSt} />
          </div>
          <div>
            <label className="journal-lbl">Loại luyện</label>
            <select value={sessionType} onChange={e => setSessionType(e.target.value as "full" | "part")}
              className="journal-input" style={inputSt}>
              <option value="full">Full test</option>
              <option value="part">Part lẻ</option>
            </select>
          </div>
        </div>
        <div>
          <label className="journal-lbl">Tên đề</label>
          <input type="text" placeholder="ETS2024 Test 10 / Part 4 Test 5…" value={testName}
            onChange={e => setTestName(e.target.value)} className="journal-input" style={inputSt} />
        </div>
      </div>

      {/* Listening errors — 2-col grid */}
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Listening — lỗi theo loại
          {lsTotal > 0 && (
            <span className="ml-2 font-bold" style={{ color: "var(--accent-primary)" }}>({lsTotal} lỗi)</span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {LS_TYPES.map(t => (
            <div key={t.key} className="flex items-center justify-between gap-2">
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{t.label}</span>
              <Counter value={lsCounts[t.key]} onChange={v => setLsCounts(c => ({ ...c, [t.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Reading errors — 2-col grid */}
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Reading — lỗi theo loại
          {rdTotal > 0 && (
            <span className="ml-2 font-bold" style={{ color: "rgb(99,102,241)" }}>({rdTotal} lỗi)</span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {RD_TYPES.map(t => (
            <div key={t.key} className="flex items-center justify-between gap-2">
              <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{t.label}</span>
              <Counter value={rdCounts[t.key]} onChange={v => setRdCounts(c => ({ ...c, [t.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Individual error details */}
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", padding: "16px" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Chi tiết từng câu sai</p>
          <button type="button" onClick={addDetailRow}
            className="text-xs px-2 py-1"
            style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)", border: "none", cursor: "pointer" }}>
            + Thêm câu
          </button>
        </div>
        {details.length === 0 && (
          <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
            Tùy chọn — thêm chi tiết từng câu cụ thể
          </p>
        )}
        {details.map((d, idx) => (
          <div key={idx} className="p-3 mb-2 space-y-2" style={{ border: "1px solid var(--border)", background: "var(--bg-primary)" }}>
            <div className="flex gap-2">
              <select value={d.part ?? ""} onChange={e => updateDetail(idx, { part: e.target.value })}
                className="journal-input" style={{ ...inputSt, width: "auto", flex: "none", paddingRight: 6 }}>
                <option value="">Part</option>
                {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="text" placeholder="Câu số" value={d.qNum ?? ""}
                onChange={e => updateDetail(idx, { qNum: e.target.value })}
                className="journal-input" style={{ ...inputSt, width: 72 }} />
              <button type="button" onClick={() => removeDetail(idx)}
                className="ml-auto text-xs px-2 py-1"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>
            <input type="text" placeholder="Mô tả lỗi…" value={d.content ?? ""}
              onChange={e => updateDetail(idx, { content: e.target.value })}
              className="journal-input" style={inputSt} />
            <input type="text" placeholder="Paraphrase cần ghi nhớ…" value={d.paraphrase ?? ""}
              onChange={e => updateDetail(idx, { paraphrase: e.target.value })}
              className="journal-input" style={inputSt} />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || (lsTotal === 0 && rdTotal === 0 && details.length === 0)}
        className="journal-btn-primary w-full"
        style={{ padding: "12px 16px" }}
      >
        {saving ? "Đang lưu…" : `Lưu session · L:${lsTotal} + R:${rdTotal} lỗi`}
      </button>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({
  sessionKey, session, studentCode,
}: { sessionKey: string; session: ErrorLogEntry; studentCode: string }) {
  const [open, setOpen] = useState(false);
  const lsTotal = session.lsTotal ?? 0;
  const rdTotal = session.rdTotal ?? 0;
  const total = lsTotal + rdTotal;

  const lsEntries = session.listening
    ? LS_TYPES.map(t => ({ label: t.label, value: (session.listening as Record<string, number>)[t.key] ?? 0 })).filter(e => e.value > 0)
    : [];
  const rdEntries = session.reading
    ? RD_TYPES.map(t => ({ label: t.label, value: (session.reading as Record<string, number>)[t.key] ?? 0 })).filter(e => e.value > 0)
    : [];

  const details: ErrorDetail[] = Array.isArray(session.details)
    ? session.details
    : session.details ? Object.values(session.details) : [];

  const unreviewed = details.filter(d => d.reviewed !== "yes").length;

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 tracking-wider"
              style={{
                background: session.sessionType === "full" ? "rgba(196,98,45,0.1)" : "rgba(99,102,241,0.1)",
                color: session.sessionType === "full" ? "var(--accent-primary)" : "rgb(99,102,241)",
              }}
            >
              {session.sessionType === "full" ? "FULL" : "PART"}
            </span>
            <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {session.testName || fmtDate(session.date)}
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {session.testName ? fmtDate(session.date) + " · " : ""}
            L: <strong style={{ color: lsTotal > 0 ? "var(--accent-primary)" : "var(--text-muted)" }}>{lsTotal}</strong>
            {" "}lỗi · R: <strong style={{ color: rdTotal > 0 ? "rgb(99,102,241)" : "var(--text-muted)" }}>{rdTotal}</strong> lỗi
            {unreviewed > 0 && <span className="ml-2" style={{ color: "rgba(220,38,38,0.8)" }}>· {unreviewed} chưa ôn</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: "1.3rem",
              fontWeight: 700,
              color: total > 0 ? "var(--accent-primary)" : "var(--text-muted)",
            }}
          >
            {total}
          </span>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</p>
        </div>
      </div>

      {open && (
        <div className="px-4 py-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          {lsEntries.length > 0 && (
            <div>
              <span className="journal-lbl">Listening</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {lsEntries.map(e => (
                  <span
                    key={e.label}
                    className="text-xs px-2 py-0.5"
                    style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}
                  >
                    {e.label}: {e.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rdEntries.length > 0 && (
            <div>
              <span className="journal-lbl">Reading</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {rdEntries.map(e => (
                  <span
                    key={e.label}
                    className="text-xs px-2 py-0.5"
                    style={{ background: "rgba(99,102,241,0.1)", color: "rgb(99,102,241)" }}
                  >
                    {e.label}: {e.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {details.length > 0 && (
            <div>
              <span className="journal-lbl">Chi tiết câu sai</span>
              <div className="space-y-1.5 mt-1">
                {details.map((d, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 flex items-start gap-2"
                    style={{
                      border: "1px solid var(--border)",
                      background: d.reviewed === "yes" ? "rgba(74,124,89,0.05)" : "var(--bg-primary)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {d.part && (
                          <span className="text-[10px] px-1 py-0" style={{ background: "var(--border)", color: "var(--text-muted)" }}>
                            {d.part}
                          </span>
                        )}
                        {d.qNum && (
                          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Q{d.qNum}</span>
                        )}
                        {d.reviewed === "yes" && (
                          <span className="text-xs" style={{ color: "var(--accent-green)" }}>✓ Đã ôn</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-primary)" }}>{d.content}</p>
                      {d.paraphrase && (
                        <p className="text-xs mt-0.5 italic" style={{ color: "var(--accent-primary)" }}>→ {d.paraphrase}</p>
                      )}
                    </div>
                    {d.reviewed !== "yes" && (
                      <button
                        onClick={() => markDetailReviewed(studentCode, sessionKey, idx)}
                        className="shrink-0 text-xs px-2 py-0.5 whitespace-nowrap"
                        style={{ background: "rgba(74,124,89,0.1)", color: "var(--accent-green)", border: "none", cursor: "pointer" }}
                      >
                        Đã ôn ✓
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (window.confirm("Xoá session này?")) deleteErrorEntry(studentCode, sessionKey);
            }}
            className="text-xs"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            Xoá session này
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Aggregate Bar Chart ──────────────────────────────────────────────────────

function AggChart({ sessions }: { sessions: [string, ErrorLogEntry][] }) {
  const lsTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [, s] of sessions) {
      if (!s.listening) continue;
      for (const t of LS_TYPES) {
        m[t.label] = (m[t.label] ?? 0) + ((s.listening as Record<string, number>)[t.key] ?? 0);
      }
    }
    return Object.entries(m).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [sessions]);

  const rdTotals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [, s] of sessions) {
      if (!s.reading) continue;
      for (const t of RD_TYPES) {
        m[t.label] = (m[t.label] ?? 0) + ((s.reading as Record<string, number>)[t.key] ?? 0);
      }
    }
    return Object.entries(m).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sessions]);

  if (lsTotals.length === 0 && rdTotals.length === 0) return null;

  const maxAll = Math.max(...lsTotals.map(e => e[1]), ...rdTotals.map(e => e[1]), 1);

  return (
    <div className="p-4 space-y-4" style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <span className="journal-lbl">Phân tích lỗi tổng hợp</span>
      {lsTotals.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent-primary)" }}>Listening</p>
          <div className="space-y-2">
            {lsTotals.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)", width: 110 }}>{label}</span>
                <div className="flex-1 h-2 overflow-hidden" style={{ background: "var(--border)" }}>
                  <div style={{ width: `${(count / maxAll) * 100}%`, height: "100%", background: "var(--accent-primary)" }} />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: "var(--accent-primary)", width: 18, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {rdTotals.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "rgb(99,102,241)" }}>Reading</p>
          <div className="space-y-2">
            {rdTotals.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)", width: 110 }}>{label}</span>
                <div className="flex-1 h-2 overflow-hidden" style={{ background: "var(--border)" }}>
                  <div style={{ width: `${(count / maxAll) * 100}%`, height: "100%", background: "rgb(99,102,241)" }} />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: "rgb(99,102,241)", width: 18, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ sessions }: { sessions: [string, ErrorLogEntry][] }) {
  const totalLs = sessions.reduce((s, [, e]) => s + (e.lsTotal ?? 0), 0);
  const totalRd = sessions.reduce((s, [, e]) => s + (e.rdTotal ?? 0), 0);
  const totalSessions = sessions.length;
  const totalUnreviewed = sessions.reduce((s, [, e]) => {
    const d: ErrorDetail[] = Array.isArray(e.details) ? e.details : e.details ? Object.values(e.details) : [];
    return s + d.filter(x => x.reviewed !== "yes").length;
  }, 0);

  // Recent trend (last 5 sessions)
  const recent = sessions.slice(0, 5);

  if (sessions.length === 0) {
    return (
      <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có dữ liệu</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Chuyển sang tab "Nhập log" để ghi lỗi đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert */}
      {totalUnreviewed > 0 && (
        <div
          className="px-4 py-3 flex items-center gap-2 text-sm"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(220,38,38,0.9)" }}
        >
          ⚠ Còn <strong>{totalUnreviewed}</strong> câu sai chưa ôn
        </div>
      )}

      {/* Stats strip — 4 cells */}
      <div className="grid grid-cols-4" style={{ border: "1px solid var(--border)" }}>
        {[
          { label: "Sessions",   value: totalSessions, color: "var(--text-primary)" },
          { label: "LS lỗi",     value: totalLs,       color: "var(--accent-primary)" },
          { label: "RD lỗi",     value: totalRd,       color: "rgb(99,102,241)" },
          { label: "Chưa ôn",   value: totalUnreviewed, color: totalUnreviewed > 0 ? "rgba(220,38,38,0.8)" : "var(--text-muted)" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="py-3 text-center"
            style={{
              background: "var(--bg-elevated)",
              borderRight: i < 3 ? "1px solid var(--border)" : undefined,
            }}
          >
            <p
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: item.color,
                lineHeight: 1,
              }}
            >
              {item.value}
            </p>
            <span className="journal-lbl" style={{ marginBottom: 0 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Aggregate chart */}
      <AggChart sessions={sessions} />

      {/* Recent sessions mini-list */}
      {recent.length > 0 && (
        <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="journal-lbl">5 session gần nhất</span>
          </div>
          {recent.map(([key, s]) => {
            const total = (s.lsTotal ?? 0) + (s.rdTotal ?? 0);
            return (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {s.testName || fmtDate(s.date)}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {s.testName ? fmtDate(s.date) : ""}
                    {" "}L:{s.lsTotal ?? 0} · R:{s.rdTotal ?? 0}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: total > 0 ? "var(--accent-primary)" : "var(--text-muted)",
                  }}
                >
                  {total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────

function LogTab({ studentCode, sessions }: { studentCode: string; sessions: [string, ErrorLogEntry][] }) {
  return (
    <div className="space-y-4">
      <AddSessionForm studentCode={studentCode} />

      {sessions.length === 0 ? (
        <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có log nào</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Ghi lại lỗi sau mỗi lần luyện tập.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(([key, session]) => (
            <SessionCard key={key} sessionKey={key} session={session} studentCode={studentCode} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Paraphrase Tab ───────────────────────────────────────────────────────────

function AddParaphraseForm({ studentCode }: { studentCode: string }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [part, setPart] = useState(3);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!source.trim() || !target.trim()) return;
    setSaving(true);
    await addParaphraseEntry(studentCode, { source: source.trim(), target: target.trim(), part });
    setSource(""); setTarget(""); setPart(3);
    setOpen(false);
    setSaving(false);
  }

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>+ Thêm paraphrase</span>
        <span className="text-xs px-2 py-0.5" style={{ background: "rgba(196,98,45,0.1)", color: "var(--accent-primary)" }}>
          {open ? "Thu lại" : "Mở rộng"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-3">
            <label className="journal-lbl">Part</label>
            <select value={part} onChange={e => setPart(Number(e.target.value))}
              className="journal-input" style={inputSt}>
              {PARTS_NUM.map(p => <option key={p} value={p}>Part {p}</option>)}
            </select>
          </div>
          <div>
            <label className="journal-lbl">Câu gốc</label>
            <textarea rows={2} placeholder="The shipment was delayed due to bad weather."
              value={source} onChange={e => setSource(e.target.value)}
              className="journal-input" style={{ ...inputSt, resize: "none" }} />
          </div>
          <div>
            <label className="journal-lbl">Paraphrase</label>
            <textarea rows={2} placeholder="Bad weather caused the delay in delivery."
              value={target} onChange={e => setTarget(e.target.value)}
              className="journal-input" style={{ ...inputSt, resize: "none" }} />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !source.trim() || !target.trim()}
            className="journal-btn-primary w-full"
            style={{ padding: "10px 16px" }}
          >
            {saving ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── E12: Paraphrase Flashcard Modal ──────────────────────────────────────────

function ParaFlashcardModal({
  entries,
  studentCode,
  onClose,
}: {
  entries: [string, ParaphraseEntry][];
  studentCode: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knewCount, setKnewCount] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = entries.length;
  const current = entries[idx];

  async function handleKnew() {
    if (saving || !current) return;
    setSaving(true);
    try {
      await reviewParaphraseEntry(studentCode, current[0], current[1].repCount);
      setKnewCount(k => k + 1);
    } finally {
      setSaving(false);
    }
    next();
  }

  function handleDidntKnow() {
    next();
  }

  function next() {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  }

  // Trap scroll behind modal
  if (done) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(44,30,15,.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "var(--bg-elevated,#FBF7F2)",
            padding: "2rem 2rem 1.5rem",
            width: "calc(100vw - 3rem)",
            maxWidth: 400,
            textAlign: "center",
            boxShadow: "0 12px 40px rgba(44,30,15,.25)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: ".5rem" }}>🎉</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2C1E0F", marginBottom: ".3rem" }}>
            Xong rồi!
          </div>
          <div style={{ fontSize: ".85rem", color: "#9A8672", marginBottom: "1.25rem" }}>
            Biết <strong style={{ color: "#4A7C59" }}>{knewCount}</strong> / {total} paraphrase
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#C4622D", color: "#fff",
              border: "none", padding: ".6rem 1.6rem",
              fontWeight: 600, fontSize: ".85rem",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const [, entry] = current;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(44,30,15,.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-elevated,#FBF7F2)",
          width: "calc(100vw - 2rem)",
          maxWidth: 440,
          boxShadow: "0 12px 40px rgba(44,30,15,.25)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: ".65rem 1rem",
            borderBottom: "1px solid var(--border,#DDD0BC)",
          }}
        >
          <span style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#9A8672" }}>
            Paraphrase Flashcard
          </span>
          <span style={{ fontSize: ".75rem", color: "#9A8672", fontFamily: "'JetBrains Mono', monospace" }}>
            {idx + 1}/{total}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid var(--border,#DDD0BC)",
              color: "#9A8672", width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: ".9rem", cursor: "pointer", lineHeight: 1,
            }}
            aria-label="Đóng"
          >×</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(0,0,0,0.06)" }}>
          <div style={{
            height: "100%",
            width: `${((idx) / total) * 100}%`,
            background: "#C4622D",
            transition: "width .3s ease",
          }} />
        </div>

        {/* Card area */}
        <div style={{ padding: "1.5rem 1.25rem", minHeight: 180 }}>
          {/* Part tag */}
          <div style={{ marginBottom: ".75rem" }}>
            <span style={{
              fontSize: ".6rem", fontWeight: 700, letterSpacing: ".1em",
              textTransform: "uppercase",
              padding: ".15rem .5rem",
              background: "rgba(196,98,45,.1)", color: "#C4622D",
            }}>
              Part {entry.part}
            </span>
          </div>

          {/* Front: source */}
          <div
            style={{
              fontSize: ".95rem",
              fontWeight: 600,
              color: "#2C1E0F",
              lineHeight: 1.5,
              marginBottom: "1rem",
            }}
          >
            {entry.source}
          </div>

          {/* Back: target (revealed on click or button) */}
          {flipped ? (
            <div
              style={{
                background: "rgba(196,98,45,.07)",
                border: "1px solid rgba(196,98,45,.2)",
                padding: ".75rem 1rem",
                borderRadius: 2,
                fontSize: ".9rem",
                color: "#C4622D",
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              → {entry.target}
            </div>
          ) : (
            <button
              onClick={() => setFlipped(true)}
              style={{
                background: "var(--bg-primary,#F5EFE6)",
                border: "1px solid var(--border,#DDD0BC)",
                color: "#9A8672",
                padding: ".6rem 1.1rem",
                fontSize: ".8rem",
                cursor: "pointer",
                width: "100%",
                fontWeight: 500,
              }}
            >
              Lật thẻ để xem đáp án
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: ".75rem",
            padding: ".85rem 1.25rem 1.1rem",
            borderTop: "1px solid var(--border,#DDD0BC)",
          }}
        >
          {flipped ? (
            <>
              <button
                onClick={handleDidntKnow}
                style={{
                  flex: 1, padding: ".65rem",
                  border: "1px solid rgba(176,58,42,.3)",
                  background: "rgba(176,58,42,.07)",
                  color: "#B03A2A",
                  fontWeight: 600, fontSize: ".85rem",
                  cursor: "pointer",
                }}
              >
                ✗ Không biết
              </button>
              <button
                onClick={handleKnew}
                disabled={saving}
                style={{
                  flex: 1, padding: ".65rem",
                  border: "none",
                  background: saving ? "#9A8672" : "#4A7C59",
                  color: "#fff",
                  fontWeight: 600, fontSize: ".85rem",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                ✓ Biết
              </button>
            </>
          ) : (
            <button
              onClick={handleDidntKnow}
              style={{
                flex: 1, padding: ".65rem",
                border: "1px solid var(--border,#DDD0BC)",
                background: "none",
                color: "#9A8672",
                fontWeight: 500, fontSize: ".85rem",
                cursor: "pointer",
              }}
            >
              Bỏ qua
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ParaphraseCard({ entryKey, entry, studentCode }: { entryKey: string; entry: ParaphraseEntry; studentCode: string }) {
  const [revealed, setRevealed] = useState(false);

  async function handleReview() {
    setRevealed(true);
    await reviewParaphraseEntry(studentCode, entryKey, entry.repCount);
  }

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 tracking-wider"
            style={{ background: "rgba(196,98,45,0.08)", color: "var(--accent-primary)" }}
          >
            P{entry.part}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ×{entry.repCount}{entry.lastReview ? ` · ${fmtDate(entry.lastReview)}` : ""}
            </span>
            <button
              onClick={() => deleteParaphraseEntry(studentCode, entryKey)}
              style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}
            >
              ✕
            </button>
          </div>
        </div>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{entry.source}</p>
        {revealed ? (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>{entry.target}</p>
          </div>
        ) : (
          <button
            onClick={handleReview}
            className="mt-2 text-xs font-medium"
            style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            Xem paraphrase & đánh dấu đã ôn →
          </button>
        )}
      </div>
    </div>
  );
}

function ParaphraseTab({ studentCode, entries }: { studentCode: string; entries: [string, ParaphraseEntry][] }) {
  const [filterPart, setFilterPart] = useState(0);
  const [flashcardOpen, setFlashcardOpen] = useState(false);

  const td = localToday();
  const dueEntries = entries.filter(([, e]) => isParaDue(e, td));

  const sorted = useMemo(() => (
    [...entries]
      .filter(([, e]) => filterPart === 0 || e.part === filterPart)
      .sort(([, a], [, b]) => {
        if (a.repCount !== b.repCount) return a.repCount - b.repCount;
        return (a.lastReview ?? "0").localeCompare(b.lastReview ?? "0");
      })
  ), [entries, filterPart]);

  const partCounts = useMemo(() => {
    const m: Record<number, number> = {};
    for (const [, e] of entries) m[e.part] = (m[e.part] ?? 0) + 1;
    return m;
  }, [entries]);

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3" style={{ border: "1px solid var(--border)" }}>
        {[
          { label: "Tổng paraphrase", value: entries.length, color: "var(--accent-primary)" },
          { label: "Đến hạn ôn", value: dueEntries.length, color: dueEntries.length > 0 ? "#B03A2A" : "var(--text-primary)" },
          { label: "Chưa ôn lần nào", value: entries.filter(([, e]) => !e.lastReview).length, color: "var(--text-primary)" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="py-3 text-center"
            style={{ background: "var(--bg-elevated)", borderRight: i < 2 ? "1px solid var(--border)" : undefined }}
          >
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </p>
            <span className="journal-lbl" style={{ marginBottom: 0, fontSize: ".6rem" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* E12: Flashcard button */}
      {dueEntries.length > 0 && (
        <button
          onClick={() => setFlashcardOpen(true)}
          style={{
            width: "100%",
            padding: ".7rem",
            background: "#C4622D",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            fontSize: ".85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".5rem",
          }}
        >
          🃏 Luyện Flashcard — {dueEntries.length} thẻ đến hạn
        </button>
      )}

      {flashcardOpen && (
        <ParaFlashcardModal
          entries={dueEntries}
          studentCode={studentCode}
          onClose={() => setFlashcardOpen(false)}
        />
      )}

      <AddParaphraseForm studentCode={studentCode} />

      {entries.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterPart(0)}
            className="px-3 py-1 text-xs font-medium"
            style={filterPart === 0
              ? { background: "var(--accent-primary)", color: "#FBF7F2", border: "none", cursor: "pointer" }
              : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            Tất cả ({entries.length})
          </button>
          {PARTS_NUM.filter(p => partCounts[p]).map(p => (
            <button
              key={p}
              onClick={() => setFilterPart(p)}
              className="px-3 py-1 text-xs font-medium"
              style={filterPart === p
                ? { background: "var(--accent-primary)", color: "#FBF7F2", border: "none", cursor: "pointer" }
                : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}
            >
              P{p} ({partCounts[p]})
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
          <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có paraphrase</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Lưu lại các cặp paraphrase để ôn tập.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(([key, entry]) => (
            <ParaphraseCard key={key} entryKey={key} entry={entry} studentCode={studentCode} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ErrorLogPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { student, loading: studentLoading } = useStudent(profile?.studentCode);
  const [tab, setTab] = useState<"log" | "dashboard" | "paraphrase">("log");

  const loading = profileLoading || studentLoading;

  const sessionEntries = useMemo(() => {
    const raw = student?.errorLog ?? {};
    return (Object.entries(raw) as [string, ErrorLogEntry][])
      .sort(([, a], [, b]) => b.date.localeCompare(a.date));
  }, [student?.errorLog]);

  const paraphraseEntries = useMemo(
    () => Object.entries(student?.paraphraseLog ?? {}) as [string, ParaphraseEntry][],
    [student?.paraphraseLog]
  );

  const dueParaCount = useMemo(() => {
    const td = localToday();
    return paraphraseEntries.filter(([, e]) => isParaDue(e, td)).length;
  }, [paraphraseEntries]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20" style={{ background: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (!profile?.studentCode) {
    return (
      <div className="p-8 border text-center" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Chưa có mã học viên</p>
      </div>
    );
  }

  const tabs = [
    { key: "log" as const, label: `Nhập log${sessionEntries.length > 0 ? ` (${sessionEntries.length})` : ""}`, badge: 0 },
    { key: "dashboard" as const, label: "Dashboard", badge: 0 },
    { key: "paraphrase" as const, label: `Paraphrase${paraphraseEntries.length > 0 ? ` (${paraphraseEntries.length})` : ""}`, badge: dueParaCount },
  ];

  return (
    <div className="space-y-5">
      <h1 className="journal-page-hd" style={{ marginBottom: 0 }}>Nhật ký lỗi</h1>

      {/* 3-tab bar */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-sm font-medium"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom: tab === t.key ? "2px solid var(--accent-primary)" : "2px solid transparent",
              color: tab === t.key ? "var(--accent-primary)" : "var(--text-muted)",
              marginBottom: -1,
              transition: "color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: ".35rem",
            }}
          >
            {t.label}
            {t.badge > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 16,
                  height: 16,
                  borderRadius: 99,
                  background: "#B03A2A",
                  color: "#fff",
                  fontSize: ".55rem",
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: "0 .3rem",
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <LogTab studentCode={profile.studentCode} sessions={sessionEntries} />
      )}
      {tab === "dashboard" && (
        <DashboardTab sessions={sessionEntries} />
      )}
      {tab === "paraphrase" && (
        <ParaphraseTab studentCode={profile.studentCode} entries={paraphraseEntries} />
      )}
    </div>
  );
}
