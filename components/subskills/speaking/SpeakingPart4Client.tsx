"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type Part4Test,
  type Part4Exercise,
  type Part4Difficulty,
  type Part4Level,
  checkPart4Answer,
  dbPart4,
  PART4_PASS_THRESHOLD,
} from "@/lib/subskills/speaking-part4";
import { RecordingPanel } from "@/components/subskills/speaking/RecordingPanel";

type Phase = "intro" | "quiz" | "done";
type BestMap = Record<string, { score: number; passed: boolean }>;

const DIFF_LABEL: Record<Part4Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_LEVEL: Record<Part4Difficulty, Part4Level> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const DIFF_HINT: Record<Part4Difficulty, string> = {
  easy: "Nhận diện — chọn cách đọc đúng cho từng con số trên bảng.",
  medium: "Viết ra — gõ lại con số bằng chữ trong câu trả lời hoàn chỉnh.",
  hard: "Nói — nghe câu hỏi thật của đề rồi trả lời thành tiếng, có chấm phát âm.",
};

interface Props {
  skillId: string;
  tests: Part4Test[];
  easyBest: BestMap;
  mediumBest: BestMap;
  hardBest: BestMap;
  userId: string | null;
}

export default function SpeakingPart4Client({ skillId, tests, easyBest, mediumBest, hardBest, userId }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [difficulty, setDifficulty] = useState<Part4Difficulty>("easy");
  const [testNum, setTestNum] = useState(1);
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrect] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [essayInput, setEssayInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [showTable, setShowTable] = useState(true);

  const bestMap = difficulty === "easy" ? easyBest : difficulty === "medium" ? mediumBest : hardBest;

  const test = tests.find((t) => t.testNum === testNum) ?? tests[0];
  const exercises: Part4Exercise[] = test.levels.find((l) => l.level === DIFF_LEVEL[difficulty])?.exercises ?? [];
  const total = exercises.length;
  const ex = exercises[idx] ?? null;

  function saveProgress(newCorrect: number) {
    if (!userId || total === 0) return;
    const score = Math.round((newCorrect / total) * 100);
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: dbPart4(skillId, difficulty),
        questionWord: String(testNum),
        exerciseIndex: 0,
        score,
        passed: score >= PART4_PASS_THRESHOLD,
      }),
    }).catch(() => {});
  }

  function startTest(tNum: number, diff: Part4Difficulty) {
    setTestNum(tNum);
    setDifficulty(diff);
    setIdx(0);
    setCorrect(0);
    setSubmitted(false);
    setSelectedOption(null);
    setEssayInput("");
    setIsCorrect(false);
    setShowTable(true);
    setPhase("quiz");
  }

  function handleCheck() {
    if (submitted || !ex) return;
    const input = ex.type === "multiple_choice" ? (selectedOption ?? "") : essayInput;
    const correct = checkPart4Answer(ex, input);
    const newCorrect = correct ? correctCount + 1 : correctCount;
    setCorrect(newCorrect);
    setIsCorrect(correct);
    setSubmitted(true);
    saveProgress(newCorrect);
  }

  function handleNext() {
    if (idx + 1 >= total) {
      setPhase("done");
      return;
    }
    setIdx(idx + 1);
    setSubmitted(false);
    setSelectedOption(null);
    setEssayInput("");
    setIsCorrect(false);
  }

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem" }}>
          {(["easy", "medium", "hard"] as Part4Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "1.5px solid",
                borderColor: difficulty === d ? "var(--accent-primary)" : "var(--border)",
                background: difficulty === d ? "rgba(59,130,246,0.1)" : "var(--bg-elevated)",
                color: difficulty === d ? "var(--accent-primary)" : "var(--text-muted)",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {DIFF_HINT[difficulty]}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
          {tests.map((t, i) => {
            const best = bestMap[String(t.testNum)];
            const passed = best?.passed ?? false;
            return (
              <button
                key={t.testNum}
                onClick={() => startTest(t.testNum, difficulty)}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem", textAlign: "left",
                  padding: "0.9rem 1.1rem", border: "none", cursor: "pointer",
                  background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
                  borderBottom: i < tests.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ width: 76, height: 48, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#fff", border: "1px solid var(--border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Bộ {t.testNum}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.35 }}>{t.title}</div>
                  {best && (
                    <div style={{ fontSize: "0.7rem", color: passed ? "rgb(34,197,94)" : "var(--text-muted)", marginTop: 2 }}>
                      Điểm tốt nhất: {best.score}%{passed ? " ✓" : ""}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)", flexShrink: 0 }}>→</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = score >= PART4_PASS_THRESHOLD;
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: "2.4rem", marginBottom: "0.5rem" }}>{passed ? "🎉" : "💪"}</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.35rem" }}>
          {difficulty === "hard" ? "Xong phần luyện nói" : passed ? "Đạt rồi!" : "Làm lại nhé"}
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 1.5rem" }}>
          {difficulty === "hard"
            ? `Bạn đã luyện ${total} câu nói với bảng “${test.title}”. Điểm phát âm nằm ở từng bảng ghi âm phía trên.`
            : `${correctCount}/${total} câu đúng · ${score}%`}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => startTest(testNum, difficulty)}
            style={{ padding: "0.6rem 1.3rem", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Làm lại bộ này
          </button>
          <button
            onClick={() => setPhase("intro")}
            style={{ padding: "0.6rem 1.3rem", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Chọn bộ khác
          </button>
        </div>

        <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Thử sức với đề đầy đủ dùng đúng bảng này:{" "}
          <Link href={`/skills/speaking/q8-10/${test.sourceSlug}`} style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
            làm đề Q8-10 →
          </Link>
        </p>
      </div>
    );
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  if (!ex) return null;

  const canCheck = ex.type === "multiple_choice" ? selectedOption !== null : ex.type === "speak_aloud" ? true : essayInput.trim().length > 0;
  const correctText =
    ex.type === "multiple_choice"
      ? ex.options.find((o) => ex.correct_answers.includes(o.id))?.text ?? ""
      : ex.correct_answers[0] ?? "";

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Bộ {testNum} · {DIFF_LABEL[difficulty]}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{idx + 1} / {total}</span>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 999 }}>
          <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
            {difficulty === "hard" ? `${correctCount} câu đã luyện` : `${correctCount} đúng`}
          </span>
          <button onClick={() => setPhase("intro")} style={{ fontSize: "0.65rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            ← Thoát
          </button>
        </div>
      </div>

      {/* Bảng thông tin — luôn ở trên đầu, thu gọn được */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "1rem" }}>
        <button
          onClick={() => setShowTable((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0.6rem 0.9rem", background: "var(--bg-elevated)", border: "none", borderBottom: showTable ? "1px solid var(--border)" : "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary)" }}>📋 {test.title}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{showTable ? "Thu gọn ▲" : "Mở bảng ▼"}</span>
        </button>
        {showTable && (
          <div style={{ background: "#fff", display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={test.imageUrl} alt={test.title} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
          </div>
        )}
      </div>

      {/* Bài tập */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.3rem 1.5rem", marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 1rem", fontSize: "1.02rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.55 }}>
          {ex.instruction}
        </p>

        {/* Audio câu hỏi thật của đề */}
        {ex.audio_url && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>Câu hỏi trong đề</div>
            <audio controls src={ex.audio_url} style={{ width: "100%" }} />
          </div>
        )}

        {ex.type === "multiple_choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ex.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectOpt = ex.correct_answers.includes(opt.id);
              let bg = "var(--bg-elevated)";
              let borderColor = "var(--border)";
              let textColor = "var(--text-primary)";
              if (submitted) {
                if (isCorrectOpt) { bg = "rgba(34,197,94,0.12)"; borderColor = "rgba(34,197,94,0.5)"; textColor = "rgb(34,197,94)"; }
                else if (isSelected) { bg = "rgba(239,68,68,0.1)"; borderColor = "rgba(239,68,68,0.4)"; textColor = "rgb(239,68,68)"; }
              } else if (isSelected) {
                bg = "rgba(59,130,246,0.1)"; borderColor = "var(--accent-primary)"; textColor = "var(--accent-primary)";
              }
              return (
                <button
                  key={opt.id}
                  disabled={submitted}
                  onClick={() => setSelectedOption(opt.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.75rem",
                    padding: "0.8rem 1.05rem", borderRadius: 8,
                    border: `1.5px solid ${borderColor}`, background: bg, color: textColor,
                    fontSize: "0.96rem", textAlign: "left", cursor: submitted ? "default" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontWeight: 700, flexShrink: 0, minWidth: 20 }}>{opt.id}.</span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {ex.type === "essay_typing" && (
          <div>
            {ex.content && (
              <div style={{ marginBottom: "0.8rem", padding: "0.8rem 1.05rem", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.65 }}>
                {ex.content}
              </div>
            )}
            <input
              type="text"
              value={essayInput}
              onChange={(e) => setEssayInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !submitted && canCheck) handleCheck(); }}
              disabled={submitted}
              placeholder="Điền câu trả lời…"
              style={{
                width: "100%", padding: "0.72rem 1rem", borderRadius: 8,
                border: submitted ? `1.5px solid ${isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.4)"}` : "1.5px solid var(--border)",
                background: submitted ? (isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)") : "var(--bg-primary)",
                color: "var(--text-primary)", fontSize: "1rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {ex.type === "speak_aloud" && !submitted && (
          <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.6, padding: "0.8rem 1rem", background: "var(--bg-elevated)", border: "1px dashed var(--border)", borderRadius: 8 }}>
            Nói câu trả lời của bạn thành tiếng trước đã — đừng đọc câu mẫu ngay. Xong rồi bấm <strong>Xem câu mẫu</strong> để đối chiếu và ghi âm luyện lại.
          </p>
        )}

        {/* Kết quả / câu mẫu */}
        {submitted && (
          <div style={{ marginTop: "0.85rem", padding: "0.85rem 1.1rem", borderRadius: 8, background: ex.type === "speak_aloud" ? "rgba(59,130,246,0.08)" : isCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.06)", border: `1px solid ${ex.type === "speak_aloud" ? "rgba(59,130,246,0.25)" : isCorrect ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}` }}>
            {ex.type === "speak_aloud" ? (
              <>
                <div style={{ fontWeight: 700, color: "var(--accent-primary)", marginBottom: 5, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Câu mẫu</div>
                <div style={{ fontSize: "1.02rem", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 8 }}>{ex.reference_text}</div>
              </>
            ) : (
              <div style={{ fontWeight: 700, color: isCorrect ? "rgb(34,197,94)" : "rgb(239,68,68)", marginBottom: 5, fontSize: "0.95rem" }}>
                {isCorrect ? "✓ Chính xác!" : `✗ Sai — Đáp án đúng: ${correctText}`}
              </div>
            )}
            <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{ex.explanation}</div>
          </div>
        )}
      </div>

      {/* Ghi âm — chấm phát âm trên chính câu mẫu */}
      {submitted && userId && (ex.reference_text || ex.type !== "speak_aloud") && (
        <div style={{ marginBottom: "1rem" }}>
          <RecordingPanel
            key={`${testNum}-${difficulty}-${idx}`}
            referenceText={ex.reference_text ?? correctText}
            skillId={`p4-${skillId}`}
            testNum={testNum}
            exerciseIndex={idx}
            userId={userId}
          />
        </div>
      )}

      {/* Nút hành động */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        {!submitted ? (
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            style={{
              padding: "0.65rem 1.6rem", borderRadius: 8, border: "none",
              background: canCheck ? "var(--accent-primary)" : "var(--bg-elevated)",
              color: canCheck ? "#fff" : "var(--text-muted)",
              fontSize: "0.88rem", fontWeight: 700, cursor: canCheck ? "pointer" : "not-allowed", fontFamily: "inherit",
            }}
          >
            {ex.type === "speak_aloud" ? "Xem câu mẫu" : "Kiểm tra"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{ padding: "0.65rem 1.6rem", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            {idx + 1 >= total ? "Hoàn thành" : "Câu tiếp →"}
          </button>
        )}
      </div>
    </div>
  );
}
