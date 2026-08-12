"use client";

import { useState, useEffect } from "react";
import { ExamShell, ExamDirHeading } from "@/components/skills/exam/ExamShell";
import { SplitPane } from "@/components/skills/exam/SplitPane";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import { FAMILY, EXAM } from "@/lib/skills/exam-theme";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { type WritingQ15Exercise, type Q15Difficulty, Q15_LEVELS, Q15_PART_KEY, Q15_PASS, Q15_TEST_SIZE, keywordUsed, countWords } from "@/lib/skills/writing-q1-5";

type Best = { score: number; passed: boolean };

type Props = {
  skill: Skill;
  unit: SkillUnit;
  exercises: WritingQ15Exercise[];
  userId: string | null;
  isTestUser: boolean;
  /** HV đã đăng ký khoá học → được gửi bài cho giáo viên chấm. */
  canSubmit: boolean;
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

/** Trạng thái riêng của từng câu trong test — giữ lại khi nhảy qua lại */
type QState = { answer: string; submitted: boolean; ai: AiResult | null; aiFailed: boolean };
const EMPTY_Q: QState = { answer: "", submitted: false, ai: null, aiFailed: false };

const MIN_WORDS = 5;
const TEST_SECONDS = 8 * 60;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export function WritingSentenceClient({ skill, unit, exercises, userId, isTestUser, canSubmit, bestByExercise }: Props) {
  const color = FAMILY[skill.family];

  const [level, setLevel] = useState<Q15Difficulty>("easy");
  const tests = chunk(exercises.filter((e) => e.difficulty === level), Q15_TEST_SIZE);

  const [phase, setPhase] = useState<Phase>("tests");
  const [activeTest, setActiveTest] = useState(0);
  const [idx, setIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(0);
  const [qs, setQs] = useState<Record<number, QState>>({});
  const [gradingIdx, setGradingIdx] = useState<number | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [sessionScores, setSessionScores] = useState<Record<number, number>>({});
  const [best, setBest] = useState<Record<string, Best>>(bestByExercise);
  const [timerOn, setTimerOn] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(TEST_SECONDS);

  const testExs = tests[activeTest] ?? [];
  const totalInTest = testExs.length;
  const ex = testExs[idx];
  const testName = `${skill.label} · ${unit.label}`;
  const levelLabel = Q15_LEVELS.find((l) => l.value === level)!.label;
  const exitHref = `/skills/${skill.slug}`;

  // Đếm ngược 8 phút mỗi test (nếu bật timer)
  useEffect(() => {
    if (phase !== "doing" || !timerOn) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, timerOn]);
  const timerStr = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const q = qs[idx] ?? EMPTY_Q;
  const { answer, submitted, ai, aiFailed } = q;
  const grading = gradingIdx === idx;
  const imgError = ex ? imgErrors[ex.id] === true : false;

  const kw0Used = submitted && ex ? keywordUsed(answer, ex.keywords[0]) : false;
  const kw1Used = submitted && ex ? keywordUsed(answer, ex.keywords[1]) : false;
  const enoughWords = countWords(answer) >= MIN_WORDS;
  const answeredCount = Object.values(qs).filter((s) => s.submitted).length;

  function patchQ(i: number, patch: Partial<QState>) {
    setQs((prev) => ({ ...prev, [i]: { ...(prev[i] ?? EMPTY_Q), ...patch } }));
  }

  function pickLevel(l: Q15Difficulty) {
    setLevel(l);
    setActiveTest(0);
  }

  function startTest(t: number) {
    setActiveTest(t);
    setIdx(0);
    setMaxIdx(0);
    setQs({});
    setGradingIdx(null);
    setImgErrors({});
    setSessionScores({});
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
    if (!answer.trim() || gradingIdx !== null || !ex) return;
    const i = idx;
    const sentence = answer;
    patchQ(i, { submitted: true, aiFailed: false });
    setGradingIdx(i);
    try {
      const res = await fetch("/api/skills/writing-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence, keywords: ex.keywords, modelAnswers: ex.modelAnswers }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as AiResult;
      patchQ(i, { ai: data });
      setSessionScores((prev) => ({ ...prev, [i]: data.score }));
      saveAttempt(ex.id, data.score, data.score >= Q15_PASS);
    } catch {
      patchQ(i, { aiFailed: true });
    } finally {
      setGradingIdx((g) => (g === i ? null : g));
    }
  }

  function markSelf(ok: boolean) {
    if (!ex) return;
    const score = ok ? 100 : 50;
    setSessionScores((prev) => ({ ...prev, [idx]: score }));
    saveAttempt(ex.id, score, ok);
  }

  function goTo(i: number) {
    if (i < 0 || i > maxIdx || i === idx) return;
    setIdx(i);
  }
  function next() {
    if (idx < totalInTest - 1) { const n = idx + 1; setIdx(n); setMaxIdx((m) => Math.max(m, n)); }
    else setPhase("done");
  }
  function prev() {
    if (idx > 0) setIdx(idx - 1);
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

        {/* Chọn mức độ — mỗi mức là một bộ đề riêng */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {Q15_LEVELS.map((l) => {
            const count = exercises.filter((e) => e.difficulty === l.value).length;
            const on = level === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => pickLevel(l.value)}
                style={{
                  flex: "1 1 150px", textAlign: "left", cursor: "pointer", fontFamily: EXAM.sans,
                  border: `1.5px solid ${on ? color.primary : EXAM.border}`,
                  background: on ? color.soft : "#fff",
                  borderRadius: 10, padding: "10px 13px",
                }}
              >
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: on ? color.primary : EXAM.ink }}>
                  {l.label} <span style={{ fontWeight: 600, color: EXAM.muted }}>· {count} câu</span>
                </div>
                <div style={{ fontSize: "0.76rem", color: EXAM.muted, marginTop: 3, lineHeight: 1.4 }}>{l.hint}</div>
              </button>
            );
          })}
        </div>

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
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: EXAM.ink }}>{levelLabel} · Test {t + 1}</div>
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
          <p style={{ fontSize: "1.1rem", fontWeight: 800, color: EXAM.ink, margin: "0.3rem 0" }}>Hoàn thành {levelLabel} · Test {activeTest + 1}!</p>
          {vals.length > 0 && (
            <p style={{ fontSize: "0.95rem", color: EXAM.inkSoft, margin: 0 }}>
              Điểm trung bình: <strong>{avg}%</strong> · Pass <strong>{passed}/{vals.length}</strong> (≥ {Q15_PASS}%)
            </p>
          )}
          <p style={{ fontSize: "0.85rem", color: EXAM.muted, marginTop: 6 }}>
            {userId && !isTestUser ? "Đã lưu tiến độ ✓" : "Đăng nhập để lưu tiến độ"}
          </p>
        </div>

        {userId && (
          <div style={{ marginTop: "1rem", textAlign: "left" }}>
            <SubmissionPanel
              variant="exam"
              skill={skill.slug}
              unit={unit.slug}
              testKey={`${level}-${activeTest + 1}`}
              title={`${skill.label} ${unit.label} · ${levelLabel} Test ${activeTest + 1}`}
              canSubmit={canSubmit}
              buildItems={() =>
                testExs.map((e, i) => ({
                  idx: i,
                  prompt: `${e.keywords[0]} / ${e.keywords[1]}`,
                  text: qs[i]?.answer ?? "",
                }))
              }
            />
          </div>
        )}
      </ExamShell>
    );
  }

  // ── Màn làm bài ──
  if (!ex) return null;
  const backBtn = idx > 0 ? [{ label: "Back", icon: "◀", onClick: prev }] : [];
  const nav: Parameters<typeof ExamShell>[0]["nav"] = !submitted
    ? [...backBtn, { label: "Chấm điểm", variant: "primary", disabled: !answer.trim() || gradingIdx !== null, onClick: submit }]
    : grading
    ? [...backBtn, { label: "Đang chấm…", variant: "primary", disabled: true }]
    : [...backBtn, { label: idx < totalInTest - 1 ? "Next ▶" : "Kết thúc ✓", variant: "primary", onClick: next }];

  // Chấm điều hướng câu hỏi (chỉ nhảy được về câu đã mở)
  const navLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.78rem", color: EXAM.muted, whiteSpace: "nowrap" }}>
        Đã trả lời {answeredCount}/{totalInTest}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {testExs.map((_, i) => {
          const s = qs[i];
          const isCurrent = i === idx;
          const reachable = i <= maxIdx;
          const bg = isCurrent ? color.primary : s?.submitted ? color.soft : "#fff";
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              disabled={!reachable}
              title={s?.submitted ? `Câu ${i + 1} · đã chấm` : `Câu ${i + 1}`}
              style={{
                width: 28, height: 28, borderRadius: "50%", fontFamily: EXAM.sans,
                fontSize: "0.8rem", fontWeight: 700, lineHeight: 1,
                border: `1.5px solid ${reachable ? color.primary : EXAM.border}`,
                background: bg,
                color: isCurrent ? "#fff" : reachable ? color.primary : EXAM.muted,
                opacity: reachable ? 1 : 0.5,
                cursor: reachable && !isCurrent ? "pointer" : "default",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );

  const leftPane = (
    <>
      <ExamDirHeading family={skill.family}>Write a sentence based on a picture</ExamDirHeading>

      <p style={{ fontSize: "1rem", fontWeight: 800, color: EXAM.ink, margin: "0 0 8px" }}>Question {idx + 1}:</p>

      <p style={{ fontSize: "0.86rem", color: EXAM.inkSoft, lineHeight: 1.55, margin: "0 0 14px" }}>
        <strong>Directions:</strong> Write ONE sentence that is based on the picture. With the picture,
        you are given TWO words that you must use in your sentence. You may change the forms of the words
        and use them in any order.
      </p>

      {/* image */}
      <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", background: EXAM.panel, marginBottom: ex.credit ? 4 : 14, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ex.imageUrl} alt={ex.imageAlt} onError={() => setImgErrors((p) => ({ ...p, [ex.id]: true }))} style={{ width: "100%", height: "auto", display: "block" }} />
        ) : (
          <div style={{ padding: "2rem", textAlign: "center", color: EXAM.muted, fontSize: "0.85rem" }}>Không tải được ảnh 🖼️</div>
        )}
      </div>
      {ex.credit && (
        <p style={{ fontSize: "0.66rem", color: EXAM.muted, textAlign: "right", margin: "0 0 12px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>Ảnh: {ex.credit.author}</p>
      )}

      {/* Hai từ bắt buộc — dạng "word / word" dưới ảnh như đề thật */}
      <p style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 700, color: EXAM.ink, margin: "2px 0 4px", fontFamily: EXAM.sans }}>
        {ex.keywords[0]} <span style={{ color: EXAM.muted, fontWeight: 400, margin: "0 6px" }}>/</span> {ex.keywords[1]}
      </p>
    </>
  );

  const rightPane = (
    <>
      <p style={{ fontSize: "0.95rem", fontWeight: 800, color: EXAM.ink, margin: "0 0 8px" }}>Your answer:</p>

      {/* textarea */}
      <textarea
        value={answer}
        onChange={(e) => patchQ(idx, { answer: e.target.value })}
        disabled={submitted}
        placeholder="Type your response here."
        style={{ width: "100%", boxSizing: "border-box", minHeight: "clamp(160px, 32vh, 320px)", padding: "12px 14px", fontSize: "1.05rem", border: `1.5px dashed ${EXAM.border}`, borderRadius: 8, background: "#fff", color: EXAM.ink, outline: "none", resize: "vertical", fontFamily: EXAM.sans, lineHeight: 1.5 }}
      />
      <p style={{ fontSize: "0.82rem", color: EXAM.muted, margin: "6px 0 0" }}>
        Word count: <strong style={{ color: EXAM.inkSoft }}>{countWords(answer)}</strong>
        {!submitted && !enoughWords && answer.trim() ? " · nên viết câu đủ ý (≥ 5 từ)" : ""}
      </p>

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
    </>
  );

  return (
    <ExamShell
      family={skill.family}
      testName={`${testName} · ${levelLabel} · Test ${activeTest + 1}`}
      questionLabel={`${idx + 1} / ${totalInTest}`}
      timer={timerOn ? timerStr : undefined}
      exitHref={exitHref}
      nav={nav}
      navLeft={navLeft}
      fullBleed
    >
      <SplitPane left={leftPane} right={rightPane} />
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
