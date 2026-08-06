"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
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

function ReviewCard({
  prompt,
  index,
  answer,
  missionsDone,
  formDone,
  onToggleMission,
  onToggleForm,
}: {
  prompt: Q67Prompt;
  index: number;
  answer: string;
  missionsDone: boolean[];
  formDone: boolean[];
  onToggleMission: (i: number) => void;
  onToggleForm: (i: number) => void;
}) {
  const wrote = wordCount(answer) >= 10;
  const score = computeQ67Score(missionsDone, formDone, wrote);
  const color = score.ets >= 4 ? GREEN : score.ets >= 2 ? AMBER : RED;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1.4rem", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ padding: "0.8rem 1.2rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)" }}>Question {index + 1}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Đề {prompt.no}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Điểm ETS</span>
          <span style={{ fontSize: "1.15rem", fontWeight: 800, color, background: color.replace("rgb", "rgba").replace(")", ",0.12)"), border: `1.5px solid ${color.replace("rgb", "rgba").replace(")", ",0.4)")}`, borderRadius: 8, padding: "1px 13px" }}>
            {score.ets}<span style={{ fontSize: "0.7rem", fontWeight: 600 }}>/4</span>
          </span>
        </span>
      </div>

      <div style={{ padding: "1.1rem 1.2rem" }}>
        <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.81rem", lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic" }}>
            <strong style={{ fontStyle: "normal" }}>Directions:</strong> {prompt.directions}
          </p>
        </div>

        {/* Bài của học viên */}
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 5 }}>BÀI CỦA BẠN · {wordCount(answer)} từ</p>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "11px 14px", background: "var(--bg-secondary)", marginBottom: "1.2rem", whiteSpace: "pre-wrap", fontSize: "0.86rem", lineHeight: 1.75, color: "var(--text-primary)", minHeight: 44 }}>
          {answer.trim() || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(bỏ trống)</span>}
        </div>

        {/* Model answer */}
        <details open style={{ marginBottom: "1.2rem" }}>
          <summary style={{ fontSize: "0.78rem", color: "var(--accent-primary)", cursor: "pointer", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 6 }}>
            MODEL ANSWER — bài mẫu để đối chiếu
          </summary>
          <div style={{ border: "1px solid rgba(34,197,94,0.35)", borderRadius: 8, padding: "11px 14px", background: "rgba(34,197,94,0.06)", marginTop: 6 }}>
            {prompt.modelAnswer.map((l, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "0.45rem 0 0", fontSize: "0.86rem", lineHeight: 1.7, color: "var(--text-primary)" }}>{l}</p>
            ))}
          </div>
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.79rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
            <strong style={{ color: "var(--text-secondary)" }}>Lưu ý của đề này:</strong> {prompt.note}
          </p>
        </details>

        {/* Checklist mission */}
        <p style={{ fontSize: "0.84rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.5rem" }}>
          So bài của bạn với Model Answer — bạn đã làm được mission nào?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.1rem" }}>
          {prompt.missions.map((m, i) => (
            <button
              key={i}
              onClick={() => onToggleMission(i)}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${missionsDone[i] ? "rgba(34,197,94,0.45)" : "var(--border)"}`, background: missionsDone[i] ? "rgba(34,197,94,0.08)" : "var(--bg-secondary)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${missionsDone[i] ? GREEN : "var(--border)"}`, background: missionsDone[i] ? GREEN : "transparent", color: "#fff", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                {missionsDone[i] ? "✓" : ""}
              </span>
              <span style={{ fontSize: "0.86rem", lineHeight: 1.55, color: "var(--text-primary)" }}>{m}</span>
            </button>
          ))}
        </div>

        {/* Checklist hình thức */}
        <p style={{ fontSize: "0.84rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.5rem" }}>Khuôn thư business</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
          {Q67_FORM_CHECKS.map((c, i) => (
            <button
              key={i}
              onClick={() => onToggleForm(i)}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${formDone[i] ? "rgba(34,197,94,0.45)" : "var(--border)"}`, background: formDone[i] ? "rgba(34,197,94,0.08)" : "var(--bg-secondary)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${formDone[i] ? GREEN : "var(--border)"}`, background: formDone[i] ? GREEN : "transparent", color: "#fff", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                {formDone[i] ? "✓" : ""}
              </span>
              <span style={{ fontSize: "0.84rem", lineHeight: 1.55, color: "var(--text-secondary)" }}>{c}</span>
            </button>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
          <strong style={{ color }}>{score.ets}/4 — {score.label}.</strong> {score.detail}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Main
// ─────────────────────────────────────

export function WritingEmailClient({ skill, unit, userId, isTestUser, bestByTest }: Props) {
  const narrow = useIsNarrow();

  const [phase, setPhase] = useState<Phase>("list");
  const [mode, setMode] = useState<Mode>("practice");
  const [test, setTest] = useState<Q67Test | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [qLeft, setQLeft] = useState(Q67_SECONDS_PER_QUESTION);
  const [missionMarks, setMissionMarks] = useState<boolean[][]>([]);
  const [formMarks, setFormMarks] = useState<boolean[][]>([]);
  const [saved, setSaved] = useState(false);
  const [ratio, setRatio] = useState(0.5);
  const dragRef = useRef(false);

  const prompts = useMemo(() => (test ? promptsOfTest(test) : []), [test]);
  const current = prompts[qIdx];

  // ── Đồng hồ ──
  useEffect(() => {
    if (phase !== "doing") return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      if (mode === "exam") setQLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [phase, mode]);

  const finish = useCallback(() => {
    setPhase("review");
  }, []);

  // ── Chế độ thi thử: hết 10 phút thì khoá câu và chuyển ──
  useEffect(() => {
    if (phase !== "doing" || mode !== "exam" || qLeft > 0) return;
    setLocked((prev) => { const n = [...prev]; n[qIdx] = true; return n; });
    if (qIdx < prompts.length - 1) {
      setQIdx((i) => i + 1);
      setQLeft(Q67_SECONDS_PER_QUESTION);
    } else {
      finish();
    }
  }, [qLeft, phase, mode, qIdx, prompts.length, finish]);

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

  function start(t: Q67Test, m: Mode) {
    const ps = promptsOfTest(t);
    setTest(t);
    setMode(m);
    setQIdx(0);
    setAnswers(ps.map(() => ""));
    setLocked(ps.map(() => false));
    setMissionMarks(ps.map((p) => p.missions.map(() => false)));
    setFormMarks(ps.map(() => Q67_FORM_CHECKS.map(() => false)));
    setElapsed(0);
    setQLeft(Q67_SECONDS_PER_QUESTION);
    setSaved(false);
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
        setQLeft(Q67_SECONDS_PER_QUESTION);
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

        <div style={{ padding: "0.85rem 1.1rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-secondary)", marginBottom: "1.6rem" }}>
          <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
            Phần này <strong style={{ color: "var(--text-primary)" }}>không chấm tự động</strong>. Hãy đọc Model Answer, so với bài của bạn rồi tự tick từng mục —
            điểm ETS bên dưới được tính lại theo đúng những gì bạn tick.
            <br />
            <span style={{ color: "var(--text-muted)" }}>
              Quy tắc: đủ mission + đúng khuôn thư = 4 · đủ mission nhưng thiếu khuôn = 3 · làm được từ nửa số mission = 2 · dưới nửa = 1 · không mission nào = 0.
            </span>
          </p>
        </div>

        {prompts.map((p, i) => (
          <ReviewCard
            key={p.id}
            prompt={p}
            index={i}
            answer={answers[i] ?? ""}
            missionsDone={missionMarks[i] ?? []}
            formDone={formMarks[i] ?? []}
            onToggleMission={(k) => setMissionMarks((prev) => { const n = prev.map((r) => [...r]); n[i][k] = !n[i][k]; return n; })}
            onToggleForm={(k) => setFormMarks((prev) => { const n = prev.map((r) => [...r]); n[i][k] = !n[i][k]; return n; })}
          />
        ))}

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
          <button onClick={() => setPhase("list")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", padding: 0, flexShrink: 0 }}>← Thoát</button>
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
                return (
                  <div key={t.slug} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1.2rem", borderBottom: ti < tests.length - 1 ? "1px solid var(--border)" : "none", background: ti % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                        {t.label} · {ps.length} câu
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {ps.map((p) => `Đề ${p.no}: ${p.email.subject}`).join(" · ")}
                      </div>
                    </div>
                    {best ? (
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: best.passed ? GREEN : AMBER, flexShrink: 0 }}>
                        {(best.score / 25).toFixed(1)}/4
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", flexShrink: 0 }}>Chưa làm</span>
                    )}
                    <button
                      onClick={() => start(t, mode)}
                      style={{ flexShrink: 0, padding: "6px 18px", border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", borderRadius: 7, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {best ? "Làm lại" : "Bắt đầu"}
                    </button>
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
