"use client";

import { useState, useEffect } from "react";
import { ExamShell, ExamDirHeading } from "@/components/skills/exam/ExamShell";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { type WritingQ15Exercise, Q15_PART_KEY, Q15_PASS, Q15_TEST_SIZE, keywordUsed, countWords } from "@/lib/skills/writing-q1-5";

type Best = { score: number; passed: boolean };

type Props = {
  skill: Skill;
  unit: SkillUnit;
  exercises: WritingQ15Exercise[];
  userId: string | null;
  isTestUser: boolean;
  bestByExercise: Record<string, Best>;
};

type Phase = "tests" | "doing" | "done";

type AiResult = {
  score: number;
  usedBothKeywords: boolean;
  corrected: string;
  feedback: string;
  errors: string[];
};

const MIN_WORDS = 5;
const TEST_SECONDS = 8 * 60;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function WritingSentenceClient({ skill, unit, exercises, userId, isTestUser, bestByExercise }: Props) {
  const color = FAMILY[skill.family];
  const tests = chunk(exercises, Q15_TEST_SIZE);

  const [phase, setPhase] = useState<Phase>("tests");
  const [activeTest, setActiveTest] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [aiFailed, setAiFailed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sessionScores, setSessionScores] = useState<Record<number, number>>({});
  const [best, setBest] = useState<Record<string, Best>>(bestByExercise);
  const [timerOn, setTimerOn] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(TEST_SECONDS);

  const testExs = tests[activeTest] ?? [];
  const totalInTest = testExs.length;
  const ex = testExs[idx];
  const testName = `${skill.label} · ${unit.label}`;
  const exitHref = `/skills/${skill.slug}`;

  // Đếm ngược 8 phút mỗi test (nếu bật timer)
  useEffect(() => {
    if (phase !== "doing" || !timerOn) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, timerOn]);
  const timerStr = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const kw0Used = submitted && ex ? keywordUsed(answer, ex.keywords[0]) : false;
  const kw1Used = submitted && ex ? keywordUsed(answer, ex.keywords[1]) : false;
  const enoughWords = countWords(answer) >= MIN_WORDS;

  function resetQuestionState() {
    setAnswer(""); setSubmitted(false); setGrading(false); setAi(null); setAiFailed(false); setImgError(false);
  }

  function startTest(t: number) {
    setActiveTest(t);
    setIdx(0);
    setSessionScores({});
    resetQuestionState();
    setSecondsLeft(TEST_SECONDS);
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
      body: JSON.stringify({ part: Q15_PART_KEY, questionWord: exerciseId, exerciseIndex: 0, score, passed, itemIdx: null }),
    }).catch(() => {});
  }

  async function submit() {
    if (!answer.trim() || grading || !ex) return;
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
    if (!ex) return;
    const score = ok ? 100 : 50;
    setSessionScores((prev) => ({ ...prev, [idx]: score }));
    saveAttempt(ex.id, score, ok);
  }

  function next() {
    if (idx < totalInTest - 1) { setIdx(idx + 1); resetQuestionState(); }
    else setPhase("done");
  }
  function prev() {
    if (idx > 0) { setIdx(idx - 1); resetQuestionState(); }
  }

  // ── Per-test progress cho màn danh sách ──
  function testProgress(t: number) {
    const exs = tests[t];
    const scores = exs.map((e) => best[e.id]?.score).filter((v): v is number => v != null);
    const done = scores.length;
    const avg = done ? Math.round(scores.reduce((a, b) => a + b, 0) / done) : null;
    return { done, total: exs.length, avg };
  }

  // ── Màn chọn Test ──
  if (phase === "tests") {
    return (
      <ExamShell family={skill.family} testName={testName} exitHref={exitHref}>
        <ExamDirHeading family={skill.family}>Write a sentence based on a picture</ExamDirHeading>
        <p style={{ fontSize: "0.95rem", color: EXAM.inkSoft, lineHeight: 1.6, margin: "0 0 14px" }}>
          Mỗi test gồm <strong>5 câu</strong> (đúng format thật: Questions 1–5). Với mỗi ảnh bạn được cho
          <strong> 2 từ</strong> bắt buộc dùng trong câu. AI chấm ngay sau khi nộp.
        </p>

        {/* Toggle timer */}
        <button
          type="button"
          onClick={() => setTimerOn((v) => !v)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 16,
            border: `1.5px solid ${timerOn ? color.primary : EXAM.border}`, background: timerOn ? color.soft : "#fff",
            color: timerOn ? color.primary : EXAM.inkSoft, borderRadius: 8, padding: "8px 14px",
            fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: EXAM.sans,
          }}
        >
          <span style={{ width: 34, height: 18, borderRadius: 999, background: timerOn ? color.primary : "#c9ced6", position: "relative", transition: "background .15s" }}>
            <span style={{ position: "absolute", top: 2, left: timerOn ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
          </span>
          ⏱ Giới hạn 8 phút/test {timerOn ? "· BẬT" : "· TẮT"}
        </button>

        {/* Danh sách test */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tests.map((exs, t) => {
            const p = testProgress(t);
            const started = p.done > 0;
            return (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, border: `1px solid ${EXAM.border}`, borderRadius: 10, padding: "12px 15px", background: EXAM.panel }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: color.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.95rem", flexShrink: 0 }}>
                  {t + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: EXAM.ink }}>Test {t + 1}</div>
                  <div style={{ fontSize: "0.82rem", color: EXAM.muted, marginTop: 2 }}>
                    {exs.length} câu{started ? ` · đã làm ${p.done}/${p.total} · TB ${p.avg}%` : " · chưa làm"}
                  </div>
                </div>
                <button type="button" onClick={() => startTest(t)} style={{ flexShrink: 0, background: started ? "#fff" : color.primary, color: started ? color.primary : "#fff", border: `1.5px solid ${color.primary}`, borderRadius: 8, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: EXAM.sans }}>
                  {started ? "Làm lại" : "Bắt đầu"}
                </button>
              </div>
            );
          })}
        </div>
      </ExamShell>
    );
  }

  // ── Màn kết quả test ──
  if (phase === "done") {
    const vals = Object.values(sessionScores);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const passed = vals.filter((s) => s >= Q15_PASS).length;
    return (
      <ExamShell family={skill.family} testName={testName} exitHref={exitHref} nav={[
        { label: "Làm lại test", onClick: () => startTest(activeTest) },
        { label: "← Danh sách test", onClick: () => setPhase("tests"), variant: "primary" },
      ]}>
        <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
          <div style={{ fontSize: "2.5rem" }}>🎉</div>
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: EXAM.ink, margin: "0.3rem 0" }}>Hoàn thành Test {activeTest + 1}!</p>
          {vals.length > 0 && (
            <p style={{ fontSize: "0.95rem", color: EXAM.inkSoft, margin: 0 }}>
              Điểm trung bình: <strong>{avg}%</strong> · Pass <strong>{passed}/{vals.length}</strong> (≥ {Q15_PASS}%)
            </p>
          )}
          <p style={{ fontSize: "0.85rem", color: EXAM.muted, marginTop: 6 }}>
            {userId && !isTestUser ? "Đã lưu tiến độ ✓" : "Đăng nhập để lưu tiến độ"}
          </p>
        </div>
      </ExamShell>
    );
  }

  // ── Màn làm bài ──
  if (!ex) return null;
  const backBtn = idx > 0 ? [{ label: "Back", icon: "◀", onClick: prev }] : [];
  const nav: Parameters<typeof ExamShell>[0]["nav"] = !submitted
    ? [...backBtn, { label: "Chấm điểm", variant: "primary", disabled: !answer.trim(), onClick: submit }]
    : grading
    ? [{ label: "Đang chấm…", variant: "primary", disabled: true }]
    : [{ label: idx < totalInTest - 1 ? "Next ▶" : "Kết thúc ✓", variant: "primary", onClick: next }];

  return (
    <ExamShell family={skill.family} testName={`${testName} · Test ${activeTest + 1}`} questionLabel={`${idx + 1} / ${totalInTest}`} timer={timerOn ? timerStr : undefined} exitHref={exitHref} nav={nav}>
      <ExamDirHeading family={skill.family}>Write a sentence based on a picture</ExamDirHeading>

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
          {grading && <p style={{ fontSize: "0.9rem", color: EXAM.inkSoft, margin: 0 }}>⏳ AI đang chấm…</p>}

          {!grading && ai && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <ScoreBadge score={ai.score} />
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
              <p style={{ fontSize: "0.86rem", color: EXAM.warn, margin: "0 0 6px" }}>⚠️ Không chấm được bằng AI. Hãy tự đối chiếu câu mẫu và đánh giá:</p>
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

function selfBtn(active: boolean, activeColor: string): React.CSSProperties {
  return {
    background: active ? "rgba(31,157,87,0.06)" : "#fff",
    color: active ? activeColor : EXAM.inkSoft,
    border: `1.5px solid ${active ? activeColor : EXAM.border}`,
    borderRadius: 8, padding: "7px 16px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", fontFamily: EXAM.sans,
  };
}

function ScoreBadge({ score }: { score: number }) {
  const passed = score >= Q15_PASS;
  const c = passed ? EXAM.ok : score >= 40 ? EXAM.warn : EXAM.bad;
  const bg = passed ? "rgba(31,157,87,0.12)" : score >= 40 ? "rgba(200,135,26,0.12)" : "rgba(209,67,91,0.12)";
  return (
    <span style={{ display: "inline-block", fontSize: "1.2rem", fontWeight: 800, color: c, background: bg, border: `1.5px solid ${c}`, borderRadius: 8, padding: "3px 14px" }}>{score}%</span>
  );
}
