"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import {
  Q67_TESTS,
  Q67_DIFF_META,
  Q67_FORM_CHECKS,
  Q67_PART_KEY,
  Q67_SECONDS_PER_QUESTION,
  Q67_SOURCE_LESSON,
  computeQ67Score,
  promptsOfTest,
  type Q67Difficulty,
  type Q67Prompt,
  type Q67Test,
} from "@/lib/skills/writing-q6-7";

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";
const AMBER = "rgb(234,179,8)";

type Mode = "practice" | "exam";
type Phase = "list" | "doing" | "review";

type BestMap = Record<string, { score: number; passed: boolean }>;

type Props = {
  skill: Skill;
  unit: SkillUnit;
  userId: string | null;
  isTestUser: boolean;
  /** HV đã đăng ký khoá học → được gửi bài cho giáo viên chấm. */
  canSubmit: boolean;
  bestByTest: BestMap;
};

// ─────────────────────────────────────
// Tiện ích
// ─────────────────────────────────────

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function wordCount(t: string): number {
  const s = t.trim();
  return s ? s.split(/\s+/).length : 0;
}

function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

// ─────────────────────────────────────
// Khối e-mail đề
// ─────────────────────────────────────

function PromptPanel({ prompt, index }: { prompt: Q67Prompt; index: number }) {
  const rows: [string, string | undefined][] = [
    ["FROM", prompt.email.from],
    ["TO", prompt.email.to],
    ["SUBJECT", prompt.email.subject],
    ["SENT", prompt.email.sent],
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.9rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>Question {index + 1}:</span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 7px" }}>
          Đề {prompt.no} · {Q67_SOURCE_LESSON[prompt.no] ?? ""}
        </span>
      </div>

      <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>Read the e-mail.</p>

      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--bg-secondary)", marginBottom: "0.9rem" }}>
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 10, padding: "5px 12px", borderBottom: "1px solid var(--border)", fontSize: "0.79rem" }}>
            <span style={{ minWidth: 62, color: "var(--text-muted)", fontWeight: 600 }}>{k}:</span>
            <span style={{ color: "var(--text-primary)" }}>{v}</span>
          </div>
        ))}
        <div style={{ padding: "10px 12px" }}>
          {prompt.email.body.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "0.55rem 0 0", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-primary)" }}>{p}</p>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 13px", borderRadius: 8, background: "rgba(234,179,8,0.09)", border: "1px solid rgba(234,179,8,0.32)" }}>
        <p style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.65, color: "var(--text-primary)", fontStyle: "italic" }}>
          <strong style={{ fontStyle: "normal" }}>Directions:</strong> {prompt.directions}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Màn tự chấm sau khi nộp
// ─────────────────────────────────────

/**
 * Màu đánh dấu cho mission 1..4 trong Model Answer.
 * Tránh tông xanh lá vì khung Model Answer đã viền xanh lá — dễ nhìn nhầm.
 */
const MISSION_COLORS = ["rgb(59,130,246)", "rgb(168,85,247)", "rgb(217,119,6)", "rgb(219,39,119)"];
const CIRCLED = ["①", "②", "③", "④"];

function tint(rgb: string, a: number): string {
  return rgb.replace("rgb", "rgba").replace(")", `,${a})`);
}

function Pane({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, border: `1px solid ${accent ?? "var(--border)"}`, borderRadius: 9, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "5px 11px", background: accent ? tint(accent, 0.1) : "var(--bg-elevated)", borderBottom: `1px solid ${accent ?? "var(--border)"}`, fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", color: accent ?? "var(--text-muted)" }}>
        {title}
      </div>
      <div style={{ padding: "9px 12px", background: "var(--bg-secondary)", flex: 1 }}>{children}</div>
    </div>
  );
}

function ReviewCard({
  prompt,
  answer,
  missionsDone,
  formDone,
  onToggleMission,
  onToggleForm,
  narrow,
}: {
  prompt: Q67Prompt;
  answer: string;
  missionsDone: boolean[];
  formDone: boolean[];
  onToggleMission: (i: number) => void;
  onToggleForm: (i: number) => void;
  narrow: boolean;
}) {
  const words = wordCount(answer);
  const score = computeQ67Score(missionsDone, formDone, words >= 10);
  const color = score.ets >= 4 ? GREEN : score.ets >= 2 ? AMBER : RED;

  const lineMission = new Map<number, number>();
  prompt.missionLines.forEach((ln, mi) => lineMission.set(ln, mi));

  return (
    <div>
      {/* Directions + điểm ETS trên cùng một hàng */}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: "0.85rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", padding: "8px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.55, color: "var(--text-primary)", fontStyle: "italic" }}>
            <strong style={{ fontStyle: "normal" }}>Directions:</strong> {prompt.directions}
          </p>
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 78, padding: "4px 14px", borderRadius: 8, background: tint(color, 0.1), border: `1.5px solid ${tint(color, 0.4)}` }}>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1.1 }}>
            {score.ets}<span style={{ fontSize: "0.72rem", fontWeight: 600 }}>/4</span>
          </span>
          <span style={{ fontSize: "0.64rem", fontWeight: 700, color, letterSpacing: "0.04em" }}>{score.label}</span>
        </div>
      </div>

      {/* Hai cột so sánh */}
      <div style={{ display: "flex", gap: 10, flexDirection: narrow ? "column" : "row", marginBottom: "1rem", alignItems: "stretch" }}>
        <Pane title={`BÀI CỦA BẠN · ${words} từ`}>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "0.84rem", lineHeight: 1.65, color: "var(--text-primary)" }}>
            {answer.trim() || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(bỏ trống)</span>}
          </div>
        </Pane>

        <Pane title="MODEL ANSWER" accent={GREEN}>
          {prompt.modelAnswer.map((l, i) => {
            const mi = lineMission.get(i);
            if (mi === undefined) {
              return (
                <p key={i} style={{ margin: 0, padding: "1px 0", fontSize: "0.84rem", lineHeight: 1.6, color: "var(--text-muted)" }}>{l}</p>
              );
            }
            const c = MISSION_COLORS[mi % MISSION_COLORS.length];
            return (
              <p key={i} style={{ margin: "3px 0", padding: "3px 8px", fontSize: "0.84rem", lineHeight: 1.6, color: "var(--text-primary)", fontWeight: 500, background: tint(c, 0.09), borderLeft: `3px solid ${c}`, borderRadius: "0 5px 5px 0" }}>
                <span style={{ color: c, fontWeight: 800, marginRight: 5 }}>{CIRCLED[mi] ?? mi + 1}</span>
                {l}
              </p>
            );
          })}
        </Pane>
      </div>

      {/* Checklist mission */}
      <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.45rem" }}>
        Bài của bạn làm được mission nào? <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>— đối chiếu với các dòng được đánh số bên Model Answer</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: "0.85rem" }}>
        {prompt.missions.map((m, i) => {
          const c = MISSION_COLORS[i % MISSION_COLORS.length];
          const on = missionsDone[i];
          return (
            <button
              key={i}
              onClick={() => onToggleMission(i)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", borderRadius: 7, border: `1.5px solid ${on ? tint(GREEN, 0.5) : "var(--border)"}`, background: on ? tint(GREEN, 0.08) : "var(--bg-secondary)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span style={{ flexShrink: 0, width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${on ? GREEN : "var(--border)"}`, background: on ? GREEN : "transparent", color: "#fff", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {on ? "✓" : ""}
              </span>
              <span style={{ flexShrink: 0, color: c, fontWeight: 800, fontSize: "0.85rem" }}>{CIRCLED[i] ?? i + 1}</span>
              <span style={{ fontSize: "0.84rem", lineHeight: 1.5, color: "var(--text-primary)" }}>{m}</span>
            </button>
          );
        })}
      </div>

      {/* Khuôn thư — chip nhỏ */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: "0.85rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>Khuôn thư:</span>
        {["Xưng hô", "Câu chào đầu", "Câu kết", "Chào cuối + ký tên"].map((short, i) => {
          const on = formDone[i];
          return (
            <button
              key={i}
              onClick={() => onToggleForm(i)}
              title={Q67_FORM_CHECKS[i]}
              style={{ padding: "3px 11px", fontSize: "0.76rem", fontWeight: 600, borderRadius: 999, border: `1.5px solid ${on ? tint(GREEN, 0.5) : "var(--border)"}`, background: on ? tint(GREEN, 0.1) : "var(--bg-secondary)", color: on ? GREEN : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
            >
              {on ? "✓ " : ""}{short}
            </button>
          );
        })}
      </div>

      {/* Lưu ý riêng của đề */}
      <details>
        <summary style={{ fontSize: "0.76rem", color: "var(--accent-primary)", cursor: "pointer", fontWeight: 700 }}>
          Bẫy riêng của đề này
        </summary>
        <p style={{ margin: "5px 0 0", fontSize: "0.79rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{prompt.note}</p>
      </details>
    </div>
  );
}
// ─────────────────────────────────────
// Lưu nháp bài viết (localStorage)
// ─────────────────────────────────────

const DRAFT_PREFIX = "q67-draft:";
const DRAFT_VERSION = 1;

type Draft = {
  v: number;
  mode: Mode;
  qIdx: number;
  answers: string[];
  locked: boolean[];
  elapsed: number;
  /** epoch ms — chỉ ở chế độ thi thử, để tải lại trang không làm đồng hồ chạy lại từ đầu */
  deadlineAt?: number;
  savedAt: number;
};

function readDrafts(): Record<string, Draft> {
  const out: Record<string, Draft> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(DRAFT_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const d = JSON.parse(raw) as Draft;
      if (d?.v === DRAFT_VERSION && Array.isArray(d.answers)) out[k.slice(DRAFT_PREFIX.length)] = d;
    }
  } catch {
    // localStorage bị chặn (chế độ riêng tư) — chỉ mất tính năng lưu nháp
  }
  return out;
}

function writeDraft(slug: string, d: Draft) {
  try { localStorage.setItem(DRAFT_PREFIX + slug, JSON.stringify(d)); } catch { /* hết dung lượng hoặc bị chặn */ }
}

function clearDraft(slug: string) {
  try { localStorage.removeItem(DRAFT_PREFIX + slug); } catch { /* bỏ qua */ }
}

function agoLabel(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
}

// ─────────────────────────────────────
// Main
// ─────────────────────────────────────

export function WritingEmailClient({ skill, unit, userId, isTestUser, canSubmit, bestByTest }: Props) {
  const narrow = useIsNarrow();

  const [phase, setPhase] = useState<Phase>("list");
  const [mode, setMode] = useState<Mode>("practice");
  const [test, setTest] = useState<Q67Test | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [qLeft, setQLeft] = useState(Q67_SECONDS_PER_QUESTION);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [missionMarks, setMissionMarks] = useState<boolean[][]>([]);
  const [formMarks, setFormMarks] = useState<boolean[][]>([]);
  const [saved, setSaved] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [ratio, setRatio] = useState(0.5);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [draftAt, setDraftAt] = useState<number | null>(null);
  const dragRef = useRef(false);
  const elapsedRef = useRef(0);
  const elapsedBaseRef = useRef(0);
  const sessionStartRef = useRef(0);

  const prompts = useMemo(() => (test ? promptsOfTest(test) : []), [test]);
  const current = prompts[qIdx];

  // ── Nạp nháp đã lưu (chỉ chạy ở client để tránh lệch hydration) ──
  useEffect(() => { setDrafts(readDrafts()); }, []);

  // ── Đồng hồ: tính theo mốc thời gian tuyệt đối nên không lệch khi tab chạy nền ──
  useEffect(() => {
    if (phase !== "doing") return;
    const tick = () => {
      const e = elapsedBaseRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
      elapsedRef.current = e;
      setElapsed(e);
      if (mode === "exam" && deadlineAt) setQLeft(Math.ceil((deadlineAt - Date.now()) / 1000));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, mode, deadlineAt]);

  const finish = useCallback(() => {
    if (test) {
      clearDraft(test.slug);
      setDrafts((prev) => { const n = { ...prev }; delete n[test.slug]; return n; });
    }
    setDraftAt(null);
    setPhase("review");
  }, [test]);

  const startNextDeadline = useCallback(() => {
    const dl = Date.now() + Q67_SECONDS_PER_QUESTION * 1000;
    setDeadlineAt(dl);
    setQLeft(Q67_SECONDS_PER_QUESTION);
  }, []);

  // ── Chế độ thi thử: hết 10 phút thì khoá câu và chuyển ──
  useEffect(() => {
    if (phase !== "doing" || mode !== "exam" || qLeft > 0) return;
    setLocked((prev) => { const n = [...prev]; n[qIdx] = true; return n; });
    if (qIdx < prompts.length - 1) {
      setQIdx((i) => i + 1);
      startNextDeadline();
    } else {
      finish();
    }
  }, [qLeft, phase, mode, qIdx, prompts.length, finish, startNextDeadline]);

  // ── Tự lưu nháp khi đang làm bài ──
  useEffect(() => {
    if (phase !== "doing" || !test) return;
    const slug = test.slug;
    // Chưa gõ chữ nào thì không tạo nháp; nếu học viên xoá sạch bài thì bỏ nháp cũ đi
    if (!answers.some((a) => a.trim())) {
      clearDraft(slug);
      setDrafts((prev) => { if (!prev[slug]) return prev; const n = { ...prev }; delete n[slug]; return n; });
      setDraftAt(null);
      return;
    }
    const id = setTimeout(() => {
      const d: Draft = {
        v: DRAFT_VERSION,
        mode,
        qIdx,
        answers,
        locked,
        elapsed: elapsedRef.current,
        deadlineAt: deadlineAt ?? undefined,
        savedAt: Date.now(),
      };
      writeDraft(test.slug, d);
      setDrafts((prev) => ({ ...prev, [test.slug]: d }));
      setDraftAt(d.savedAt);
    }, 600);
    return () => clearTimeout(id);
  }, [phase, test, mode, qIdx, answers, locked, deadlineAt]);

  // ── Kéo thanh chia đôi màn hình ──
  useEffect(() => {
    function move(e: PointerEvent) {
      if (!dragRef.current) return;
      const r = Math.min(0.75, Math.max(0.25, e.clientX / window.innerWidth));
      setRatio(r);
    }
    function up() { dragRef.current = false; }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  /** `resume` = nháp đã lưu; bỏ trống thì bắt đầu bài mới và xoá nháp cũ. */
  function start(t: Q67Test, m: Mode, resume?: Draft) {
    const ps = promptsOfTest(t);
    // Nháp chỉ dùng được nếu số câu vẫn khớp — phòng trường hợp bộ đề đã đổi
    const r = resume && resume.answers.length === ps.length && resume.locked?.length === ps.length ? resume : undefined;
    const useMode = r?.mode ?? m;

    if (!r) {
      clearDraft(t.slug);
      setDrafts((prev) => { const n = { ...prev }; delete n[t.slug]; return n; });
    }

    setTest(t);
    setMode(useMode);
    setQIdx(r?.qIdx ?? 0);
    setAnswers(r?.answers ?? ps.map(() => ""));
    setLocked(r?.locked ?? ps.map(() => false));
    setMissionMarks(ps.map((p) => p.missions.map(() => false)));
    setFormMarks(ps.map(() => Q67_FORM_CHECKS.map(() => false)));

    const base = r?.elapsed ?? 0;
    elapsedBaseRef.current = base;
    elapsedRef.current = base;
    sessionStartRef.current = Date.now();
    setElapsed(base);

    // Thi thử: giữ nguyên mốc hết giờ đã lưu, nên tải lại trang không được thêm thời gian
    const dl = useMode === "exam" ? (r?.deadlineAt ?? Date.now() + Q67_SECONDS_PER_QUESTION * 1000) : null;
    setDeadlineAt(dl);
    setQLeft(dl ? Math.max(0, Math.ceil((dl - Date.now()) / 1000)) : Q67_SECONDS_PER_QUESTION);

    setSaved(false);
    setReviewIdx(0);
    setDraftAt(r?.savedAt ?? null);
    setPhase("doing");
  }

  function goto(i: number) {
    if (mode === "exam") return; // thi thử: không cho quay lại
    setQIdx(i);
  }

  function submitCurrent() {
    if (mode === "exam") {
      setLocked((prev) => { const n = [...prev]; n[qIdx] = true; return n; });
      if (qIdx < prompts.length - 1) {
        setQIdx((i) => i + 1);
        startNextDeadline();
      } else {
        finish();
      }
      return;
    }
    if (qIdx < prompts.length - 1) setQIdx((i) => i + 1);
    else finish();
  }

  function saveResults() {
    if (!test || !userId || isTestUser) { setSaved(true); return; }
    const scores = prompts.map((p, i) =>
      computeQ67Score(missionMarks[i] ?? [], formMarks[i] ?? [], wordCount(answers[i] ?? "") >= 10),
    );
    scores.forEach((s, i) => {
      fetch("/api/subskills/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part: Q67_PART_KEY, questionWord: test.slug, exerciseIndex: 0, score: s.pct, passed: s.ets >= 3, itemIdx: i }),
      }).catch(() => {});
    });
    const avg = Math.round(scores.reduce((a, s) => a + s.pct, 0) / (scores.length || 1));
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ part: Q67_PART_KEY, questionWord: test.slug, exerciseIndex: 0, score: avg, passed: avg >= 75, itemIdx: null }),
    }).catch(() => {});
    setSaved(true);
  }

  // ══════════════════════════════════════
  // Màn kết quả
  // ══════════════════════════════════════
  if (phase === "review" && test) {
    const scores = prompts.map((p, i) =>
      computeQ67Score(missionMarks[i] ?? [], formMarks[i] ?? [], wordCount(answers[i] ?? "") >= 10),
    );
    const avgEts = scores.reduce((a, s) => a + s.ets, 0) / (scores.length || 1);

    return (
      <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.2rem, 4vw, 2.2rem) clamp(1rem, 5vw, 3rem)", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: "1.8rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 6px" }}>
            {Q67_DIFF_META[test.difficulty].label} · {test.label} · {mode === "exam" ? "Thi thử" : "Luyện tập"}
          </p>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {avgEts.toFixed(1)}<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/4</span>
          </div>
          <p style={{ margin: "0.4rem 0 0", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
            Điểm trung bình {prompts.length} câu · thời gian làm bài {fmt(elapsed)}
          </p>
        </div>

        <details style={{ marginBottom: "1.1rem" }}>
          <summary style={{ fontSize: "0.79rem", color: "var(--text-muted)", cursor: "pointer", textAlign: "center" }}>
            Phần này <strong style={{ color: "var(--text-secondary)" }}>không chấm tự động</strong> — bạn tự tick, điểm tính theo đó. <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Xem cách tính điểm</span>
          </summary>
          <p style={{ margin: "0.6rem auto 0", maxWidth: 620, fontSize: "0.79rem", lineHeight: 1.7, color: "var(--text-muted)", textAlign: "center" }}>
            Đủ mission + đúng khuôn thư = <strong>4</strong> · đủ mission nhưng thiếu khuôn = <strong>3</strong> ·
            làm được từ nửa số mission = <strong>2</strong> · dưới nửa = <strong>1</strong> · không mission nào = <strong>0</strong>.
          </p>
        </details>

        {/* Tab từng câu */}
        {prompts.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: "1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
            {prompts.map((p, i) => {
              const s = scores[i];
              const on = i === reviewIdx;
              const c = s.ets >= 4 ? GREEN : s.ets >= 2 ? AMBER : RED;
              return (
                <button
                  key={p.id}
                  onClick={() => setReviewIdx(i)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", border: "none", background: "none", borderBottom: `2px solid ${on ? "var(--accent-primary)" : "transparent"}`, color: on ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}
                >
                  Câu {i + 1}
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: c, background: c.replace("rgb", "rgba").replace(")", ",0.12)"), borderRadius: 4, padding: "1px 6px" }}>
                    {s.ets}/4
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {prompts[reviewIdx] && (
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.1rem 1.2rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)", marginBottom: "1.2rem" }}>
            <ReviewCard
              key={prompts[reviewIdx].id}
              prompt={prompts[reviewIdx]}
              answer={answers[reviewIdx] ?? ""}
              missionsDone={missionMarks[reviewIdx] ?? []}
              formDone={formMarks[reviewIdx] ?? []}
              onToggleMission={(k) => setMissionMarks((prev) => { const n = prev.map((r) => [...r]); n[reviewIdx][k] = !n[reviewIdx][k]; return n; })}
              onToggleForm={(k) => setFormMarks((prev) => { const n = prev.map((r) => [...r]); n[reviewIdx][k] = !n[reviewIdx][k]; return n; })}
              narrow={narrow}
            />
          </div>
        )}

        {userId && (
          <div style={{ marginBottom: "1.2rem" }}>
            <SubmissionPanel
              skill={skill.slug}
              unit={unit.slug}
              testKey={test.slug}
              title={`${skill.label} ${unit.label} · ${Q67_DIFF_META[test.difficulty].label} ${test.label}`}
              canSubmit={canSubmit}
              buildItems={() =>
                prompts.map((p, i) => ({
                  idx: i,
                  prompt: p.directions,
                  text: answers[i] ?? "",
                }))
              }
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <button
            onClick={saveResults}
            disabled={saved}
            style={{ padding: "9px 22px", border: "none", background: saved ? "var(--bg-elevated)" : "var(--accent-primary)", color: saved ? "var(--text-muted)" : "#fff", borderRadius: 8, fontSize: "0.86rem", fontWeight: 700, cursor: saved ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {saved ? "Đã lưu kết quả ✓" : "Lưu kết quả tự đánh giá"}
          </button>
          <button onClick={() => start(test, mode)} style={{ padding: "9px 22px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit" }}>Làm lại bộ này</button>
          <button onClick={() => setPhase("list")} style={{ padding: "9px 22px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit" }}>← Về danh sách bộ đề</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // Màn làm bài — bố cục 2 cột
  // ══════════════════════════════════════
  if (phase === "doing" && test && current) {
    const answered = answers.filter((a) => wordCount(a) >= 10).length;
    const isLocked = locked[qIdx];
    const leftPct = narrow ? 100 : ratio * 100;

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
        {/* Thanh trên cùng */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.7rem clamp(0.8rem, 3vw, 1.6rem)", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", flexWrap: "wrap" }}>
          <button onClick={() => setPhase("list")} title="Bài viết đã được lưu nháp, thoát ra vẫn quay lại làm tiếp được" style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: 0, flexShrink: 0 }}>← Thoát</button>
          {draftAt && (
            <span style={{ fontSize: "0.72rem", color: GREEN, fontWeight: 600, flexShrink: 0 }} title="Bài viết được tự lưu trên máy này">
              ✓ đã lưu nháp
            </span>
          )}
          <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            WRITING Q6-7: Respond to a written request
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 14px", borderRadius: 999, border: `1.5px solid ${mode === "exam" && qLeft <= 60 ? "rgba(239,68,68,0.5)" : "var(--border)"}`, background: mode === "exam" && qLeft <= 60 ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)" }}>
            <span style={{ fontSize: "0.8rem" }}>⏱</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: mode === "exam" && qLeft <= 60 ? RED : "var(--text-primary)" }}>
              {mode === "exam" ? fmt(qLeft) : fmt(elapsed)}
            </span>
          </span>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: mode === "exam" ? RED : "var(--accent-primary)", border: `1px solid ${mode === "exam" ? "rgba(239,68,68,0.4)" : "var(--accent-primary)"}`, borderRadius: 5, padding: "2px 9px" }}>
            {mode === "exam" ? "THI THỬ" : "LUYỆN TẬP"}
          </span>
        </div>

        {/* Hai cột */}
        <div style={{ flex: 1, display: "flex", flexDirection: narrow ? "column" : "row", minHeight: 0 }}>
          <div style={{ width: narrow ? "100%" : `${leftPct}%`, overflowY: "auto", padding: "1.1rem clamp(0.9rem, 2vw, 1.4rem)", boxSizing: "border-box" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.2rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
              <PromptPanel prompt={current} index={qIdx} />
            </div>
          </div>

          {!narrow && (
            <div
              onPointerDown={() => { dragRef.current = true; }}
              style={{ width: 7, cursor: "col-resize", background: "var(--border)", flexShrink: 0, position: "relative" }}
              title="Kéo để đổi tỉ lệ hai cột"
            >
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "0.65rem", color: "var(--text-muted)", pointerEvents: "none" }}>↔</span>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "1.1rem clamp(0.9rem, 2vw, 1.4rem)", boxSizing: "border-box", minWidth: 0 }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.2rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", minHeight: narrow ? 320 : "calc(100vh - 210px)" }}>
              <p style={{ margin: "0 0 0.7rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Your answer:</p>
              <textarea
                value={answers[qIdx] ?? ""}
                onChange={(e) => setAnswers((prev) => { const n = [...prev]; n[qIdx] = e.target.value; return n; })}
                disabled={isLocked}
                placeholder="Type your response here"
                style={{ flex: 1, width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "0.92rem", lineHeight: 1.75, border: "1.5px dashed var(--border)", borderRadius: 8, background: isLocked ? "var(--bg-secondary)" : "var(--bg-primary)", color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit", minHeight: 220 }}
              />
              <p style={{ margin: "0.6rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Word count: <strong style={{ color: "var(--text-primary)" }}>{wordCount(answers[qIdx] ?? "")}</strong>
                {isLocked && <span style={{ color: RED, marginLeft: 10, fontWeight: 600 }}>· đã khoá</span>}
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  onClick={submitCurrent}
                  style={{ padding: "10px 30px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "var(--shadow-sm)" }}
                >
                  {qIdx < prompts.length - 1 ? "Submit → câu tiếp" : "Submit → xem kết quả"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh điều hướng dưới */}
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", padding: "0.7rem clamp(0.8rem, 3vw, 1.6rem)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Câu hỏi 1–{prompts.length}</span>
          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>{answered}</span>/{prompts.length} đã trả lời
          </span>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
            {prompts.map((_, i) => {
              const done = wordCount(answers[i] ?? "") >= 10;
              const cur = i === qIdx;
              const disabled = mode === "exam" && i !== qIdx;
              return (
                <button
                  key={i}
                  onClick={() => goto(i)}
                  disabled={disabled}
                  title={disabled ? "Chế độ thi thử không cho quay lại câu trước" : undefined}
                  style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${cur ? "var(--accent-primary)" : done ? "rgba(34,197,94,0.5)" : "var(--border)"}`, background: cur ? "var(--accent-primary)" : done ? "rgba(34,197,94,0.12)" : "var(--bg-primary)", color: cur ? "#fff" : done ? GREEN : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, fontFamily: "inherit" }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // Danh sách bộ đề
  // ══════════════════════════════════════
  const diffs: Q67Difficulty[] = ["easy", "medium", "hard"];

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)", maxWidth: 1000, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.4rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
        <span>›</span>
        <Link href={`/skills/${skill.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{skill.label}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{unit.label}</span>
      </div>

      <div style={{ marginBottom: "1.4rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 5px" }}>
          {skill.label} · {unit.label}
        </p>
        <h1 style={{ fontSize: "clamp(1.35rem, 3vw, 1.75rem)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          {unit.labelVi} — {unit.labelEn}
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
          15 đề chia theo 3 mức độ. Mỗi bộ mô phỏng màn thi thật: đọc e-mail bên trái, viết trả lời bên phải, 10 phút cho mỗi câu.
        </p>
      </div>

      {/* Chọn chế độ */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1rem 1.2rem", background: "var(--bg-secondary)", marginBottom: "1.6rem" }}>
        <p style={{ margin: "0 0 0.65rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Chế độ làm bài</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {([
            ["practice", "Luyện tập", "Đồng hồ đếm lên, không giới hạn. Tự do chuyển qua lại giữa các câu và sửa bài."],
            ["exam", "Thi thử", "Đếm ngược 10:00 mỗi câu. Hết giờ tự chuyển và khoá câu cũ, không quay lại được."],
          ] as [Mode, string, string][]).map(([m, label, desc]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ flex: "1 1 240px", textAlign: "left", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${mode === m ? "var(--accent-primary)" : "var(--border)"}`, background: mode === m ? "rgba(59,130,246,0.09)" : "var(--bg-primary)", cursor: "pointer", fontFamily: "inherit" }}
            >
              <div style={{ fontSize: "0.87rem", fontWeight: 700, color: mode === m ? "var(--accent-primary)" : "var(--text-primary)", marginBottom: 2 }}>
                {mode === m ? "◉" : "○"} {label}
              </div>
              <div style={{ fontSize: "0.77rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {diffs.map((d) => {
        const meta = Q67_DIFF_META[d];
        const tests = Q67_TESTS.filter((t) => t.difficulty === d);
        const color = d === "easy" ? GREEN : d === "medium" ? AMBER : RED;
        return (
          <div key={d} style={{ marginBottom: "1.4rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: "0.35rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color, background: color.replace("rgb", "rgba").replace(")", ",0.12)"), border: `1px solid ${color.replace("rgb", "rgba").replace(")", ",0.35)")}`, borderRadius: 5, padding: "2px 9px" }}>
                {meta.label}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{meta.blurb}</span>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              {tests.map((t, ti) => {
                const ps = promptsOfTest(t);
                const best = bestByTest[t.slug];
                const draft = drafts[t.slug];
                const draftWords = draft ? draft.answers.reduce((a, x) => a + wordCount(x), 0) : 0;
                return (
                  <div key={t.slug} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1.2rem", borderBottom: ti < tests.length - 1 ? "1px solid var(--border)" : "none", background: ti % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                        {t.label} · {ps.length} câu
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {ps.map((p) => `Đề ${p.no}: ${p.email.subject}`).join(" · ")}
                      </div>
                      {draft && (
                        <div style={{ marginTop: 5, fontSize: "0.74rem", color: AMBER, fontWeight: 600 }}>
                          ✎ Có bài viết dở · {draftWords} từ · lưu {agoLabel(draft.savedAt)}
                          {draft.mode === "exam" ? " · chế độ Thi thử" : ""}
                        </div>
                      )}
                    </div>
                    {best ? (
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: best.passed ? GREEN : AMBER, flexShrink: 0 }}>
                        {(best.score / 25).toFixed(1)}/4
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", flexShrink: 0 }}>Chưa làm</span>
                    )}
                    <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                      {draft && (
                        <button
                          onClick={() => start(t, mode, draft)}
                          style={{ padding: "6px 18px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 7, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Viết tiếp
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (draft && !confirm("Bắt đầu lại sẽ xoá bài viết dở đang lưu. Tiếp tục?")) return;
                          start(t, mode);
                        }}
                        style={{ padding: "6px 18px", border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", borderRadius: 7, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {draft ? "Làm lại" : best ? "Làm lại" : "Bắt đầu"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "2.4rem", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
    </div>
  );
}
