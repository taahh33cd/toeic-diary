"use client";

import { useState, useEffect } from "react";
import { ExamShell, ExamDirHeading } from "@/components/skills/exam/ExamShell";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { type WritingQ15Exercise, Q15_PART_KEY, Q15_PASS, keywordUsed, countWords } from "@/lib/skills/writing-q1-5";

type Best = { score: number; passed: boolean };

type Props = {
  skill: Skill;
  unit: SkillUnit;
  exercises: WritingQ15Exercise[];
  userId: string | null;
  isTestUser: boolean;
  bestByExercise: Record<string, Best>;
};

type Phase = "intro" | "doing" | "done";

type AiResult = {
  score: number;
  usedBothKeywords: boolean;
  corrected: string;
  feedback: string;
  errors: string[];
};

const MIN_WORDS = 5;

export function WritingSentenceClient({ skill, unit, exercises, userId, isTestUser, bestByExercise }: Props) {
  const color = FAMILY[skill.family];
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [aiFailed, setAiFailed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sessionScores, setSessionScores] = useState<Record<number, number>>({});
  const [best, setBest] = useState<Record<string, Best>>(bestByExercise);
  const [secondsLeft, setSecondsLeft] = useState(8 * 60);

  // Đếm ngược 8 phút khi đang làm bài (dừng ở 00:00)
  useEffect(() => {
    if (phase !== "doing") return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);
  const timerStr = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const total = exercises.length;
  const ex = exercises[idx];
  const testName = `${skill.label} · ${unit.label}`;
  const exitHref = `/skills/${skill.slug}`;

  const kw0Used = submitted && keywordUsed(answer, ex.keywords[0]);
  const kw1Used = submitted && keywordUsed(answer, ex.keywords[1]);
  const enoughWords = countWords(answer) >= MIN_WORDS;

  const doneCount = Object.keys(best).length;
  const avgBest = doneCount ? Math.round(Object.values(best).reduce((s, b) => s + b.score, 0) / doneCount) : 0;

  function reset() {
    setIdx(0); setAnswer(""); setSubmitted(false); setGrading(false);
    setAi(null); setAiFailed(false); setImgError(false); setSessionScores({});
  }
  function start() { reset(); setSecondsLeft(8 * 60); setPhase("doing"); }

  function saveAttempt(exerciseId: string, score: number, passed: boolean) {
    setBest((prev) => {
      const cur = prev[exerciseId];
      if (cur && cur.score >= score) return prev;
      return { ...prev, [exerciseId]: { score, passed } };
    });
    if (!userId || isTestUser) return;
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ part: Q15_PART_KEY, questionWord: exerciseId, exerciseIndex: 0, score, passed, itemIdx: null }),
    }).catch(() => {});
  }

  async function submit() {
    if (!answer.trim() || grading) return;
    setSubmitted(true); setGrading(true); setAiFailed(false);
    try {
      const res = await fetch("/api/skills/writing-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: answer, keywords: ex.keywords, modelAnswers: ex.modelAnswers }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as AiResult;
      setAi(data);
      setSessionScores((prev) => ({ ...prev, [idx]: data.score }));
      saveAttempt(ex.id, data.score, data.score >= Q15_PASS);
    } catch {
      setAiFailed(true);
    } finally {
      setGrading(false);
    }
  }

  function markSelf(ok: boolean) {
    const score = ok ? 100 : 50;
    setSessionScores((prev) => ({ ...prev, [idx]: score }));
    saveAttempt(ex.id, score, ok);
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1); setAnswer(""); setSubmitted(false); setAi(null); setAiFailed(false); setGrading(false); setImgError(false);
    } else {
      setPhase("done");
    }
  }

  function prev() {
    if (idx > 0) {
      setIdx(idx - 1); setAnswer(""); setSubmitted(false); setAi(null); setAiFailed(false); setGrading(false); setImgError(false);
    }
  }

  const sessionVals = Object.values(sessionScores);
  const sessionAvg = sessionVals.length ? Math.round(sessionVals.reduce((a, b) => a + b, 0) / sessionVals.length) : 0;
  const sessionPassed = sessionVals.filter((s) => s >= Q15_PASS).length;

  // ── Intro ──
  if (phase === "intro") {
    return (
      <ExamShell family={skill.family} testName={testName} exitHref={exitHref} nav={[{ label: `Bắt đầu · ${total} câu`, variant: "primary", onClick: start }]}>
        <ExamDirHeading family={skill.family}>Write a sentence based on a picture</ExamDirHeading>
        <ul style={{ margin: "0 0 14px", paddingLeft: "1.1rem", fontSize: "0.95rem", color: EXAM.inkSoft, lineHeight: 1.7 }}>
          <li>Mỗi câu có 1 bức ảnh và <strong>2 từ cho trước</strong>.</li>
          <li>Viết <strong>một câu</strong> mô tả ảnh, <strong>bắt buộc dùng cả 2 từ</strong> (được chia dạng khác).</li>
          <li><strong>AI chấm ngay</strong>: cho điểm, sửa lỗi, và có câu mẫu để đối chiếu.</li>
        </ul>
        {doneCount > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={pill}>Đã làm <strong>{doneCount}/{total}</strong> câu</span>
            <span style={pill}>Điểm TB tốt nhất: <strong>{avgBest}%</strong></span>
          </div>
        )}
      </ExamShell>
    );
  }

  // ── Done ──
  if (phase === "done") {
    return (
      <ExamShell family={skill.family} testName={testName} exitHref={exitHref} nav={[
        { label: "Làm lại", onClick: start },
        { label: `← Về ${skill.label}`, href: exitHref, variant: "primary" },
      ]}>
        <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🎉</div>
          <p style={{ fontSize: "1.05rem", fontWeight: 800, color: EXAM.ink, margin: "0.3rem 0" }}>Hoàn thành {sessionVals.length}/{total} câu!</p>
          {sessionVals.length > 0 && (
            <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, margin: 0 }}>
              Điểm trung bình phiên này: <strong>{sessionAvg}%</strong> · Pass <strong>{sessionPassed}/{sessionVals.length}</strong> (≥ {Q15_PASS}%)
            </p>
          )}
          <p style={{ fontSize: "0.8rem", color: EXAM.muted, marginTop: 6 }}>
            {userId && !isTestUser ? "Đã lưu tiến độ ✓" : "Đăng nhập để lưu tiến độ"}
          </p>
        </div>
      </ExamShell>
    );
  }

  // ── Doing ──
  const backBtn = idx > 0 ? [{ label: "Back", icon: "◀", onClick: prev }] : [];
  const nav: Parameters<typeof ExamShell>[0]["nav"] = !submitted
    ? [...backBtn, { label: "Chấm điểm", variant: "primary", disabled: !answer.trim(), onClick: submit }]
    : grading
    ? [{ label: "Đang chấm…", variant: "primary", disabled: true }]
    : [{ label: idx < total - 1 ? "Next ▶" : "Kết thúc ✓", variant: "primary", onClick: next }];

  return (
    <ExamShell family={skill.family} testName={testName} questionLabel={`${idx + 1} / ${total}`} timer={timerStr} exitHref={exitHref} nav={nav}>
      <ExamDirHeading family={skill.family}>Write a sentence based on a picture</ExamDirHeading>

      {/* Directions (như đề thật) */}
      <p style={{ fontSize: "0.95rem", color: EXAM.inkSoft, lineHeight: 1.6, margin: "0 0 14px" }}>
        <strong>Directions:</strong> Write ONE sentence that is based on the picture. With the picture,
        you are given TWO words that you must use in your sentence. You may change the forms of the words
        and use them in any order.
      </p>

      {/* image */}
      <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", background: EXAM.panel, marginBottom: 4 }}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ex.imageUrl} alt={ex.imageAlt} onError={() => setImgError(true)} style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: EXAM.muted, fontSize: "0.85rem" }}>Không tải được ảnh 🖼️</div>
        )}
      </div>
      <p style={{ fontSize: "0.66rem", color: EXAM.muted, textAlign: "right", margin: "0 0 12px" }}>Ảnh: {ex.credit.author}</p>

      {/* Hai từ bắt buộc — dạng "word / word" dưới ảnh như đề thật */}
      <p style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 700, color: EXAM.ink, margin: "2px 0 16px", fontFamily: EXAM.sans }}>
        {ex.keywords[0]} <span style={{ color: EXAM.muted, fontWeight: 400, margin: "0 6px" }}>/</span> {ex.keywords[1]}
      </p>

      {/* textarea */}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={submitted}
        rows={2}
        placeholder="Type your response here."
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: "1.05rem", border: `1.5px solid ${EXAM.border}`, borderRadius: 8, background: "#fff", color: EXAM.ink, outline: "none", resize: "vertical", fontFamily: EXAM.sans, lineHeight: 1.5 }}
      />
      {!submitted && (
        <p style={{ fontSize: "0.82rem", color: EXAM.muted, margin: "6px 0 0" }}>
          {countWords(answer)} từ{!enoughWords && answer.trim() ? " · nên viết câu đủ ý (≥ 5 từ)" : ""}
        </p>
      )}

      {submitted && (
        <div style={{ marginTop: 14 }}>
          {grading && <p style={{ fontSize: "0.85rem", color: EXAM.inkSoft, margin: 0 }}>⏳ AI đang chấm…</p>}

          {!grading && ai && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <ScoreBadge score={ai.score} color={color.primary} />
                <span style={{ fontSize: "0.86rem", fontWeight: 700, color: ai.usedBothKeywords ? EXAM.ok : EXAM.bad }}>
                  {ai.usedBothKeywords ? "✓ Dùng đủ 2 từ" : "✗ Thiếu từ bắt buộc"}
                </span>
              </div>
              {ai.corrected && <p style={{ fontSize: "0.98rem", color: EXAM.ink, margin: "0 0 4px", lineHeight: 1.55 }}><strong>Câu sửa lại:</strong> {ai.corrected}</p>}
              {ai.feedback && <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, margin: "0 0 4px", lineHeight: 1.55 }}>{ai.feedback}</p>}
              {ai.errors.length > 0 && (
                <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem", fontSize: "0.86rem", color: EXAM.muted, lineHeight: 1.55 }}>
                  {ai.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {!grading && aiFailed && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: "0.8rem", color: EXAM.warn, margin: "0 0 6px" }}>⚠️ Không chấm được bằng AI. Hãy tự đối chiếu câu mẫu và đánh giá:</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => markSelf(true)} style={selfBtn(sessionScores[idx] >= Q15_PASS, EXAM.ok)}>👍 Ổn rồi</button>
                <button type="button" onClick={() => markSelf(false)} style={selfBtn(sessionScores[idx] != null && sessionScores[idx] < Q15_PASS, color.primary)}>✍️ Cần luyện thêm</button>
              </div>
            </div>
          )}

          {!grading && (
            <p style={{ fontSize: "0.88rem", margin: "0 0 8px", color: EXAM.inkSoft }}>
              Từ bắt buộc:
              <span style={{ color: kw0Used ? EXAM.ok : EXAM.bad, fontWeight: 700 }}> {ex.keywords[0]} {kw0Used ? "✓" : "✗"}</span>
              <span style={{ color: EXAM.muted }}> · </span>
              <span style={{ color: kw1Used ? EXAM.ok : EXAM.bad, fontWeight: 700 }}>{ex.keywords[1]} {kw1Used ? "✓" : "✗"}</span>
            </p>
          )}

          {!grading && (
            <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: EXAM.inkSoft, margin: "0 0 6px", letterSpacing: "0.03em", textTransform: "uppercase" }}>Câu mẫu tham khảo</p>
              {ex.modelAnswers.map((m, i) => <p key={i} style={{ fontSize: "1rem", color: EXAM.ink, margin: "0 0 4px", lineHeight: 1.55 }}>• {m}</p>)}
              <p style={{ fontSize: "0.86rem", color: EXAM.muted, margin: "6px 0 0", lineHeight: 1.55, fontStyle: "italic" }}>💡 {ex.tip}</p>
            </div>
          )}
        </div>
      )}
    </ExamShell>
  );
}

const pill: React.CSSProperties = { fontSize: "0.78rem", color: EXAM.inkSoft, background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "5px 12px" };

function selfBtn(active: boolean, activeColor: string): React.CSSProperties {
  return {
    background: active ? "rgba(31,157,87,0.06)" : "#fff",
    color: active ? activeColor : EXAM.inkSoft,
    border: `1.5px solid ${active ? activeColor : EXAM.border}`,
    borderRadius: 8, padding: "7px 16px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", fontFamily: EXAM.sans,
  };
}

function ScoreBadge({ score, color }: { score: number; color: string }) {
  const passed = score >= Q15_PASS;
  const c = passed ? EXAM.ok : score >= 40 ? EXAM.warn : EXAM.bad;
  const bg = passed ? "rgba(31,157,87,0.12)" : score >= 40 ? "rgba(200,135,26,0.12)" : "rgba(209,67,91,0.12)";
  return (
    <span style={{ display: "inline-block", fontSize: "1.05rem", fontWeight: 800, color: c, background: bg, border: `1.5px solid ${c}`, borderRadius: 8, padding: "3px 14px" }}>{score}%</span>
  );
}
