"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DEEP_STEPS, type Passage } from "@/lib/subskills/part3/passages";
import { loadDeepProgress, saveDeepProgress } from "@/lib/subskills/part3/deep-progress";

type Props = { passage: Passage };

/** Số lượt nghe kèm chữ mà bước đọc theo hướng tới */
const SHADOW_TARGET = 10;

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";

export default function DeepListenClient({ passage }: Props) {
  const [step, setStep] = useState(0);
  const [plays, setPlays] = useState(0);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [choices, setChoices] = useState<(string | null)[]>([null, null, null]);
  const [quizLocked, setQuizLocked] = useState(false);
  const [rate, setRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Khôi phục tiến độ đã lưu trên máy
  useEffect(() => {
    const s = loadDeepProgress(passage.groupId);
    setStep(s.step);
    setPlays(s.plays);
    setQuizScore(s.quizScore);
    setDoneAt(s.doneAt);
    if (s.quizScore !== null) setQuizLocked(true);
    setHydrated(true);
  }, [passage.groupId]);

  // Ghi lại sau mỗi thay đổi — bỏ qua lần chạy đầu kẻo ghi đè bằng giá trị rỗng
  useEffect(() => {
    if (!hydrated) return;
    saveDeepProgress(passage.groupId, { step, plays, quizScore, doneAt });
  }, [hydrated, passage.groupId, step, plays, quizScore, doneAt]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
  }, [rate]);

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = rate;
    el.currentTime = 0;
    void el.play();
    setPlays((p) => p + 1);
  }, [rate]);

  const showTranscript = step === 1 || step === 2;
  const stepMeta = DEEP_STEPS[step];

  function submitQuiz() {
    const correct = passage.questions.filter((q, i) => choices[i] === q.answer).length;
    setQuizScore(correct);
    setQuizLocked(true);
  }

  function markDone() {
    setDoneAt(new Date().toISOString());
    setStep(4);
  }

  function reset() {
    setStep(0);
    setPlays(0);
    setQuizScore(null);
    setDoneAt(null);
    setChoices([null, null, null]);
    setQuizLocked(false);
  }

  return (
    <div>
      {/* Các bước */}
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {DEEP_STEPS.map((s, i) => {
          const active = i === step;
          const passedStep = i < step || !!doneAt;
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.72rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                border: `1px solid ${active ? "var(--accent-primary)" : passedStep ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
                background: active ? "var(--accent-primary)" : passedStep ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
                color: active ? "#fff" : passedStep ? GREEN : "var(--text-muted)",
              }}
            >
              {i + 1}. {s.title}
            </button>
          );
        })}
      </div>

      <p
        style={{
          margin: "0 0 1.25rem",
          padding: "0.7rem 0.95rem",
          borderRadius: "var(--radius-md, 8px)",
          border: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          fontSize: "0.82rem",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {stepMeta.hint}
      </p>

      {/* Trình phát dùng chung cho mọi bước */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          background: "var(--bg-elevated)",
          padding: "0.9rem 1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", flexWrap: "wrap" }}>
          <button
            onClick={play}
            style={{
              padding: "0.5rem 1.2rem",
              borderRadius: 8,
              border: "1px solid var(--accent-primary)",
              background: "var(--accent-primary)",
              color: "#fff",
              fontSize: "0.83rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ▶ Nghe
          </button>

          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[0.75, 1, 1.25].map((r) => (
              <button
                key={r}
                onClick={() => setRate(r)}
                style={{
                  padding: "0.35rem 0.6rem",
                  borderRadius: 6,
                  fontSize: "0.7rem",
                  fontWeight: rate === r ? 700 : 500,
                  cursor: "pointer",
                  border: `1px solid ${rate === r ? "var(--accent-primary)" : "var(--border)"}`,
                  background: rate === r ? "var(--bg-secondary)" : "var(--bg-primary)",
                  color: rate === r ? "var(--accent-primary)" : "var(--text-muted)",
                }}
              >
                {r}×
              </button>
            ))}
          </div>

          <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
            Đã nghe {plays} lượt
          </span>
        </div>

        {/* Tiến độ đọc theo — chỉ có nghĩa ở bước 3 */}
        {step === 2 && (
          <div style={{ marginTop: "0.7rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
              <span>Mục tiêu {SHADOW_TARGET} lượt nghe kèm chữ</span>
              <span>{Math.min(plays, SHADOW_TARGET)}/{SHADOW_TARGET}</span>
            </div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (plays / SHADOW_TARGET) * 100)}%`,
                  background: plays >= SHADOW_TARGET ? GREEN : "var(--accent-primary)",
                  borderRadius: 999,
                  transition: "width 0.25s",
                }}
              />
            </div>
          </div>
        )}

        <audio ref={audioRef} src={passage.audioUrl} preload="none" style={{ display: "none" }} />
      </div>

      {passage.image && (
        // Ảnh bảng biểu do Supabase phục vụ, không qua next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={passage.image}
          alt="Bảng biểu đi kèm đoạn nghe"
          style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid var(--border)", marginBottom: "1.25rem" }}
        />
      )}

      {/* ── Bước 1: làm 3 câu hỏi ─────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {passage.questions.map((q, qi) => (
            <div key={q.number} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "1rem 1.1rem", background: "var(--bg-primary)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {q.number}. {q.prompt}
                </span>
                {quizLocked && (
                  <span style={{ fontSize: "0.63rem", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>
                    {q.labelVi}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {Object.entries(q.options).map(([key, text]) => {
                  const chosen = choices[qi] === key;
                  const right = quizLocked && key === q.answer;
                  const wrong = quizLocked && chosen && key !== q.answer;
                  return (
                    <button
                      key={key}
                      disabled={quizLocked}
                      onClick={() => setChoices((c) => c.map((v, i) => (i === qi ? key : v)))}
                      style={{
                        display: "flex",
                        gap: "0.6rem",
                        textAlign: "left",
                        padding: "0.6rem 0.8rem",
                        borderRadius: 8,
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                        cursor: quizLocked ? "default" : "pointer",
                        color: "var(--text-primary)",
                        border: `1.5px solid ${right ? "rgba(34,197,94,0.6)" : wrong ? "rgba(239,68,68,0.5)" : chosen ? "var(--accent-primary)" : "var(--border)"}`,
                        background: right ? "rgba(34,197,94,0.1)" : wrong ? "rgba(239,68,68,0.08)" : chosen ? "var(--bg-elevated)" : "var(--bg-primary)",
                      }}
                    >
                      <span style={{ fontWeight: 800, color: right ? GREEN : wrong ? RED : "var(--text-muted)" }}>{key}</span>
                      <span>{text}</span>
                    </button>
                  );
                })}
              </div>

              {quizLocked && q.reasoning && (
                <p style={{ margin: "0.7rem 0 0", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {q.reasoning}
                </p>
              )}
            </div>
          ))}

          {!quizLocked ? (
            <button
              onClick={submitQuiz}
              disabled={choices.some((c) => c === null)}
              style={{
                alignSelf: "flex-end",
                padding: "0.6rem 1.5rem",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: choices.some((c) => c === null) ? "not-allowed" : "pointer",
                border: "1px solid var(--accent-primary)",
                background: choices.some((c) => c === null) ? "var(--bg-secondary)" : "var(--accent-primary)",
                color: choices.some((c) => c === null) ? "var(--text-muted)" : "#fff",
              }}
            >
              Chấm 3 câu
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: quizScore === 3 ? GREEN : "var(--text-primary)" }}>
                Đúng {quizScore}/3
              </span>
              <button
                onClick={() => setStep(1)}
                style={{ padding: "0.6rem 1.4rem", borderRadius: 8, border: "1px solid var(--accent-primary)", background: "var(--accent-primary)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
              >
                Sang bước 2 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bước 2 và 3: transcript ───────────────────────────────────── */}
      {showTranscript && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", overflow: "hidden" }}>
            {passage.lines.map((line, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.7rem",
                  padding: "0.7rem 0.95rem",
                  background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                  borderBottom: i < passage.lines.length - 1 ? "1px solid var(--border)" : "none",
                  fontSize: "0.87rem",
                  lineHeight: 1.65,
                  color: "var(--text-primary)",
                }}
              >
                <span style={{ flexShrink: 0, width: 22, fontWeight: 800, fontSize: "0.7rem", color: "var(--text-muted)", paddingTop: 2 }}>
                  {line.speaker ?? i + 1}
                </span>
                <span>{line.text}</span>
              </div>
            ))}
          </div>

          {step === 1 && passage.keywords.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 0.6rem", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Từ mới
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {passage.keywords.map((k) => (
                  <div
                    key={k.term}
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      padding: "0.55rem 0.8rem",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg-elevated)",
                      fontSize: "0.83rem",
                    }}
                  >
                    <strong style={{ color: "var(--text-primary)" }}>{k.term}</strong>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>{k.ipa}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontStyle: "italic" }}>{k.pos}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{k.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
            <button
              onClick={() => setStep(step + 1)}
              style={{ padding: "0.6rem 1.4rem", borderRadius: 8, border: "1px solid var(--accent-primary)", background: "var(--accent-primary)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Sang bước {step + 2} →
            </button>
          </div>
        </div>
      )}

      {/* ── Bước 4: nghe chay ─────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ textAlign: "center", padding: "1.5rem 1rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg, 12px)", background: "var(--bg-secondary)" }}>
          <p style={{ margin: "0 0 1.1rem", fontSize: "0.87rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Nghe lại không nhìn chữ. Hiểu trọn đoạn chưa?
          </p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setStep(2)}
              style={{ padding: "0.6rem 1.3rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Chưa — quay lại bước 3
            </button>
            <button
              onClick={markDone}
              style={{ padding: "0.6rem 1.3rem", borderRadius: 8, border: `1px solid ${GREEN}`, background: GREEN, color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Hiểu hết rồi →
            </button>
          </div>
        </div>
      )}

      {/* ── Bước 5: xong ──────────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              background: "rgba(34,197,94,0.15)",
              border: `2px solid rgba(34,197,94,0.5)`,
              color: GREEN,
            }}
          >
            ✓
          </div>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Xong đoạn này
          </h2>
          <p style={{ margin: "0 0 1.4rem", fontSize: "0.83rem", color: "var(--text-secondary)" }}>
            Làm đúng {quizScore ?? "–"}/3 khi chưa xem transcript · đã nghe {plays} lượt
          </p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ padding: "0.6rem 1.3rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Làm lại từ đầu
            </button>
            <Link
              href="/subskills/listening/part3/nghe-sau"
              style={{ padding: "0.6rem 1.3rem", borderRadius: 8, border: "1px solid var(--accent-primary)", background: "var(--accent-primary)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
            >
              Chọn đoạn khác
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
