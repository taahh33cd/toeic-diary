"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type StepTest,
  type StepItem,
  type StepBlank,
  type Difficulty,
  getStepItems,
  checkBlank,
  mcqOptions,
  dbPartSteps,
  GRADED_PER_IMAGE,
  STEPS_PASS_THRESHOLD as PASS,
} from "@/lib/subskills/speaking-p2-steps";
import { RecordingPanel } from "@/components/subskills/speaking/RecordingPanel";

type Phase = "intro" | "practice" | "done";
type BestMap = Record<string, { score: number; passed: boolean }>;
type DraftEntry = { imgIdx: number; correctCount: number; diff: Difficulty };
type DraftsMap = Record<number, DraftEntry>;

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];
const DIFF_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

type SubState = { pick: string | null; mcqDone: boolean; blank: string; blankDone: boolean };
const emptySub = (): SubState => ({ pick: null, mcqDone: false, blank: "", blankDone: false });
type StepStates = { 1: SubState; 2: SubState; 3: SubState };
const emptyStates = (): StepStates => ({ 1: emptySub(), 2: emptySub(), 3: emptySub() });

interface Props {
  allTests: StepTest[];
  easyBest: BestMap;
  mediumBest: BestMap;
  hardBest: BestMap;
  isTestUser: boolean;
  userId: string | null;
}

export default function SpeakingP2StepsClient({
  allTests, easyBest, mediumBest, hardBest, isTestUser, userId,
}: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [testNum, setTestNum] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [imgIdx, setImgIdx] = useState(0);
  const [correctCount, setCorrect] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [st, setSt] = useState<StepStates>(emptyStates());
  const [freeText, setFreeText] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [drafts, setDrafts] = useState<DraftsMap>({});

  const test = allTests.find((t) => t.testNum === testNum) ?? allTests[0];
  const items: StepItem[] = test ? getStepItems(test, difficulty) : [];
  const item = items[imgIdx];
  const total = items.length;
  const bestMap = difficulty === "easy" ? easyBest : difficulty === "medium" ? mediumBest : hardBest;

  // ── drafts ────────────────────────────────────────────────
  useEffect(() => {
    const loaded: DraftsMap = {};
    for (const t of allTests) {
      try {
        const raw = localStorage.getItem(`ss_sp2s_${t.testNum}`);
        if (!raw) continue;
        const d = JSON.parse(raw) as DraftEntry;
        if (typeof d.imgIdx === "number" && typeof d.correctCount === "number" && d.diff) loaded[t.testNum] = d;
      } catch { /* ignore corrupt entries */ }
    }
    if (Object.keys(loaded).length > 0) setDrafts(loaded);
  }, [allTests]);

  const saveDraft = useCallback((entry: DraftEntry, t: number) => {
    try { localStorage.setItem(`ss_sp2s_${t}`, JSON.stringify(entry)); } catch { /* quota */ }
    setDrafts((prev) => ({ ...prev, [t]: entry }));
  }, []);

  const clearDraft = useCallback((t: number) => {
    try { localStorage.removeItem(`ss_sp2s_${t}`); } catch { /* ignore */ }
    setDrafts((prev) => { const n = { ...prev }; delete n[t]; return n; });
  }, []);

  // ── progress ──────────────────────────────────────────────
  const saveProgress = useCallback((newCorrect: number, t: number, diff: Difficulty, nItems: number) => {
    if (!userId || nItems === 0) return;
    const score = Math.round((newCorrect / (nItems * GRADED_PER_IMAGE)) * 100);
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: dbPartSteps(diff),
        questionWord: String(t),
        exerciseIndex: 0,
        score,
        passed: score >= PASS,
      }),
    }).catch(() => { /* offline is fine, retried on next answer */ });
  }, [userId]);

  // ── unlock ────────────────────────────────────────────────
  const scoreOf = (map: BestMap, t: number) => map[String(t)]?.score ?? 0;
  const unlocked = (t: number, d: Difficulty) =>
    isTestUser || d === "easy" ||
    (d === "medium" ? scoreOf(easyBest, t) >= PASS : scoreOf(mediumBest, t) >= PASS);

  // ── actions ───────────────────────────────────────────────
  function start(t: number, d: Difficulty, resume: boolean) {
    const draft = drafts[t];
    setTestNum(t);
    setDifficulty(resume && draft ? draft.diff : d);
    setImgIdx(resume && draft ? draft.imgIdx : 0);
    setCorrect(resume && draft ? draft.correctCount : 0);
    setStep(1);
    setSt(emptyStates());
    setFreeText("");
    setShowModel(false);
    setImgError(false);
    setPhase("practice");
  }

  function award(ok: boolean) {
    if (!ok) return;
    const next = correctCount + 1;
    setCorrect(next);
    saveProgress(next, testNum, difficulty, total);
  }

  function submitMcq(n: 1 | 2) {
    if (!item) return;
    const sub = st[n];
    if (!sub.pick || sub.mcqDone) return;
    const mcq = n === 1 ? item.step1.mcq : item.step2.mcq;
    award(sub.pick === mcq.correct);
    setSt((p) => ({ ...p, [n]: { ...p[n], mcqDone: true } }));
  }

  function submitBlank(n: 1 | 2 | 3) {
    if (!item) return;
    const sub = st[n];
    if (!sub.blank.trim() || sub.blankDone) return;
    const blank: StepBlank = n === 1 ? item.step1.blank : n === 2 ? item.step2.blank : item.step3.blank;
    award(checkBlank(blank, sub.blank));
    setSt((p) => ({ ...p, [n]: { ...p[n], blankDone: true } }));
  }

  function nextImage() {
    const last = imgIdx >= total - 1;
    if (last) {
      clearDraft(testNum);
      setPhase("done");
      return;
    }
    const ni = imgIdx + 1;
    setImgIdx(ni);
    setStep(1);
    setSt(emptyStates());
    setFreeText("");
    setShowModel(false);
    setImgError(false);
    saveDraft({ imgIdx: ni, correctCount, diff: difficulty }, testNum);
  }

  // ══════════════════════════════════════════════════════════
  // INTRO
  // ══════════════════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.1rem 1.3rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Quy trình 3 bước mô tả tranh
          </div>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>
            <li><b>Bước 1 — Where was this picture taken?</b> Nêu địa điểm + chủ thể chính (<i>in / on / at</i>).</li>
            <li><b>Bước 2 — What can you see first?</b> Chủ thể nổi bật nhất + hành động (<i>V-ing</i>).</li>
            <li><b>Bước 3 — Describe left / right / background.</b> Vị trí, ngoại hình, trang phục, hành động, nền và tiền cảnh.</li>
          </ol>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Mỗi ảnh có {GRADED_PER_IMAGE} câu tự chấm (2 trắc nghiệm + 3 điền từ), một phần viết tự do có đáp án mẫu, và phần ghi âm cả bài.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {allTests.map((t, i) => {
            const draft = drafts[t.testNum];
            const counts = { easy: t.easy.length, medium: t.medium.length, hard: t.hard.length };
            const totalImgs = counts.easy + counts.medium + counts.hard;
            return (
              <div key={t.testNum} style={{ padding: "1.05rem 1.3rem", background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", borderBottom: i < allTests.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>Bộ {t.testNum}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{totalImgs} ảnh</span>
                  {draft && (
                    <span style={{ fontSize: "0.68rem", color: "rgb(234,179,8)", background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.35)", borderRadius: 999, padding: "1px 8px" }}>
                      đang làm · ảnh {draft.imgIdx + 1}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  {DIFFS.map((d) => {
                    const n = counts[d];
                    if (n === 0) return null;
                    const open = unlocked(t.testNum, d);
                    const map = d === "easy" ? easyBest : d === "medium" ? mediumBest : hardBest;
                    const sc = map[String(t.testNum)]?.score;
                    if (!open) {
                      return (
                        <span key={d} title={`Cần ${d === "medium" ? "Easy" : "Medium"} ≥ ${PASS}% để mở`}
                          style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.8rem", background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1.5px solid var(--border)", cursor: "not-allowed", opacity: 0.55 }}>
                          🔒 {DIFF_LABEL[d]}
                        </span>
                      );
                    }
                    return (
                      <button key={d} onClick={() => start(t.testNum, d, false)}
                        style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                          background: sc !== undefined && sc >= PASS ? "rgba(34,197,94,0.14)" : "var(--bg-elevated)",
                          color: sc !== undefined && sc >= PASS ? "rgb(34,197,94)" : "var(--text-primary)",
                          border: `1.5px solid ${sc !== undefined && sc >= PASS ? "rgba(34,197,94,0.45)" : "var(--border)"}` }}>
                        {DIFF_LABEL[d]} · {n} ảnh{sc !== undefined ? ` · ${sc}%${sc >= PASS ? " ✓" : ""}` : ""}
                      </button>
                    );
                  })}
                  {draft && (
                    <button onClick={() => start(t.testNum, draft.diff, true)}
                      style={{ padding: "5px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "var(--accent-primary)", color: "#fff", border: "1.5px solid var(--accent-primary)" }}>
                      Tiếp tục →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DONE
  // ══════════════════════════════════════════════════════════
  if (phase === "done") {
    const score = total > 0 ? Math.round((correctCount / (total * GRADED_PER_IMAGE)) * 100) : 0;
    const passed = score >= PASS;
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)" }}>
        <div style={{ fontSize: "2.6rem", marginBottom: "0.5rem" }}>{passed ? "🎉" : "💪"}</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: passed ? "rgb(34,197,94)" : "var(--text-primary)" }}>{score}%</div>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0.5rem 0 1.25rem" }}>
          {passed ? `Đạt ngưỡng ${PASS}% — bạn đã mở cấp độ tiếp theo!` : `Chưa đạt ngưỡng ${PASS}%. Làm lại để cải thiện nhé!`}
          <br />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Đúng {correctCount}/{total * GRADED_PER_IMAGE} câu tự chấm · {total} ảnh
          </span>
        </p>
        <button onClick={() => { setPhase("intro"); setImgIdx(0); setCorrect(0); }}
          style={{ padding: "0.6rem 1.4rem", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" }}>
          ← Về danh sách bộ test
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PRACTICE
  // ══════════════════════════════════════════════════════════
  if (!item) return null;

  const stepData = step === 1 ? item.step1 : step === 2 ? item.step2 : null;
  const sub = st[step];
  const blank: StepBlank = step === 1 ? item.step1.blank : step === 2 ? item.step2.blank : item.step3.blank;
  const stepTitle = step === 1
    ? "Bước 1 — Where was this picture taken?"
    : step === 2
      ? "Bước 2 — What can you see first in this picture?"
      : "Bước 3 — Describe the left/right side and background";

  const stepComplete = step === 3 ? sub.blankDone : sub.mcqDone && sub.blankDone;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        <button onClick={() => setPhase("intro")}
          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer" }}>
          ← Thoát
        </button>
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Bộ {testNum} · {DIFF_LABEL[difficulty]} · Ảnh {imgIdx + 1}/{total}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Đúng {correctCount}/{total * GRADED_PER_IMAGE}
        </span>
      </div>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "0.9rem" }}>
        {([1, 2, 3] as const).map((n) => {
          const done = n === 3 ? st[3].blankDone : st[n].mcqDone && st[n].blankDone;
          const active = n === step;
          return (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 999, background: done ? "rgb(34,197,94)" : active ? "var(--accent-primary)" : "var(--border)" }} />
          );
        })}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem" }}>
        {/* Image */}
        {!imgError && (
          <div style={{ width: "100%", background: "var(--bg-elevated)", display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={item.id} src={item.image} alt={item.title} onError={() => setImgError(true)}
              style={{ maxWidth: "100%", height: "auto", display: "block" }} />
          </div>
        )}

        <div style={{ padding: "1.35rem 1.6rem" }}>
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.35rem" }}>
            {stepTitle}
          </div>

          {/* ── MCQ (steps 1 & 2) ── */}
          {stepData && (
            <>
              <p style={{ fontSize: "1.05rem", color: "var(--text-primary)", margin: "0 0 0.85rem", lineHeight: 1.55 }}>
                {stepData.mcq.instruction}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1rem" }}>
                {mcqOptions(stepData.mcq, item.id + step).map((opt, i) => {
                  const picked = sub.pick === opt;
                  const isRight = opt === stepData.mcq.correct;
                  let bg = "var(--bg-elevated)", bd = "var(--border)", col = "var(--text-primary)";
                  if (sub.mcqDone) {
                    if (isRight) { bg = "rgba(34,197,94,0.12)"; bd = "rgba(34,197,94,0.5)"; col = "rgb(34,197,94)"; }
                    else if (picked) { bg = "rgba(239,68,68,0.1)"; bd = "rgba(239,68,68,0.45)"; col = "rgb(239,68,68)"; }
                  } else if (picked) { bg = "rgba(59,130,246,0.12)"; bd = "var(--accent-primary)"; }
                  return (
                    <button key={i} disabled={sub.mcqDone}
                      onClick={() => setSt((p) => ({ ...p, [step]: { ...p[step], pick: opt } }))}
                      style={{ textAlign: "left", padding: "0.7rem 0.95rem", borderRadius: 8, border: `1.5px solid ${bd}`, background: bg, color: col, fontSize: "0.97rem", cursor: sub.mcqDone ? "default" : "pointer", lineHeight: 1.5 }}>
                      <b style={{ marginRight: 8, opacity: 0.7 }}>{String.fromCharCode(65 + i)}.</b>{opt}
                    </button>
                  );
                })}
              </div>
              {!sub.mcqDone ? (
                <button onClick={() => submitMcq(step as 1 | 2)} disabled={!sub.pick}
                  style={{ padding: "0.55rem 1.3rem", borderRadius: 8, border: "none", background: sub.pick ? "var(--accent-primary)" : "var(--bg-elevated)", color: sub.pick ? "#fff" : "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600, cursor: sub.pick ? "pointer" : "not-allowed", marginBottom: "1rem" }}>
                  Kiểm tra
                </button>
              ) : (
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.85rem", margin: "0 0 1.1rem", lineHeight: 1.6 }}>
                  💡 {stepData.mcq.explanation}
                </p>
              )}
            </>
          )}

          {/* ── Fill in the blank (all steps) ── */}
          {(step === 3 || sub.mcqDone) && (
            <>
              <p style={{ fontSize: "1.05rem", color: "var(--text-primary)", margin: "0 0 0.6rem", lineHeight: 1.55 }}>
                {blank.instruction}
              </p>
              <div style={{ fontSize: "1rem", color: "var(--text-primary)", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem 0.95rem", marginBottom: "0.7rem", lineHeight: 1.7 }}>
                {blank.content}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.8rem" }}>
                <input value={sub.blank} disabled={sub.blankDone}
                  onChange={(e) => setSt((p) => ({ ...p, [step]: { ...p[step], blank: e.target.value } }))}
                  onKeyDown={(e) => { if (e.key === "Enter") submitBlank(step); }}
                  placeholder="Nhập đáp án…"
                  style={{ flex: "1 1 180px", padding: "0.6rem 0.85rem", borderRadius: 8, fontSize: "1rem",
                    border: `1.5px solid ${sub.blankDone ? (checkBlank(blank, sub.blank) ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.5)") : "var(--border)"}`,
                    background: "var(--bg-elevated)", color: "var(--text-primary)" }} />
                {!sub.blankDone && (
                  <button onClick={() => submitBlank(step)} disabled={!sub.blank.trim()}
                    style={{ padding: "0.55rem 1.3rem", borderRadius: 8, border: "none", background: sub.blank.trim() ? "var(--accent-primary)" : "var(--bg-elevated)", color: sub.blank.trim() ? "#fff" : "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600, cursor: sub.blank.trim() ? "pointer" : "not-allowed" }}>
                    Kiểm tra
                  </button>
                )}
              </div>
              {sub.blankDone && (
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.6rem 0.85rem", margin: "0 0 1.1rem", lineHeight: 1.6 }}>
                  {checkBlank(blank, sub.blank)
                    ? <span style={{ color: "rgb(34,197,94)", fontWeight: 600 }}>✓ Chính xác! </span>
                    : <span style={{ color: "rgb(239,68,68)", fontWeight: 600 }}>✗ Đáp án: {blank.answers[0]}. </span>}
                  {blank.explanation}
                </p>
              )}
            </>
          )}

          {/* ── Model sentences (steps 1 & 2, after both graded parts) ── */}
          {stepData && stepComplete && (
            <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, padding: "0.85rem 1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.45rem" }}>
                3 mẫu câu bạn có thể dùng
              </div>
              <ol style={{ margin: 0, paddingLeft: "1.15rem", fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.75 }}>
                {stepData.models.map((m, i) => <li key={i}>{m}</li>)}
              </ol>
            </div>
          )}

          {/* ── Step 3: free writing + model answer ── */}
          {step === 3 && st[3].blankDone && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "1.05rem", color: "var(--text-primary)", margin: "0 0 0.6rem", lineHeight: 1.55 }}>
                {item.step3.freeWrite.instruction}
              </p>
              <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={5}
                placeholder="Viết phần mô tả chi tiết của bạn ở đây…"
                style={{ width: "100%", boxSizing: "border-box", padding: "0.75rem 0.95rem", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "1rem", lineHeight: 1.65, fontFamily: "inherit", resize: "vertical" }} />
              <button onClick={() => setShowModel((v) => !v)}
                style={{ marginTop: "0.6rem", padding: "0.5rem 1.1rem", borderRadius: 8, border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
                {showModel ? "Ẩn đáp án mẫu" : "Xem đáp án mẫu"}
              </button>
              {showModel && (
                <div style={{ marginTop: "0.7rem", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "0.85rem 1rem" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgb(34,197,94)", marginBottom: "0.4rem" }}>Đáp án mẫu</div>
                  <p style={{ margin: 0, fontSize: "0.97rem", color: "var(--text-primary)", lineHeight: 1.75 }}>{item.step3.freeWrite.model}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Recording (after step 3 complete) ── */}
          {step === 3 && st[3].blankDone && userId && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                🎙 Nói lại cả bài mô tả
              </div>
              <RecordingPanel
                key={`${testNum}-${difficulty}-${item.id}`}
                referenceText={item.fullModel}
                skillId={`p2steps-${difficulty}`}
                testNum={testNum}
                exerciseIndex={imgIdx}
                userId={userId}
              />
            </div>
          )}

          {/* ── Navigation ── */}
          {stepComplete && (
            <button
              onClick={() => {
                if (step < 3) { setStep((step + 1) as 2 | 3); return; }
                nextImage();
              }}
              style={{ padding: "0.65rem 1.5rem", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
              {step < 3 ? `Bước ${step + 1} →` : imgIdx >= total - 1 ? "Hoàn thành bộ test" : "Ảnh tiếp theo →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
