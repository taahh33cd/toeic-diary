"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [aiFailed, setAiFailed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sessionScores, setSessionScores] = useState<Record<number, number>>({});
  // local best (updates as user completes exercises this session)
  const [best, setBest] = useState<Record<string, Best>>(bestByExercise);

  const total = exercises.length;
  const ex = exercises[idx];

  const kw0Used = submitted && keywordUsed(answer, ex.keywords[0]);
  const kw1Used = submitted && keywordUsed(answer, ex.keywords[1]);
  const enoughWords = countWords(answer) >= MIN_WORDS;

  const doneCount = Object.keys(best).length;
  const avgBest = doneCount ? Math.round(Object.values(best).reduce((s, b) => s + b.score, 0) / doneCount) : 0;

  function reset() {
    setIdx(0);
    setAnswer("");
    setSubmitted(false);
    setGrading(false);
    setAi(null);
    setAiFailed(false);
    setImgError(false);
    setSessionScores({});
  }

  function start() {
    reset();
    setPhase("doing");
  }

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
      body: JSON.stringify({
        part: Q15_PART_KEY,
        questionWord: exerciseId,
        exerciseIndex: 0,
        score,
        passed,
        itemIdx: null,
      }),
    }).catch(() => {});
  }

  async function submit() {
    if (!answer.trim() || grading) return;
    setSubmitted(true);
    setGrading(true);
    setAiFailed(false);
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

  // fallback manual self-assessment when AI fails
  function markSelf(ok: boolean) {
    const score = ok ? 100 : 50;
    setSessionScores((prev) => ({ ...prev, [idx]: score }));
    saveAttempt(ex.id, score, ok);
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setAnswer("");
      setSubmitted(false);
      setAi(null);
      setAiFailed(false);
      setGrading(false);
      setImgError(false);
    } else {
      setPhase("done");
    }
  }

  const sessionVals = Object.values(sessionScores);
  const sessionAvg = sessionVals.length ? Math.round(sessionVals.reduce((a, b) => a + b, 0) / sessionVals.length) : 0;
  const sessionPassed = sessionVals.filter((s) => s >= Q15_PASS).length;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg-primary)",
        padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)",
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
        <span>›</span>
        <Link href={`/skills/${skill.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{skill.label}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{unit.label}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
          {skill.emoji} {skill.label} · {unit.label}
        </p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
          {unit.labelVi} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({unit.labelEn})</span>
        </h1>
      </div>

      <div style={{ height: 1, background: "var(--border)", marginBottom: "1.5rem" }} />

      {/* ── Intro ── */}
      {phase === "intro" && (
        <div className="animate-slide-up" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, margin: "0 0 0.5rem" }}>Cách làm</p>
          <ul style={{ margin: "0 0 1rem", paddingLeft: "1.1rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <li>Mỗi câu có 1 bức ảnh và <strong>2 từ cho trước</strong>.</li>
            <li>Viết <strong>một câu</strong> mô tả ảnh, <strong>bắt buộc dùng cả 2 từ</strong> (được chia dạng khác).</li>
            <li><strong>AI chấm ngay</strong>: cho điểm, sửa lỗi, và có câu mẫu để đối chiếu.</li>
          </ul>

          {doneCount > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px" }}>
                Đã làm <strong>{doneCount}/{total}</strong> câu
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px" }}>
                Điểm TB tốt nhất: <strong>{avgBest}%</strong>
              </span>
            </div>
          )}

          <button onClick={start} style={btnPrimary}>Bắt đầu · {total} câu</button>
        </div>
      )}

      {/* ── Doing ── */}
      {phase === "doing" && ex && (
        <div>
          {/* progress */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Câu {idx + 1}/{total}</span>
            <button onClick={() => setPhase("intro")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}>← Thoát</button>
          </div>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginBottom: "1.25rem" }}>
            <div style={{ height: "100%", width: `${Math.round((idx / total) * 100)}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.2s" }} />
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.25rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
            {/* image */}
            <div style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden", background: "var(--bg-secondary)", marginBottom: "0.4rem" }}>
              {!imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ex.imageUrl}
                  alt={ex.imageAlt}
                  onError={() => setImgError(true)}
                  style={{ width: "100%", maxHeight: 340, objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ padding: "2rem 1rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Không tải được ảnh 🖼️
                </div>
              )}
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "0 0 1rem", textAlign: "right" }}>Ảnh: {ex.credit.author}</p>

            {/* keywords */}
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 0.5rem" }}>Bắt buộc dùng 2 từ:</p>
            <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
              {ex.keywords.map((k, i) => {
                const used = submitted ? (i === 0 ? kw0Used : kw1Used) : null;
                return (
                  <span
                    key={k}
                    style={{
                      fontSize: "0.9rem", fontWeight: 700, padding: "5px 14px", borderRadius: 8,
                      background: used === null ? "var(--bg-secondary)" : used ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                      border: `1.5px solid ${used === null ? "var(--border)" : used ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.4)"}`,
                      color: used === null ? "var(--text-primary)" : used ? "rgb(34,197,94)" : "rgb(239,68,68)",
                    }}
                  >
                    {k}{used === true ? " ✓" : used === false ? " ✗" : ""}
                  </span>
                );
              })}
            </div>

            {/* textarea */}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitted}
              rows={2}
              placeholder="Viết một câu mô tả ảnh…"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: "0.95rem", border: "1.5px solid var(--border)", borderRadius: 8, background: "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
            />
            {!submitted && (
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.35rem 0 0.75rem" }}>
                {countWords(answer)} từ{!enoughWords && answer.trim() ? " · nên viết câu đủ ý (≥ 5 từ)" : ""}
              </p>
            )}

            {!submitted ? (
              <button onClick={submit} disabled={!answer.trim()} style={answer.trim() ? btnPrimary : btnDisabled}>
                Chấm điểm
              </button>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                {grading && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>⏳ AI đang chấm…</p>
                )}

                {/* AI result */}
                {!grading && ai && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.6rem", flexWrap: "wrap" }}>
                      <ScoreBadge score={ai.score} />
                      <span style={{ fontSize: "0.78rem", color: ai.usedBothKeywords ? "rgb(34,197,94)" : "rgb(239,68,68)", fontWeight: 600 }}>
                        {ai.usedBothKeywords ? "✓ Dùng đủ 2 từ" : "✗ Thiếu từ bắt buộc"}
                      </span>
                    </div>
                    {ai.corrected && (
                      <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", margin: "0 0 0.4rem", lineHeight: 1.5 }}>
                        <strong>Câu sửa lại:</strong> {ai.corrected}
                      </p>
                    )}
                    {ai.feedback && (
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0 0 0.4rem", lineHeight: 1.5 }}>{ai.feedback}</p>
                    )}
                    {ai.errors.length > 0 && (
                      <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                        {ai.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {/* AI failed → manual self-assess fallback */}
                {!grading && aiFailed && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "rgb(234,179,8)", margin: "0 0 0.5rem" }}>
                      ⚠️ Không chấm được bằng AI. Hãy tự đối chiếu câu mẫu và đánh giá:
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => markSelf(true)} style={sessionScores[idx] >= Q15_PASS ? selfBtnOnGreen : selfBtnOff}>👍 Ổn rồi</button>
                      <button onClick={() => markSelf(false)} style={sessionScores[idx] != null && sessionScores[idx] < Q15_PASS ? selfBtnOnGray : selfBtnOff}>✍️ Cần luyện thêm</button>
                    </div>
                  </div>
                )}

                {/* model answers (always shown after submit) */}
                {!grading && (
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.9rem 1rem", marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 0.5rem", letterSpacing: "0.03em", textTransform: "uppercase" }}>Câu mẫu tham khảo</p>
                    {ex.modelAnswers.map((m, i) => (
                      <p key={i} style={{ fontSize: "0.9rem", color: "var(--text-primary)", margin: "0 0 0.35rem", lineHeight: 1.5 }}>• {m}</p>
                    ))}
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.5rem 0 0", lineHeight: 1.5, fontStyle: "italic" }}>💡 {ex.tip}</p>
                  </div>
                )}

                {!grading && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={next} style={btnPrimary}>
                      {idx < total - 1 ? "Câu tiếp →" : "Kết thúc ✓"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {phase === "done" && (
        <div className="animate-slide-up" style={{ textAlign: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "2rem 1.5rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
          <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.35rem" }}>Hoàn thành {sessionVals.length}/{total} câu!</p>
          {sessionVals.length > 0 && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
              Điểm trung bình phiên này: <strong>{sessionAvg}%</strong> · Pass <strong>{sessionPassed}/{sessionVals.length}</strong> (≥ {Q15_PASS}%)
            </p>
          )}
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 1.5rem" }}>
            {userId && !isTestUser ? "Đã lưu tiến độ ✓" : "Đăng nhập để lưu tiến độ"}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={start} style={btnOutline}>Làm lại</button>
            <Link href={`/skills/${skill.slug}`} style={{ ...btnPrimary, textDecoration: "none", display: "inline-block" }}>← Về {skill.label}</Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Score badge ──
function ScoreBadge({ score }: { score: number }) {
  const passed = score >= Q15_PASS;
  const color = passed ? "rgb(34,197,94)" : score >= 40 ? "rgb(234,179,8)" : "rgb(239,68,68)";
  const bg = passed ? "rgba(34,197,94,0.12)" : score >= 40 ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)";
  return (
    <span style={{ display: "inline-block", fontSize: "1.05rem", fontWeight: 800, color, background: bg, border: `1.5px solid ${color}`, borderRadius: 8, padding: "3px 14px" }}>
      {score}%
    </span>
  );
}

// ── Inline button styles ──
const btnPrimary: React.CSSProperties = { background: "var(--accent-primary)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const btnDisabled: React.CSSProperties = { ...btnPrimary, background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "not-allowed" };
const btnOutline: React.CSSProperties = { background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 22px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const selfBtnOff: React.CSSProperties = { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const selfBtnOnGreen: React.CSSProperties = { ...selfBtnOff, background: "rgba(34,197,94,0.12)", color: "rgb(34,197,94)", borderColor: "rgba(34,197,94,0.45)" };
const selfBtnOnGray: React.CSSProperties = { ...selfBtnOff, background: "var(--bg-elevated)", color: "var(--text-primary)", borderColor: "var(--accent-primary)" };
