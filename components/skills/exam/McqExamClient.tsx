"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExamShell, ExamDirHeading } from "./ExamShell";
import { FAMILY, EXAM, type Family } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import type { McqItem } from "@/lib/skills/sample";

type Props = {
  skill: Skill;
  unit: SkillUnit;
  items: McqItem[];
  mode: "reading" | "listening";
  /** giây cho cả bài (timer đếm ngược) */
  totalSeconds: number;
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function McqExamClient({ skill, unit, items, mode, totalSeconds }: Props) {
  const fam: Family = skill.family;
  const color = FAMILY[fam];
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(totalSeconds);
  const [done, setDone] = useState(false);

  const item = items[idx];
  const total = items.length;

  // countdown
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [done]);
  useEffect(() => { if (left === 0) setDone(true); }, [left]);

  const speak = useCallback((item: McqItem) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const parts = [item.prompt, ...item.options.map((o) => `${o.id}. ${o.text}`)];
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = "en-US";
      u.rate = 0.95;
      if (i > 0) u.volume = 1;
      window.speechSynthesis.speak(u);
    });
  }, []);

  // auto-play listening prompt on new question
  const playedRef = useRef<string | null>(null);
  useEffect(() => {
    if (mode === "listening" && item && playedRef.current !== item.id) {
      playedRef.current = item.id;
      speak(item);
    }
    return () => { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [mode, item, speak]);

  function pick(id: string) {
    if (submitted) return;
    setSelected(id);
    setSubmitted(true);
    if (id === item.answer) setCorrect((c) => c + 1);
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setDone(true);
    }
  }

  const testName = `${skill.label} · ${unit.label}`;
  const exitHref = `/skills/${skill.slug}`;

  // ── Done ──
  if (done) {
    const score = Math.round((correct / total) * 100);
    return (
      <ExamShell family={fam} testName={testName} exitHref={exitHref} nav={[{ label: "Về danh sách", href: exitHref, variant: "primary" }]}>
        <div style={{ textAlign: "center", padding: "1.5rem 0.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>{score >= 60 ? "🎉" : "📋"}</div>
          <p style={{ fontSize: "1.05rem", fontWeight: 800, color: EXAM.ink, margin: "0.3rem 0" }}>Hoàn thành</p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: score >= 60 ? EXAM.ok : color.primary, margin: 0 }}>{score}%</p>
          <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, marginTop: 6 }}>{correct}/{total} câu đúng</p>
        </div>
      </ExamShell>
    );
  }

  const optionRow = (id: string, text: string) => {
    const isSel = selected === id;
    const isCorrect = id === item.answer;
    let border = `1.5px solid ${EXAM.border}`;
    let bg = "#fff";
    let col: string = EXAM.ink;
    if (submitted) {
      if (isCorrect) { border = `1.5px solid ${EXAM.ok}`; bg = "rgba(31,157,87,0.08)"; col = EXAM.ok; }
      else if (isSel) { border = `1.5px solid ${EXAM.bad}`; bg = "rgba(209,67,91,0.07)"; col = EXAM.bad; }
    } else if (isSel) {
      border = `1.5px solid ${color.primary}`; bg = color.soft;
    }
    return (
      <button
        key={id}
        type="button"
        onClick={() => pick(id)}
        disabled={submitted}
        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 13px", border, borderRadius: 8, background: bg, color: col, textAlign: "left", cursor: submitted ? "default" : "pointer", fontFamily: EXAM.sans, fontSize: "0.88rem", width: "100%" }}
      >
        <span style={{ fontWeight: 800, minWidth: 16 }}>{id}.</span>
        <span style={{ lineHeight: 1.45 }}>{text}</span>
        {submitted && isCorrect && <span style={{ marginLeft: "auto" }}>✓</span>}
        {submitted && isSel && !isCorrect && <span style={{ marginLeft: "auto" }}>✗</span>}
      </button>
    );
  };

  return (
    <ExamShell
      family={fam}
      testName={testName}
      questionLabel={`${idx + 1} / ${total}`}
      timer={fmt(left)}
      exitHref={exitHref}
      nav={[
        ...(mode === "listening" ? [{ label: "Nghe lại", icon: "🔊", onClick: () => speak(item) }] : []),
        { label: submitted ? (idx < total - 1 ? "Next ▶" : "Kết thúc ✓") : "Chọn đáp án", variant: "primary" as const, disabled: !submitted, onClick: next },
      ]}
    >
      <ExamDirHeading family={fam}>
        {mode === "listening" ? "Part 2 — Question-Response" : "Part 5 — Incomplete Sentences"}
      </ExamDirHeading>

      {mode === "listening" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 9, padding: "12px 14px", marginBottom: 14 }}>
          <button type="button" onClick={() => speak(item)} style={{ width: 34, height: 34, borderRadius: "50%", background: color.primary, color: "#fff", border: "none", cursor: "pointer", fontSize: "0.9rem", flexShrink: 0 }}>▶</button>
          <div style={{ fontSize: "0.82rem", color: EXAM.inkSoft }}>
            Nhấn ▶ để nghe câu hỏi &amp; 3 phương án (giọng đọc máy). Chọn phản hồi phù hợp nhất.
          </div>
        </div>
      ) : (
        <p style={{ fontSize: "1rem", color: EXAM.ink, lineHeight: 1.6, margin: "0 0 14px" }}>
          {item.prompt.split("_____").map((seg, i, arr) => (
            <span key={i}>
              {seg}
              {i < arr.length - 1 && <span style={{ display: "inline-block", minWidth: 70, borderBottom: `2px solid ${color.primary}`, margin: "0 4px" }} />}
            </span>
          ))}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {item.options.map((o) => optionRow(o.id, o.text))}
      </div>

      {submitted && (
        <div style={{ marginTop: 12, background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "10px 12px" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: selected === item.answer ? EXAM.ok : EXAM.bad }}>
            {selected === item.answer ? "✓ Chính xác" : `✗ Đáp án đúng: ${item.answer}`}
          </span>
          <p style={{ fontSize: "0.82rem", color: EXAM.inkSoft, margin: "4px 0 0", lineHeight: 1.5 }}>{item.explanation}</p>
        </div>
      )}
    </ExamShell>
  );
}
