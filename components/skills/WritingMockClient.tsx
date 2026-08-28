"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Skill, SkillUnit } from "@/lib/skills/structure";
import { EXAM, FAMILY } from "@/lib/skills/exam-theme";
import { SubmissionPanel } from "@/components/skills/SubmissionPanel";
import type { SubmissionItem } from "@/lib/submissions";
import type { SpeakingMode } from "@/components/skills/exam/SpeakingRunner";
import {
  WM_DIRECTIONS,
  WM_Q15_SECONDS,
  WM_Q67_SECONDS,
  WM_Q8_SECONDS,
  type WritingMock,
} from "@/lib/skills/writing-mock";
import { Q67_FORM_CHECKS, computeQ67Score } from "@/lib/skills/writing-q6-7";
import { Q8_MIN_WORDS, wordCount } from "@/lib/skills/writing-q8";

type Stage = "intro" | "q15dir" | "q15" | "q67dir" | "q67" | "q8dir" | "q8" | "review";

type Q15Grade = { score: number; corrected: string; feedback: string; usedBothKeywords: boolean };
type Q8Grade = {
  rubric: number;
  criteria: { opinionSupported: number; grammar: number; vocabulary: number; organization: number };
  feedback: string;
  toImprove: string[];
  fixes: { original: string; corrected: string; why: string }[];
};

const mmss = (s: number) =>
  `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/**
 * Thi thử Writing trọn bộ 8 câu.
 *
 * Thi thử  — đồng hồ đếm ngược từng phần đúng nhịp ETS (8 / 10+10 / 30 phút),
 *            hết giờ tự sang phần sau, không quay lại phần trước.
 * Luyện tập — đồng hồ chỉ đếm lên, tự bấm chuyển, đi lại giữa các câu thoải mái.
 */
export function WritingMockClient({
  skill,
  unit,
  mock,
  mode,
  signedIn,
  canSubmit,
  backHref,
}: {
  skill: Skill;
  unit: SkillUnit;
  mock: WritingMock;
  mode: SpeakingMode;
  signedIn: boolean;
  canSubmit: boolean;
  backHref: string;
}) {
  const color = FAMILY[skill.family];
  const practice = mode === "practice";

  const [stage, setStage] = useState<Stage>("intro");
  const [idx, setIdx] = useState(0);
  const [q15, setQ15] = useState<string[]>(() => mock.q15.map(() => ""));
  const [q67, setQ67] = useState<string[]>(() => mock.q67.map(() => ""));
  const [q8, setQ8] = useState("");
  const [left, setLeft] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);

  const [q15Grades, setQ15Grades] = useState<(Q15Grade | null)[]>([]);
  const [q8Grade, setQ8Grade] = useState<Q8Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [missionMarks, setMissionMarks] = useState<boolean[][]>(() => mock.q67.map((p) => p.missions.map(() => false)));
  const [formMarks, setFormMarks] = useState<boolean[][]>(() => mock.q67.map(() => Q67_FORM_CHECKS.map(() => false)));

  // ── Chấm AI khi nộp ───────────────────────────────────────────────
  const gradeAll = useCallback(async (a15: string[], a8: string) => {
    setGrading(true);

    const g15 = await Promise.all(
      mock.q15.map(async (ex, i) => {
        const sentence = a15[i]?.trim();
        if (!sentence) return null;
        try {
          const res = await fetch("/api/skills/writing-assess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentence, keywords: ex.keywords, modelAnswers: ex.modelAnswers }),
          });
          if (!res.ok) return null;
          return (await res.json()) as Q15Grade;
        } catch {
          return null;
        }
      }),
    );
    setQ15Grades(g15);

    const essay = a8.trim();
    if (wordCount(essay) >= 20) {
      try {
        const res = await fetch("/api/skills/writing-q8-assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: mock.q8.question, essay }),
        });
        if (res.ok) setQ8Grade((await res.json()) as Q8Grade);
      } catch {
        setQ8Grade(null);
      }
    }
    setGrading(false);
  }, [mock]);

  const finish = useCallback(() => {
    setStage("review");
    setDeadlineAt(null);
    void gradeAll(q15, q8);
  }, [gradeAll, q15, q8]);

  /** Sang phần kế tiếp và đặt lại đồng hồ của phần đó. */
  const goStage = useCallback(
    (next: Stage, seconds?: number, at = 0) => {
      setIdx(at);
      setStage(next);
      if (!practice && seconds) {
        setDeadlineAt(Date.now() + seconds * 1000);
        setLeft(seconds);
      } else {
        setDeadlineAt(null);
        setLeft(0);
      }
    },
    [practice],
  );

  // ── Đồng hồ: hết giờ phần nào thì tự sang phần sau ────────────────
  // Chuyển ngay trong callback của interval, không tách ra effect riêng —
  // eslint của dự án cấm gọi setState thẳng trong thân effect.
  useEffect(() => {
    if (!deadlineAt) return;
    const t = setInterval(() => {
      const rest = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setLeft(rest);
      if (rest > 0) return;
      clearInterval(t);
      if (stage === "q15") goStage("q67dir");
      else if (stage === "q67") {
        if (idx === 0) goStage("q67", WM_Q67_SECONDS, 1);
        else goStage("q8dir");
      } else if (stage === "q8") finish();
    }, 500);
    return () => clearInterval(t);
  }, [deadlineAt, stage, idx, goStage, finish]);

  async function buildItems(): Promise<SubmissionItem[]> {
    const [a15, a67, a8] = [q15, q67, q8];
    const out: SubmissionItem[] = [];
    mock.q15.forEach((ex, i) => {
      out.push({ idx: out.length, prompt: `Question ${i + 1} — ${ex.keywords.join(" / ")}`, imageUrl: ex.imageUrl, text: a15[i] });
    });
    mock.q67.forEach((p, i) => {
      out.push({ idx: out.length, prompt: `Question ${6 + i} — ${p.email.subject}: ${p.directions}`, text: a67[i] });
    });
    out.push({ idx: out.length, prompt: `Question 8 — ${mock.q8.question}`, text: a8 });
    return out;
  }

  const timeLabel = deadlineAt ? mmss(left) : undefined;

  // Shell / PrimaryBtn / DirectionsBody nằm NGOÀI component (cuối file): định nghĩa
  // lồng bên trong sẽ tạo component mới mỗi lần render, làm ô nhập mất con trỏ khi gõ.
  const shellProps = {
    color,
    title: `${mock.label} · ${practice ? "Luyện tập" : "Thi thử"}`,
    timeLabel,
    lowTime: left <= 60,
    backHref,
  };

  // ══════════════════════════════════════
  // Các màn
  // ══════════════════════════════════════
  if (stage === "intro") {
    return (
      <Shell
        {...shellProps}
        label="Directions"
        footer={<PrimaryBtn color={color.primary} onClick={() => goStage("q15dir")}>Bắt đầu ▶</PrimaryBtn>}
      >
        <DirectionsBody
          text={WM_DIRECTIONS.test}
          extra={
            <div
              style={{
                marginTop: 14,
                border: `1px solid ${practice ? "#cfe0f5" : "#f0c9cf"}`,
                background: practice ? "#eff5fd" : "#fdf2f3",
                borderRadius: 8,
                padding: "10px 13px",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.6, color: EXAM.inkSoft }}>
                {practice ? (
                  <><strong>Chế độ Luyện tập:</strong> không giới hạn thời gian, tự bấm chuyển câu và đi lại thoải mái giữa các câu trong cùng một phần.</>
                ) : (
                  <><strong>Chế độ Thi thử:</strong> Q1-5 có 8 phút chung · Q6 và Q7 mỗi câu 10 phút · Q8 có 30 phút. Hết giờ phần nào là tự sang phần sau, không quay lại được.</>
                )}
              </p>
            </div>
          }
        />
      </Shell>
    );
  }

  if (stage === "q15dir") {
    return (
      <Shell {...shellProps} label="Questions 1-5" footer={<PrimaryBtn color={color.primary} onClick={() => goStage("q15", WM_Q15_SECONDS)}>Tiếp tục ▶</PrimaryBtn>}>
        <DirectionsBody text={WM_DIRECTIONS.q15} />
      </Shell>
    );
  }

  if (stage === "q15") {
    const ex = mock.q15[idx];
    const last = idx === mock.q15.length - 1;
    return (
      <Shell
        {...shellProps}
        label={`Question ${idx + 1} / 8`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              disabled={idx === 0}
              style={{ padding: "9px 15px", borderRadius: 7, border: "1px solid #b9c2cf", background: "#fff", color: "#3a4457", fontSize: "0.86rem", fontWeight: 700, cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.5 : 1, fontFamily: "inherit" }}
            >
              ← Back
            </button>
            <span style={{ fontSize: "0.78rem", color: EXAM.muted }}>
              {mock.q15.filter((_, i) => q15[i]?.trim()).length}/5 câu đã viết
            </span>
            <PrimaryBtn color={color.primary} onClick={() => (last ? goStage("q67dir") : setIdx((v) => v + 1))}>
              {last ? "Xong Q1-5 ▶" : "Next ▶"}
            </PrimaryBtn>
          </>
        }
      >
        <div style={{ padding: "16px 20px" }}>
          <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ex.imageUrl} alt={ex.imageAlt} style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 700, color: color.primary, textAlign: "center" }}>
            {ex.keywords[0]} , {ex.keywords[1]}
          </p>
          <textarea
            value={q15[idx] ?? ""}
            onChange={(e) => setQ15((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))}
            placeholder="(Type your sentence here.)"
            rows={3}
            spellCheck={false}
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "10px 12px", fontSize: "0.98rem", lineHeight: 1.7, fontFamily: EXAM.sans, color: EXAM.ink, background: "#fff", resize: "vertical" }}
          />
        </div>
      </Shell>
    );
  }

  if (stage === "q67dir") {
    return (
      <Shell {...shellProps} label="Questions 6-7" footer={<PrimaryBtn color={color.primary} onClick={() => goStage("q67", WM_Q67_SECONDS)}>Tiếp tục ▶</PrimaryBtn>}>
        <DirectionsBody text={WM_DIRECTIONS.q67} />
      </Shell>
    );
  }

  if (stage === "q67") {
    const p = mock.q67[idx];
    const last = idx === mock.q67.length - 1;
    const rows: [string, string | undefined][] = [
      ["FROM", p.email.from],
      ["TO", p.email.to],
      ["SUBJECT", p.email.subject],
      ["SENT", p.email.sent],
    ];
    return (
      <Shell
        {...shellProps}
        label={`Question ${6 + idx} / 8`}
        footer={
          <>
            <span style={{ fontSize: "0.78rem", color: EXAM.muted }}>
              {wordCount(q67[idx] ?? "")} từ
            </span>
            <PrimaryBtn
              color={color.primary}
              onClick={() => {
                if (last) goStage("q8dir");
                else goStage("q67", WM_Q67_SECONDS, idx + 1);
              }}
            >
              {last ? "Xong Q6-7 ▶" : "Next ▶"}
            </PrimaryBtn>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 1fr", minHeight: "56vh" }}>
          <div style={{ borderRight: `1px solid ${EXAM.border}`, padding: "14px 16px", overflowY: "auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: EXAM.muted, fontStyle: "italic" }}>Directions: Read the e-mail.</p>
            <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 8, overflow: "hidden", background: EXAM.panel, marginBottom: 12 }}>
              {rows.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, padding: "5px 12px", borderBottom: `1px solid ${EXAM.border}`, fontSize: "0.79rem" }}>
                  <span style={{ minWidth: 62, color: EXAM.muted, fontWeight: 600 }}>{k}:</span>
                  <span>{v}</span>
                </div>
              ))}
              <div style={{ padding: "10px 12px", background: "#fff" }}>
                {p.email.body.map((line, i) => (
                  <p key={i} style={{ margin: i === 0 ? 0 : "0.55rem 0 0", fontSize: "0.86rem", lineHeight: 1.7 }}>{line}</p>
                ))}
              </div>
            </div>
            <div style={{ background: color.primary, color: "#fff", borderRadius: 8, padding: "10px 12px", fontSize: "0.84rem", lineHeight: 1.6, fontWeight: 600 }}>
              Directions: {p.directions}
            </div>
          </div>

          <textarea
            value={q67[idx] ?? ""}
            onChange={(e) => setQ67((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))}
            placeholder="(Type your response here.)"
            spellCheck={false}
            style={{ border: "none", outline: "none", resize: "none", padding: "14px", fontSize: "0.96rem", lineHeight: 1.75, fontFamily: EXAM.sans, color: EXAM.ink, background: "#fff", minHeight: "56vh" }}
          />
        </div>
      </Shell>
    );
  }

  if (stage === "q8dir") {
    return (
      <Shell {...shellProps} label="Question 8" footer={<PrimaryBtn color={color.primary} onClick={() => goStage("q8", WM_Q8_SECONDS)}>Tiếp tục ▶</PrimaryBtn>}>
        <DirectionsBody text={WM_DIRECTIONS.q8} />
      </Shell>
    );
  }

  if (stage === "q8") {
    const words = wordCount(q8);
    return (
      <Shell
        {...shellProps}
        label="Question 8 / 8"
        footer={
          <>
            <span style={{ fontSize: "0.78rem", color: words >= Q8_MIN_WORDS ? "#16a34a" : EXAM.muted }}>
              Word count: <strong>{words}</strong> / {Q8_MIN_WORDS}
            </span>
            <PrimaryBtn color={color.primary} onClick={finish} disabled={words < 10}>Nộp bài & chấm ✓</PrimaryBtn>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 0.85fr) 1.15fr", minHeight: "56vh" }}>
          <div style={{ borderRight: `1px solid ${EXAM.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ background: color.primary, color: "#fff", padding: "12px 14px", fontSize: "0.86rem", fontWeight: 700, lineHeight: 1.55 }}>
              Directions: Read the question below. You have 30 minutes to plan, write, and revise your essay.
              Typically, an effective response will contain a minimum of 300 words.
            </div>
            <div style={{ padding: "14px", fontSize: "0.98rem", lineHeight: 1.75, overflowY: "auto" }}>{mock.q8.question}</div>
          </div>
          <textarea
            value={q8}
            onChange={(e) => setQ8(e.target.value)}
            placeholder="(Type your response here.)"
            spellCheck={false}
            style={{ border: "none", outline: "none", resize: "none", padding: "14px", fontSize: "0.98rem", lineHeight: 1.75, fontFamily: EXAM.sans, color: EXAM.ink, background: "#fff", minHeight: "56vh" }}
          />
        </div>
      </Shell>
    );
  }

  // ══════════════════════════════════════
  // Kết quả
  // ══════════════════════════════════════
  const q15Done = mock.q15.filter((_, i) => q15[i]?.trim()).length;
  const q15Avg = q15Grades.filter(Boolean).length
    ? Math.round(q15Grades.reduce((a, g) => a + (g?.score ?? 0), 0) / q15Grades.filter(Boolean).length)
    : null;

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-primary)", padding: "clamp(1.2rem, 4vw, 2.2rem) clamp(1rem, 5vw, 3rem)", maxWidth: 920, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 6px", textAlign: "center" }}>
        Writing · {mock.label} · {practice ? "Luyện tập" : "Thi thử"}
      </p>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", margin: "0 0 1.2rem" }}>Kết quả bài thi thử</h1>

      {grading && (
        <p style={{ textAlign: "center", fontSize: "0.86rem", color: "var(--text-muted)", margin: "0 0 1rem" }}>Đang chấm bằng AI…</p>
      )}

      {/* Q1-5 */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
        Questions 1-5 · {q15Done}/5 câu đã viết{q15Avg !== null ? ` · điểm TB ${q15Avg}/100` : ""}
      </h2>
      {mock.q15.map((ex, i) => {
        const g = q15Grades[i];
        return (
          <div key={ex.id} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px", marginBottom: 8, background: "var(--bg-secondary)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Question {i + 1} · {ex.keywords.join(" / ")}{g ? ` · ${g.score}/100` : ""}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.87rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
              {q15[i]?.trim() || <em style={{ color: "var(--text-muted)" }}>(bỏ trống)</em>}
            </p>
            {g && g.corrected && g.corrected !== q15[i]?.trim() && (
              <p style={{ margin: "3px 0 0", fontSize: "0.85rem", lineHeight: 1.6, color: "#16a34a" }}>→ {g.corrected}</p>
            )}
            {g?.feedback && <p style={{ margin: "3px 0 0", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{g.feedback}</p>}
          </div>
        );
      })}

      {/* Q6-7 */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "1.4rem 0 0.5rem" }}>
        Questions 6-7 · tự chấm bằng checklist
      </h2>
      {mock.q67.map((p, i) => {
        const score = computeQ67Score(missionMarks[i] ?? [], formMarks[i] ?? [], wordCount(q67[i] ?? "") >= 10);
        return (
          <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px", marginBottom: 8, background: "var(--bg-secondary)" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Question {6 + i} · {p.email.subject} · {wordCount(q67[i] ?? "")} từ · ETS {score.ets}/4
            </p>
            <p style={{ margin: "4px 0 8px", fontSize: "0.85rem", lineHeight: 1.65, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {q67[i]?.trim() || <em style={{ color: "var(--text-muted)" }}>(bỏ trống)</em>}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
              {p.missions.map((m, k) => {
                const on = missionMarks[i]?.[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      setMissionMarks((prev) => prev.map((row, ri) => (ri === i ? row.map((v, vi) => (vi === k ? !v : v)) : row)))
                    }
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, border: `1.5px solid ${on ? "rgba(22,163,74,.5)" : "var(--border)"}`, background: on ? "rgba(22,163,74,.08)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontSize: "0.82rem", color: "var(--text-primary)" }}
                  >
                    <span style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${on ? "#16a34a" : "var(--border)"}`, background: on ? "#16a34a" : "transparent", color: "#fff", fontSize: "0.66rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {on ? "✓" : ""}
                    </span>
                    {m}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Xưng hô", "Câu chào đầu", "Câu kết", "Chào cuối + ký tên"].map((short, k) => {
                const on = formMarks[i]?.[k];
                return (
                  <button
                    key={k}
                    type="button"
                    title={Q67_FORM_CHECKS[k]}
                    onClick={() =>
                      setFormMarks((prev) => prev.map((row, ri) => (ri === i ? row.map((v, vi) => (vi === k ? !v : v)) : row)))
                    }
                    style={{ padding: "3px 10px", fontSize: "0.75rem", fontWeight: 600, borderRadius: 999, border: `1.5px solid ${on ? "rgba(22,163,74,.5)" : "var(--border)"}`, background: on ? "rgba(22,163,74,.1)" : "transparent", color: on ? "#16a34a" : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {on ? "✓ " : ""}{short}
                  </button>
                );
              })}
            </div>
            {p.modelAnswer && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-primary)", cursor: "pointer" }}>Xem bài mẫu</summary>
                <div style={{ marginTop: 5 }}>
                  {p.modelAnswer.map((l, li) => (
                    <p key={li} style={{ margin: 0, fontSize: "0.83rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{l}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}

      {/* Q8 */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: "1.4rem 0 0.5rem" }}>
        Question 8 · {wordCount(q8)} từ{q8Grade ? ` · rubric ETS ${q8Grade.rubric}/5` : ""}
      </h2>
      <div style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px", marginBottom: 8, background: "var(--bg-secondary)" }}>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{mock.q8.question}</p>
        {q8Grade && (
          <>
            <p style={{ margin: "8px 0 0", fontSize: "0.86rem", lineHeight: 1.7, color: "var(--text-primary)" }}>{q8Grade.feedback}</p>
            {q8Grade.toImprove.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: "1.1rem" }}>
                {q8Grade.toImprove.map((t, i) => (
                  <li key={i} style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{t}</li>
                ))}
              </ul>
            )}
            {q8Grade.fixes.map((f, i) => (
              <div key={i} style={{ marginTop: 6, fontSize: "0.82rem", lineHeight: 1.6 }}>
                <span style={{ color: "#dc2626", textDecoration: "line-through" }}>{f.original}</span>
                <br />
                <span style={{ color: "#16a34a", fontWeight: 600 }}>{f.corrected}</span>
                {f.why && <span style={{ color: "var(--text-muted)" }}> — {f.why}</span>}
              </div>
            ))}
          </>
        )}
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-primary)", cursor: "pointer" }}>Xem lại bài luận của bạn</summary>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", lineHeight: 1.75, color: "var(--text-primary)", marginTop: 5 }}>{q8}</div>
        </details>
      </div>

      {signedIn && (
        <div style={{ margin: "1.2rem 0" }}>
          <SubmissionPanel
            variant="exam"
            skill={skill.slug}
            unit="mock"
            testKey={mock.slug}
            title={`Writing · ${mock.label}`}
            canSubmit={canSubmit}
            buildItems={buildItems}
          />
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <Link href={backHref} style={{ display: "inline-block", padding: "9px 22px", background: color.primary, color: "#fff", borderRadius: 8, fontSize: "0.86rem", fontWeight: 700, textDecoration: "none" }}>
          Chọn đề khác →
        </Link>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", margin: "0.8rem 0 0" }}>
        {unit.labelVi}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Khung màn hình — để ở ngoài component chính cho ổn định danh tính
// ─────────────────────────────────────────────────────────────────────

function Shell({
  color,
  title,
  label,
  timeLabel,
  lowTime,
  backHref,
  children,
  footer,
}: {
  color: { primary: string; dark: string };
  title: string;
  label: string;
  timeLabel?: string;
  lowTime: boolean;
  backHref: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: EXAM.sans, maxWidth: 1100, margin: "0 auto", padding: "clamp(0.8rem, 2vw, 1.4rem) clamp(0.6rem, 3vw, 1.5rem)" }}>
      <div style={{ border: `1px solid ${EXAM.border}`, borderRadius: 12, overflow: "hidden", background: EXAM.bg, color: EXAM.ink, boxShadow: "0 18px 40px -24px rgba(20,40,90,.4)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 16px", color: "#fff", background: `linear-gradient(180deg, ${color.primary}, ${color.dark})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: "1.05rem", minWidth: 0 }}>
            <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>✳</span>
            <span>TOEIC</span>
            <span style={{ fontWeight: 600, opacity: 0.85, fontSize: "0.82rem", borderLeft: "1px solid rgba(255,255,255,.35)", paddingLeft: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.9rem", flexShrink: 0 }}>
            <span style={{ opacity: 0.9, whiteSpace: "nowrap" }}>{label}</span>
            {timeLabel && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: lowTime ? "rgba(255,120,120,.35)" : "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 7, padding: "4px 10px", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                ⏱ {timeLabel}
              </span>
            )}
          </div>
        </div>

        <div style={{ background: EXAM.bg }}>{children}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: EXAM.panelAlt, borderTop: `1px solid ${EXAM.border}`, flexWrap: "wrap" }}>
          <Link href={backHref} style={{ fontSize: "0.82rem", color: EXAM.muted, textDecoration: "none" }}>← Thoát</Link>
          {footer}
        </div>
      </div>
    </div>
  );
}

function PrimaryBtn({
  color,
  children,
  onClick,
  disabled,
}: {
  color: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        marginLeft: "auto",
        padding: "9px 24px",
        borderRadius: 7,
        border: `1px solid ${color}`,
        background: disabled ? "#9aa6bd" : color,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.86rem",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function DirectionsBody({ text, extra }: { text: string; extra?: React.ReactNode }) {
  return (
    <div style={{ padding: "18px 20px" }}>
      <div style={{ background: EXAM.panel, border: `1px solid ${EXAM.border}`, borderRadius: 8, padding: "16px 18px" }}>
        <p style={{ fontSize: "0.97rem", color: EXAM.ink, lineHeight: 1.7, margin: 0 }}>{text}</p>
      </div>
      {extra}
    </div>
  );
}
