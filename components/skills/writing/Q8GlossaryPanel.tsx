"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Q8_GLOSSARY,
  Q8_GLOSSARY_DRILL_SIZE,
  Q8_GLOSSARY_PART_KEY,
  type Q8GlossaryItem,
} from "@/lib/skills/writing-q8-glossary";

type Tab = "list" | "drill";

/** Một câu hỏi: hiện nghĩa tiếng Việt, hoặc hiện câu ví dụ bị khoét chỗ trống. */
interface Question {
  kind: "meaning" | "cloze";
  /** Cụm đúng */
  answer: string;
  /** Đề bài đã dựng sẵn */
  stem: string;
  choices: string[];
}

const ACCENT = "#4f46e5";
const GREEN = "#16a34a";
const RED = "#dc2626";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Khoét cụm khỏi câu ví dụ, giữ nguyên phần còn lại. */
function blank(example: string, phrase: string): string {
  const at = example.toLowerCase().indexOf(phrase.toLowerCase());
  if (at < 0) return example;
  return `${example.slice(0, at)}______${example.slice(at + phrase.length)}`;
}

function buildQuestions(items: Q8GlossaryItem[]): Question[] {
  return shuffle(items)
    .slice(0, Q8_GLOSSARY_DRILL_SIZE)
    .map((it, i) => {
      const distractors = shuffle(items.filter((x) => x.en !== it.en)).slice(0, 3).map((x) => x.en);
      // Xen kẽ hai dạng để một lượt luyện vừa nhớ nghĩa vừa nhớ cách dùng
      const kind: Question["kind"] = i % 2 === 0 ? "meaning" : "cloze";
      return {
        kind,
        answer: it.en,
        stem: kind === "meaning" ? it.vi : blank(it.example, it.en),
        choices: shuffle([it.en, ...distractors]),
      };
    });
}

/**
 * Từ vựng của một đề Q8: tab tra cứu + tab luyện ghi nhớ có chấm điểm.
 * Chỉ hiện ở chế độ Luyện tập — màn Thi thử không được có gì để tra.
 */
export function Q8GlossaryPanel({
  promptId,
  userId,
  isTestUser,
  best,
}: {
  promptId: string;
  userId: string | null;
  isTestUser: boolean;
  /** Điểm cao nhất đã đạt ở bài tập từ vựng của đề này */
  best?: { score: number; passed: boolean };
}) {
  // useMemo để danh sách giữ nguyên danh tính giữa các lần render,
  // nếu không `startDrill` sẽ được tạo lại mỗi render.
  const items = useMemo(() => Q8_GLOSSARY[promptId] ?? [], [promptId]);

  const [tab, setTab] = useState<Tab>("list");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState(false);
  const [bestScore, setBestScore] = useState(best?.score ?? null);

  const startDrill = useCallback(() => {
    setQuestions(buildQuestions(items));
    setQIdx(0);
    setPicked(null);
    setCorrect(0);
    setSaved(false);
    setTab("drill");
  }, [items]);

  const saveScore = useCallback(
    (score: number) => {
      if (bestScore === null || score > bestScore) setBestScore(score);
      if (!userId || isTestUser) {
        setSaved(true);
        return;
      }
      fetch("/api/subskills/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part: Q8_GLOSSARY_PART_KEY,
          questionWord: promptId,
          exerciseIndex: 0,
          score,
          passed: score >= 75,
          itemIdx: null,
        }),
      }).catch(() => {});
      setSaved(true);
    },
    [userId, isTestUser, promptId, bestScore],
  );

  if (items.length === 0) return null;

  const done = questions !== null && qIdx >= questions.length;
  const q = questions && !done ? questions[qIdx] : null;

  function pick(choice: string) {
    if (picked || !q) return;
    setPicked(choice);
    if (choice === q.answer) setCorrect((c) => c + 1);
  }

  function next() {
    if (!questions) return;
    const at = qIdx + 1;
    setPicked(null);
    setQIdx(at);
    if (at >= questions.length) {
      saveScore(Math.round((correct / questions.length) * 100));
    }
  }

  return (
    <section
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "0 clamp(0.6rem, 3vw, 1.5rem) 1.4rem",
      }}
    >
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-secondary)", overflow: "hidden" }}>
        {/* Đầu section */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "1.05rem" }} aria-hidden="true">📚</span>
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Từ vựng cho đề này
            <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> · {items.length} cụm</span>
          </span>
          {bestScore !== null && (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: bestScore >= 75 ? GREEN : "#ca8a04" }}>
              điểm cao nhất {bestScore}/100
            </span>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <TabBtn on={tab === "list"} onClick={() => setTab("list")}>Danh sách</TabBtn>
            <TabBtn on={tab === "drill"} onClick={() => (questions ? setTab("drill") : startDrill())}>
              Luyện ghi nhớ
            </TabBtn>
          </div>
        </div>

        {tab === "list" ? (
          <div style={{ padding: "0.5rem 1rem 1rem" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0.5rem 0 0.8rem" }}>
              Đây là những cụm dùng được thẳng vào bài luận của đề này. Học thuộc vài cụm rồi
              chèn vào bài thì điểm từ vựng lên nhanh hơn là cố nhớ từ đơn lẻ.
            </p>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              {items.map((it) => (
                <div key={it.en} style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${ACCENT}`, borderRadius: 8, padding: "0.6rem 0.8rem", background: "var(--bg-primary)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.92rem", color: "var(--text-primary)" }}>{it.en}</strong>
                    <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>— {it.vi}</span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: "0.82rem", lineHeight: 1.6, color: "var(--text-muted)", fontStyle: "italic" }}>
                    {it.example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: "1rem" }}>
            {q ? (
              <>
                <p style={{ margin: "0 0 0.6rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Câu {qIdx + 1}/{questions!.length} · đúng {correct}
                  <span style={{ marginLeft: 8, color: "var(--text-secondary)" }}>
                    {q.kind === "meaning" ? "Chọn cụm đúng với nghĩa" : "Điền cụm vào chỗ trống"}
                  </span>
                </p>

                <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.8rem 1rem", background: "var(--bg-primary)", marginBottom: "0.8rem" }}>
                  <p style={{ margin: 0, fontSize: "0.98rem", lineHeight: 1.7, color: "var(--text-primary)" }}>{q.stem}</p>
                </div>

                <div style={{ display: "grid", gap: "0.45rem" }}>
                  {q.choices.map((c) => {
                    const isAnswer = c === q.answer;
                    const chosen = picked === c;
                    const border = !picked
                      ? "var(--border)"
                      : isAnswer
                      ? GREEN
                      : chosen
                      ? RED
                      : "var(--border)";
                    const bg = !picked ? "var(--bg-primary)" : isAnswer ? "rgba(22,163,74,0.08)" : chosen ? "rgba(220,38,38,0.08)" : "var(--bg-primary)";
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => pick(c)}
                        disabled={Boolean(picked)}
                        style={{
                          textAlign: "left",
                          padding: "0.6rem 0.8rem",
                          borderRadius: 8,
                          border: `1.5px solid ${border}`,
                          background: bg,
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          cursor: picked ? "default" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {picked && isAnswer ? "✓ " : picked && chosen ? "✗ " : ""}
                        {c}
                      </button>
                    );
                  })}
                </div>

                {picked && (
                  <div style={{ marginTop: "0.8rem", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Hiện trọn thẻ từ: đề bài chỉ cho một nửa, nửa còn lại mới là thứ cần nhớ */}
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", flex: 1, minWidth: 240, lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--text-primary)" }}>{q.answer}</strong>
                      {" — "}
                      {items.find((it) => it.en === q.answer)?.vi}
                      <br />
                      <em style={{ color: "var(--text-muted)" }}>
                        {items.find((it) => it.en === q.answer)?.example}
                      </em>
                    </span>
                    <button
                      type="button"
                      onClick={next}
                      style={{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {qIdx + 1 >= questions!.length ? "Xem kết quả →" : "Câu tiếp →"}
                    </button>
                  </div>
                )}
              </>
            ) : done ? (
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <p style={{ margin: "0 0 4px", fontSize: "1.6rem", fontWeight: 800, color: correct >= questions!.length * 0.75 ? GREEN : "#ca8a04" }}>
                  {correct}/{questions!.length}
                </p>
                <p style={{ margin: "0 0 0.9rem", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  {saved ? "Đã lưu tiến độ." : "Đang lưu…"} Làm lại để đảo câu hỏi và đổi phương án nhiễu.
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={startDrill}
                    style={{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Luyện lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("list")}
                    style={{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Xem lại danh sách
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <button
                  type="button"
                  onClick={startDrill}
                  style={{ padding: "0.6rem 1.4rem", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Bắt đầu luyện {Q8_GLOSSARY_DRILL_SIZE} câu ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TabBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.3rem 0.8rem",
        borderRadius: 999,
        border: `1.5px solid ${on ? ACCENT : "var(--border)"}`,
        background: on ? "rgba(79,70,229,0.08)" : "transparent",
        color: on ? ACCENT : "var(--text-muted)",
        fontSize: "0.78rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
