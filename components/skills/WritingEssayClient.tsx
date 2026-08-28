"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import {
  Q8_DIRECTIONS,
  Q8_FORMS,
  Q8_MIN_WORDS,
  Q8_PART_KEY,
  Q8_PROMPTS,
  Q8_SECONDS,
  fallbackQ8Score,
  wordCount,
  type Q8Prompt,
} from "@/lib/skills/writing-q8";
import { EXAM, FAMILY } from "@/lib/skills/exam-theme";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import type { SubmissionItem } from "@/lib/submissions";
import { ModePicker } from "@/components/skills/exam/SpeakingUnitList";
import type { SpeakingMode } from "@/components/skills/exam/SpeakingRunner";

type Phase = "list" | "doing" | "review";

type Assess = {
  rubric: number;
  criteria: { opinionSupported: number; grammar: number; vocabulary: number; organization: number };
  feedback: string;
  toImprove: string[];
  fixes: { original: string; corrected: string; why: string }[];
  wordCount: number;
};

const FORM_COLOR: Record<string, string> = {
  agree_disagree: "#1e419a",
  choice_2: "#0d9488",
  choice_3: "#0891b2",
  pros_cons: "#7c3aed",
  open_q: "#a16207",
  policy: "#c2410c",
};

const DRAFT_PREFIX = "q8-draft:";

type Draft = { v: 1; mode: SpeakingMode; answer: string; deadlineAt?: number; elapsed: number; savedAt: number };

function readDraft(id: string): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + id);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d?.v === 1 ? d : null;
  } catch {
    return null;
  }
}

function writeDraft(id: string, d: Draft) {
  try { localStorage.setItem(DRAFT_PREFIX + id, JSON.stringify(d)); } catch { /* bỏ qua */ }
}

function clearDraft(id: string) {
  try { localStorage.removeItem(DRAFT_PREFIX + id); } catch { /* bỏ qua */ }
}

const mmss = (s: number) =>
  `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export function WritingEssayClient({
  skill,
  unit,
  userId,
  isTestUser,
  canSubmit,
  unlocked,
  bestByPrompt,
}: {
  skill: Skill;
  unit: SkillUnit;
  userId: string | null;
  isTestUser: boolean;
  canSubmit: boolean;
  unlocked: boolean;
  bestByPrompt: Record<string, { score: number; passed: boolean }>;
}) {
  const color = FAMILY[skill.family];

  const [phase, setPhase] = useState<Phase>("list");
  const [mode, setMode] = useState<SpeakingMode>("practice");
  const [prompt, setPrompt] = useState<Q8Prompt | null>(null);
  const [answer, setAnswer] = useState("");
  const [left, setLeft] = useState(Q8_SECONDS);
  const [elapsed, setElapsed] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [assess, setAssess] = useState<Assess | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const elapsedBaseRef = useRef(0);
  const sessionStartRef = useRef(0);
  const finishRef = useRef<() => void>(() => {});
  const words = wordCount(answer);

  useEffect(() => {
    const all: Record<string, Draft> = {};
    for (const p of Q8_PROMPTS) {
      const d = readDraft(p.id);
      if (d) all[p.id] = d;
    }
    setDrafts(all);
  }, []);

  // ── Đồng hồ (mốc tuyệt đối nên không lệch khi tab chạy nền) ───────
  // Thi thử hết 30 phút thì nộp ngay trong callback, không tách effect riêng.
  useEffect(() => {
    if (phase !== "doing") return;
    const t = setInterval(() => {
      setElapsed(elapsedBaseRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000));
      if (!deadlineAt) return;
      const rest = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setLeft(rest);
      if (rest === 0) {
        clearInterval(t);
        finishRef.current();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, deadlineAt]);

  const grade = useCallback(async (p: Q8Prompt, essay: string) => {
    setGrading(true);
    setGradeError(null);
    try {
      const res = await fetch("/api/skills/writing-q8-assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: p.question, essay }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setAssess((await res.json()) as Assess);
    } catch {
      setGradeError("Chưa chấm được bằng AI — dùng tạm đánh giá theo độ dài bên dưới.");
      setAssess(null);
    } finally {
      setGrading(false);
    }
  }, []);

  const finish = useCallback(() => {
    if (!prompt) return;
    clearDraft(prompt.id);
    setDrafts((prev) => { const n = { ...prev }; delete n[prompt.id]; return n; });
    setPhase("review");
    setSaved(false);
    const essay = answer.trim();
    if (wordCount(essay) >= 20) void grade(prompt, essay);
  }, [prompt, grade, answer]);

  // Đồng hồ ở trên chạy trước khi `finish` được khai báo, nên gọi qua ref.
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  // ── Tự lưu nháp ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "doing" || !prompt) return;
    const id = prompt.id;
    if (!answer.trim()) {
      clearDraft(id);
      setDrafts((prev) => { if (!prev[id]) return prev; const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    const t = setTimeout(() => {
      const d: Draft = {
        v: 1,
        mode,
        answer,
        deadlineAt: deadlineAt ?? undefined,
        elapsed: elapsedBaseRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000),
        savedAt: Date.now(),
      };
      writeDraft(id, d);
      setDrafts((prev) => ({ ...prev, [id]: d }));
    }, 700);
    return () => clearTimeout(t);
  }, [phase, prompt, answer, mode, deadlineAt]);

  function start(p: Q8Prompt, m: SpeakingMode, resume?: Draft) {
    const useMode = resume?.mode ?? m;
    setPrompt(p);
    setMode(useMode);
    setAnswer(resume?.answer ?? "");
    setAssess(null);
    setGradeError(null);
    setSaved(false);

    const base = resume?.elapsed ?? 0;
    elapsedBaseRef.current = base;
    sessionStartRef.current = Date.now();
    setElapsed(base);

    // Thi thử: giữ nguyên mốc hết giờ đã lưu, tải lại trang không được thêm thời gian
    const dl = useMode === "exam" ? (resume?.deadlineAt ?? Date.now() + Q8_SECONDS * 1000) : null;
    setDeadlineAt(dl);
    setLeft(dl ? Math.max(0, Math.ceil((dl - Date.now()) / 1000)) : Q8_SECONDS);
    setPhase("doing");
  }

  function saveProgress() {
    if (!prompt) return;
    const rubric = assess ? assess.rubric : fallbackQ8Score(words).rubric;
    if (!userId || isTestUser) { setSaved(true); return; }
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: Q8_PART_KEY,
        questionWord: prompt.id,
        exerciseIndex: 0,
        score: Math.round((rubric / 5) * 100),
        passed: rubric >= 3,
        itemIdx: null,
      }),
    }).catch(() => {});
    setSaved(true);
  }

  async function buildItems(): Promise<SubmissionItem[]> {
    return [{ idx: 0, prompt: prompt?.question ?? "", text: answer }];
  }

  // ══════════════════════════════════════
  // Danh sách đề
  // ══════════════════════════════════════
  if (phase === "list") {
    return (
      <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1.5rem, 5vw, 3rem)", maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
          <Link href="/skills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Luyện đề</Link>
          <span>›</span>
          <Link href={`/skills/${skill.slug}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>{skill.label}</Link>
          <span>›</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{unit.label}</span>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.3rem" }}>
            {skill.emoji} {skill.label} · {unit.label}
          </p>
          <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 0.5rem" }}>
            {unit.labelVi}{" "}
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({unit.labelEn})</span>
          </h1>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{unit.description}</p>
        </div>

        <ModePicker mode={mode} onChange={setMode} />

        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "1.2rem 0 0.4rem" }}>
          {Q8_PROMPTS.length} đề luận, chia theo 6 dạng câu hỏi. Thi thật cho 30 phút và
          bài hiệu quả thường tối thiểu {Q8_MIN_WORDS} từ. Bài nộp được AI chấm ngay theo
          rubric ETS 0-5, và vẫn gửi được cho giáo viên chấm tay.
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 1.3rem" }}>
          {mode === "exam"
            ? "⏱ Thi thử: đồng hồ đếm ngược 30 phút, hết giờ tự nộp, không tạm dừng được."
            : "🎧 Luyện tập: không giới hạn thời gian, đồng hồ chỉ đếm lên để bạn tự canh."}
          {!unlocked && " · Một số đề cần đăng ký khoá học."}
        </p>

        {Q8_FORMS.map((f) => {
          const list = Q8_PROMPTS.filter((p) => p.form === f.id);
          if (!list.length) return null;
          const c = FORM_COLOR[f.id] ?? "#1e419a";
          return (
            <section key={f.id} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {f.label}{" "}
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, fontStyle: "italic" }}>({f.labelEn})</span>
                </h2>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{list.length} đề</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 0.8rem" }}>{f.hint}</p>

              <div style={{ display: "grid", gap: "0.7rem" }}>
                {list.map((p) => {
                  const locked = !unlocked && !p.free;
                  const best = bestByPrompt[p.id];
                  const draft = drafts[p.id];
                  const box: React.CSSProperties = {
                    textAlign: "left",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid ${c}`,
                    borderRadius: 10,
                    padding: "0.8rem 1rem",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    width: "100%",
                    cursor: locked ? "not-allowed" : "pointer",
                    opacity: locked ? 0.5 : 1,
                  };
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={locked}
                      onClick={() => start(p, mode, draft ?? undefined)}
                      style={box}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        Đề {p.index} · {p.topicVi}{locked ? " 🔒" : ""}
                        {best && (
                          <span style={{ color: best.passed ? "#16a34a" : "#ca8a04", fontWeight: 700 }}>
                            ✓ đã làm — mức {Math.round((best.score / 100) * 5)}/5
                          </span>
                        )}
                        {draft && (
                          <span style={{ color: "#2563eb", fontWeight: 700 }}>
                            ✍️ còn bản nháp {wordCount(draft.answer)} từ
                          </span>
                        )}
                      </span>
                      <span style={{ display: "block", fontSize: "0.88rem", lineHeight: 1.6, marginTop: 4 }}>{p.question}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // ══════════════════════════════════════
  // Màn làm bài — bố cục ETS: cột trái đề, cột phải ô soạn thảo
  // ══════════════════════════════════════
  if (phase === "doing" && prompt) {
    const timeLabel = mode === "exam" ? mmss(left) : mmss(elapsed);
    const lowTime = mode === "exam" && left <= 120;

    return (
      <div style={{ fontFamily: EXAM.sans, maxWidth: 1100, margin: "0 auto", padding: "clamp(0.8rem, 2vw, 1.4rem) clamp(0.6rem, 3vw, 1.5rem)" }}>
        <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 12, overflow: "hidden", background: EXAM.bg, color: EXAM.ink, boxShadow: "0 18px 40px -24px rgba(20,40,90,.4)" }}>
          {/* Thanh trên */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 16px", color: "#fff", background: `linear-gradient(180deg, ${color.primary}, ${color.dark})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: "1.05rem", minWidth: 0 }}>
              <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>✳</span>
              <span>TOEIC</span>
              <span style={{ fontWeight: 600, opacity: 0.85, fontSize: "0.82rem", borderLeft: "1px solid rgba(255,255,255,.35)", paddingLeft: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Question 8 · {mode === "exam" ? "Thi thử" : "Luyện tập"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.9rem", flexShrink: 0 }}>
              <span style={{ opacity: 0.9, whiteSpace: "nowrap" }}>Question 8 / 8</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: lowTime ? "rgba(255,120,120,.35)" : "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 7, padding: "4px 10px", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                ⏱ {timeLabel}
              </span>
            </div>
          </div>

          {/* Thân: cột đề + ô soạn thảo */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 0.85fr) 1.15fr", minHeight: "58vh" }}>
            <div style={{ borderRight: `1px solid ${EXAM.border}`, display: "flex", flexDirection: "column" }}>
              <div style={{ background: color.primary, color: "#fff", padding: "12px 14px", fontSize: "0.86rem", fontWeight: 700, lineHeight: 1.55 }}>
                Directions: {Q8_DIRECTIONS}
              </div>
              <div style={{ padding: "14px", fontSize: "0.98rem", lineHeight: 1.75, color: EXAM.ink, overflowY: "auto" }}>
                {prompt.question}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="(Type your response here.)"
                spellCheck={false}
                style={{
                  flex: 1,
                  minHeight: "48vh",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  padding: "14px",
                  fontSize: "0.98rem",
                  lineHeight: 1.75,
                  fontFamily: EXAM.sans,
                  color: EXAM.ink,
                  background: "#fff",
                }}
              />
              <div style={{ borderTop: `1px solid ${EXAM.border}`, padding: "7px 14px", fontSize: "0.8rem", color: words >= Q8_MIN_WORDS ? "#16a34a" : EXAM.muted, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>
                  Word count: <strong>{words}</strong>
                  <span style={{ color: EXAM.muted }}> / {Q8_MIN_WORDS} từ khuyến nghị</span>
                </span>
                {drafts[prompt.id] && <span style={{ color: EXAM.muted }}>đã lưu nháp</span>}
              </div>
            </div>
          </div>

          {/* Thanh dưới */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: EXAM.panelAlt, borderTop: `1px solid ${EXAM.border}`, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setPhase("list")}
              title="Bài viết đã lưu nháp, thoát ra vẫn quay lại làm tiếp được"
              style={{ background: "none", border: "none", color: EXAM.muted, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Thoát
            </button>
            <span style={{ fontSize: "0.78rem", color: EXAM.muted }}>
              {mode === "exam" ? "Hết 30 phút bài sẽ tự nộp." : "Không giới hạn thời gian — nộp khi bạn thấy đủ."}
            </span>
            <button
              type="button"
              onClick={finish}
              disabled={words < 10}
              style={{
                marginLeft: "auto",
                padding: "9px 24px",
                borderRadius: 7,
                border: `1px solid ${color.primary}`,
                background: words < 10 ? "#9aa6bd" : color.primary,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.86rem",
                cursor: words < 10 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Nộp bài & chấm ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  // Màn kết quả
  // ══════════════════════════════════════
  if (phase === "review" && prompt) {
    const fb = fallbackQ8Score(words);
    const rubric = assess ? assess.rubric : fb.rubric;
    const tone = rubric >= 4 ? "#16a34a" : rubric >= 3 ? "#ca8a04" : "#dc2626";

    return (
      <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.2rem, 4vw, 2.2rem) clamp(1rem, 5vw, 3rem)", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 6px", textAlign: "center" }}>
          Question 8 · Đề {prompt.index} · {mode === "exam" ? "Thi thử" : "Luyện tập"}
        </p>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", margin: "0 0 1.2rem" }}>
          {prompt.topicVi}
        </h1>

        <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.2rem" }}>
          <div style={{ minWidth: 120, padding: "12px 20px", borderRadius: 12, border: `1.5px solid ${tone}55`, background: `${tone}14`, textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: tone, lineHeight: 1 }}>
              {grading ? "…" : rubric}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>/5</span>
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: tone, letterSpacing: "0.05em", marginTop: 3 }}>RUBRIC ETS</div>
          </div>
          <div style={{ fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 420 }}>
            <div><strong>{words}</strong> từ · thời gian làm bài <strong>{mmss(elapsed)}</strong></div>
            {grading && <div style={{ color: "var(--text-muted)" }}>Đang chấm bằng AI…</div>}
            {!grading && !assess && <div style={{ color: "#ca8a04" }}>{gradeError ?? fb.note}</div>}
          </div>
        </div>

        {assess && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: "1rem" }}>
              {([
                ["Ý kiến có lý lẽ / ví dụ", assess.criteria.opinionSupported],
                ["Ngữ pháp", assess.criteria.grammar],
                ["Từ vựng", assess.criteria.vocabulary],
                ["Bố cục", assess.criteria.organization],
              ] as const).map(([label, v]) => (
                <div key={label} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "8px 11px", background: "var(--bg-secondary)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>{v}<span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)" }}>/5</span></div>
                </div>
              ))}
            </div>

            {assess.feedback && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", background: "var(--bg-secondary)", marginBottom: "0.9rem" }}>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.7, color: "var(--text-primary)" }}>{assess.feedback}</p>
              </div>
            )}

            {assess.toImprove.length > 0 && (
              <div style={{ marginBottom: "0.9rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.4rem" }}>Để lên một mức</p>
                <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {assess.toImprove.map((t, i) => (
                    <li key={i} style={{ fontSize: "0.85rem", lineHeight: 1.65, color: "var(--text-secondary)", marginBottom: 3 }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {assess.fixes.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.4rem" }}>Sửa lỗi cụ thể</p>
                {assess.fixes.map((f, i) => (
                  <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "9px 12px", marginBottom: 6, background: "var(--bg-secondary)" }}>
                    <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.6, color: "#dc2626", textDecoration: "line-through" }}>{f.original}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "0.84rem", lineHeight: 1.6, color: "#16a34a", fontWeight: 600 }}>{f.corrected}</p>
                    {f.why && <p style={{ margin: "3px 0 0", fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-muted)" }}>{f.why}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <details style={{ marginBottom: "1rem" }}>
          <summary style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-primary)", cursor: "pointer" }}>Xem lại bài viết của bạn</summary>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "0.87rem", lineHeight: 1.75, color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 9, padding: "12px 14px", marginTop: 6, background: "var(--bg-secondary)" }}>
            {answer}
          </div>
        </details>

        {userId && (
          <div style={{ marginBottom: "1rem" }}>
            <SubmissionPanel
              variant="exam"
              skill={skill.slug}
              unit={unit.slug}
              testKey={prompt.id}
              title={`Writing Question 8 · ${prompt.topicVi}`}
              canSubmit={canSubmit}
              buildItems={buildItems}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={saveProgress}
            disabled={saved || grading}
            style={{ padding: "9px 22px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: "0.86rem", cursor: saved ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {saved ? "✓ Đã lưu tiến độ" : "Lưu tiến độ"}
          </button>
          <button
            type="button"
            onClick={() => start(prompt, mode)}
            style={{ padding: "9px 22px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            Viết lại đề này
          </button>
          <button
            type="button"
            onClick={() => setPhase("list")}
            style={{ padding: "9px 22px", border: "none", background: color.primary, color: "#fff", borderRadius: 8, fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
          >
            Chọn đề khác →
          </button>
        </div>
      </div>
    );
  }

  return null;
}
