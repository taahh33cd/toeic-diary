"use client";

import { useState, useEffect, useRef } from "react";
import type {
  P2TestData,
  P2Exercise,
  EmailBlock,
  MatchingEx,
  WordBankEx,
  RecallEx,
  McqEx,
  LabelingEx,
  OrderingEx,
  TypeBlankEx,
  WordOrderEx,
  TranslateEx,
  ErrorSpotEx,
  MissionAuditEx,
  CompareEx,
  TrimEx,
} from "@/lib/subskills/writing-part2";
import { normP2, matchesAccepted, isNearMiss, dbPartW2 } from "@/lib/subskills/writing-part2";
import { FS } from "@/lib/ui/scale";

type BestMap = Record<string, { score: number; passed: boolean }>;
type Difficulty = "easy" | "medium" | "hard";
type Phase = "tests" | "doing" | "done";

type Props = {
  skillId: string;
  allTests: P2TestData[];
  easyBest: BestMap;
  mediumBest: BestMap;
  hardBest: BestMap;
  isTestUser: boolean;
  userId: string | null;
  passThreshold: number;
};

// ─────────────────────────────────────
// Bits dùng chung
// ─────────────────────────────────────

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";
const AMBER = "rgb(234,179,8)";

function ResultBadge({ score }: { score: number }) {
  const ok = score === 100;
  const partial = score > 0 && score < 100;
  const color = ok ? GREEN : partial ? AMBER : RED;
  const label = ok ? "✓ Đúng" : partial ? `${score}% đúng` : "✗ Sai";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: FS.xs, fontWeight: 600, color, background: `${color.replace("rgb", "rgba").replace(")", ",0.1)")}`, border: `1px solid ${color.replace("rgb", "rgba").replace(")", ",0.3)")}`, borderRadius: 6, padding: "3px 10px" }}>
      {label}
    </span>
  );
}

function Explanation({ text }: { text: string }) {
  return (
    <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.5rem 0 0", lineHeight: 1.6 }}>{text}</p>
  );
}

/**
 * Chỉ giữ những biến thể THẬT SỰ khác đáp án chính.
 * Các biến thể chỉ khác ở viết tắt hoặc dấu câu đã được normP2 coi là như nhau
 * nên vẫn được chấm đúng — hiển thị lại chúng chỉ làm rối người học.
 */
function distinctAlternatives(answer: string, accepted?: string[]): string[] {
  const seen = new Set([normP2(answer)]);
  const out: string[] = [];
  for (const a of accepted ?? []) {
    const n = normP2(a);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(a);
  }
  return out;
}

function CheckButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: disabled ? "var(--bg-elevated)" : "var(--accent-primary)", color: disabled ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: FS.sm, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit" }}
    >
      Kiểm tra
    </button>
  );
}

function Select({ value, onChange, options, disabled, state }: { value: string; onChange: (v: string) => void; options: string[]; disabled: boolean; state?: boolean }) {
  const border = state === undefined ? "1.5px solid var(--border)" : `1.5px solid ${state ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`;
  const bg = state === undefined ? "var(--bg-secondary)" : state ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: FS.sm, border, borderRadius: 8, background: bg, color: "var(--text-primary)", outline: "none", fontFamily: "inherit", cursor: disabled ? "default" : "pointer" }}
    >
      <option value="">— chọn —</option>
      {options.map((o, i) => (
        <option key={i} value={o}>{o}</option>
      ))}
    </select>
  );
}

/** Xáo trộn ổn định theo id — cùng một bài luôn ra cùng một thứ tự */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function EmailView({ email }: { email: EmailBlock }) {
  const rows: [string, string | undefined][] = [
    ["FROM", email.from],
    ["TO", email.to],
    ["SUBJECT", email.subject],
    ["SENT", email.sent],
  ];
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "1rem", background: "var(--bg-secondary)" }}>
      <div style={{ padding: "6px 12px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>
        Directions: Read the e-mail below.
      </div>
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 10, padding: "5px 12px", borderBottom: "1px solid var(--border)", fontSize: FS.xs }}>
          <span style={{ minWidth: 62, color: "var(--text-muted)", fontWeight: 600 }}>{k}:</span>
          <span style={{ color: "var(--text-primary)" }}>{v}</span>
        </div>
      ))}
      <div style={{ padding: "10px 12px" }}>
        {email.body.map((p, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.6rem 0 0", fontSize: FS.sm, lineHeight: 1.65, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{p}</p>
        ))}
      </div>
      {email.directions && (
        <div style={{ padding: "9px 12px", borderTop: "1px solid var(--border)", background: "rgba(234,179,8,0.07)" }}>
          <p style={{ margin: 0, fontSize: FS.sm, lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic" }}>
            <strong style={{ fontStyle: "normal" }}>Directions:</strong> {email.directions}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 0 easy — ghép nửa câu
// ─────────────────────────────────────

function MatchingCard({ ex, onResult }: { ex: MatchingEx; onResult: (score: number) => void }) {
  const [picks, setPicks] = useState<string[]>(ex.pairs.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const options = seededShuffle(ex.pairs.map((p) => p.right), ex.id);

  function submit() {
    const correct = ex.pairs.filter((p, i) => picks[i] === p.right).length;
    setSubmitted(true);
    onResult(Math.round((correct / ex.pairs.length) * 100));
  }

  const allPicked = picks.every((p) => p);

  return (
    <div>
      <p style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.9rem", lineHeight: 1.5 }}>{ex.prompt}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: "1rem" }}>
        {ex.pairs.map((p, i) => (
          <div key={i}>
            <div style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: 4 }}>{p.left} …</div>
            <Select
              value={picks[i]}
              onChange={(v) => setPicks((prev) => { const n = [...prev]; n[i] = v; return n; })}
              options={options}
              disabled={submitted}
              state={submitted ? picks[i] === p.right : undefined}
            />
            {submitted && picks[i] !== p.right && (
              <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 3 }}>→ {p.right}</div>
            )}
          </div>
        ))}
      </div>
      {!submitted ? <CheckButton onClick={submit} disabled={!allPicked} /> : <Explanation text={ex.explanation} />}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 0 medium — điền từ từ ngân hàng từ
// ─────────────────────────────────────

function WordBankCard({ ex, onResult }: { ex: WordBankEx; onResult: (score: number) => void }) {
  const [picks, setPicks] = useState<string[]>(ex.answers.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const parts = ex.sentence.split("___");
  const bank = seededShuffle(ex.bank, ex.id);

  function submit() {
    const correct = ex.answers.filter((a, i) => normP2(picks[i]) === normP2(a)).length;
    setSubmitted(true);
    onResult(Math.round((correct / ex.answers.length) * 100));
  }

  const allPicked = picks.every((p) => p);

  return (
    <div>
      {ex.prompt && <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.7rem" }}>{ex.prompt}</p>}

      <div style={{ fontSize: FS.md, color: "var(--text-primary)", lineHeight: 2.1, marginBottom: "1rem" }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  minWidth: 96,
                  textAlign: "center",
                  padding: "2px 10px",
                  margin: "0 3px",
                  borderRadius: 6,
                  fontWeight: 600,
                  border: submitted
                    ? `1.5px solid ${normP2(picks[i]) === normP2(ex.answers[i]) ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`
                    : "1.5px solid var(--accent-primary)",
                  background: submitted
                    ? normP2(picks[i]) === normP2(ex.answers[i]) ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"
                    : "var(--bg-secondary)",
                  color: picks[i] ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {picks[i] || "___"}
              </span>
            )}
          </span>
        ))}
      </div>

      {!submitted && (
        <>
          <p style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>
            NGÂN HÀNG TỪ — bấm để điền vào chỗ trống trống đầu tiên
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
            {bank.map((w) => {
              const used = picks.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => {
                    setPicks((prev) => {
                      const n = [...prev];
                      const idx = n.indexOf(w);
                      if (idx !== -1) { n[idx] = ""; return n; }
                      const empty = n.indexOf("");
                      if (empty !== -1) n[empty] = w;
                      return n;
                    });
                  }}
                  style={{ padding: "5px 12px", fontSize: FS.sm, fontWeight: 500, borderRadius: 6, border: used ? "1.5px solid var(--accent-primary)" : "1.5px solid var(--border)", background: used ? "rgba(59,130,246,0.12)" : "var(--bg-secondary)", color: used ? "var(--accent-primary)" : "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </>
      )}

      {!submitted ? (
        <CheckButton onClick={submit} disabled={!allPicked} />
      ) : (
        <div>
          <ResultBadge score={Math.round((ex.answers.filter((a, i) => normP2(picks[i]) === normP2(a)).length / ex.answers.length) * 100)} />
          <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.5rem 0 0" }}>
            <strong>Đáp án:</strong> {ex.answers.join(" · ")}
          </p>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 0 hard — xem câu mẫu rồi gõ lại
// ─────────────────────────────────────

function RecallCard({ ex, onResult }: { ex: RecallEx; onResult: (score: number) => void }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [peeksLeft, setPeeksLeft] = useState(2);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function peek() {
    if (peeksLeft <= 0 || peeking) return;
    setPeeking(true);
    setPeeksLeft((n) => n - 1);
    timer.current = setTimeout(() => setPeeking(false), 5000);
  }

  function submit() {
    if (!input.trim()) return;
    const c = matchesAccepted(input, ex.answer, ex.accepted);
    setCorrect(c);
    setSubmitted(true);
    onResult(c ? 100 : 0);
  }

  const near = submitted && !correct ? isNearMiss(input, ex.answer, ex.accepted) : null;

  return (
    <div>
      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>VIẾT CÂU TIẾNG ANH TƯƠNG ỨNG</p>
      <p style={{ fontSize: FS.md, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.8rem", lineHeight: 1.5 }}>{ex.hintVi}</p>

      {!submitted && (
        <div style={{ marginBottom: "0.8rem" }}>
          {peeking ? (
            <div style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px dashed var(--accent-primary)", background: "rgba(59,130,246,0.08)", fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 500 }}>
              {ex.answer}
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)", marginLeft: 8 }}>(ẩn sau 5 giây)</span>
            </div>
          ) : (
            <button
              onClick={peek}
              disabled={peeksLeft <= 0}
              style={{ padding: "6px 14px", fontSize: FS.xs, fontWeight: 600, borderRadius: 6, border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: peeksLeft > 0 ? "var(--text-secondary)" : "var(--text-muted)", cursor: peeksLeft > 0 ? "pointer" : "not-allowed", fontFamily: "inherit" }}
            >
              👁 Xem câu mẫu 5 giây ({peeksLeft} lượt còn lại)
            </button>
          )}
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !submitted) { e.preventDefault(); submit(); } }}
        disabled={submitted}
        rows={2}
        placeholder="Gõ câu tiếng Anh…"
        style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", fontSize: FS.md, border: submitted ? `1.5px solid ${correct ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}` : "1.5px solid var(--border)", borderRadius: 8, background: "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: "0.6rem", lineHeight: 1.5 }}
      />

      {!submitted ? (
        <CheckButton onClick={submit} disabled={!input.trim()} />
      ) : (
        <div>
          {correct ? (
            <ResultBadge score={100} />
          ) : near?.near ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: FS.xs, fontWeight: 600, color: AMBER, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 6, padding: "3px 10px" }}>
              ⚠ Gần đúng — sai 1 từ
            </span>
          ) : (
            <ResultBadge score={0} />
          )}
          <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.55rem 0 0" }}>
            <strong>Đáp án:</strong> {ex.answer}
          </p>
          {distinctAlternatives(ex.answer, ex.accepted).length > 0 && (
            <details style={{ marginTop: 5 }}>
              <summary style={{ fontSize: FS.xs, color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600 }}>
                Xem {distinctAlternatives(ex.answer, ex.accepted).length} cách viết khác cũng được chấp nhận
              </summary>
              <ul style={{ margin: "5px 0 0", paddingLeft: 20 }}>
                {distinctAlternatives(ex.answer, ex.accepted).map((a, i) => (
                  <li key={i} style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6 }}>{a}</li>
                ))}
              </ul>
            </details>
          )}
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 1 — trắc nghiệm trên email đề
// ─────────────────────────────────────

function McqCard({ ex, email, onResult }: { ex: McqEx; email?: EmailBlock; onResult: (score: number) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function score(): number {
    if (!ex.multi) return ex.correctAnswers.includes(selected[0]) ? 100 : 0;
    const hit = selected.filter((s) => ex.correctAnswers.includes(s)).length;
    const miss = selected.filter((s) => !ex.correctAnswers.includes(s)).length;
    return Math.max(0, Math.round(((hit - miss) / ex.correctAnswers.length) * 100));
  }

  function toggle(id: string) {
    if (submitted) return;
    if (ex.multi) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelected([id]);
    }
  }

  function submit() {
    setSubmitted(true);
    onResult(score());
  }

  return (
    <div>
      {email && <EmailView email={email} />}
      <p style={{ fontSize: FS.md, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.2rem", lineHeight: 1.55 }}>{ex.question}</p>
      {ex.multi && (
        <p style={{ fontSize: FS.xs, color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.7rem" }}>
          Chọn nhiều đáp án · chọn sai sẽ bị trừ điểm
        </p>
      )}
      {!ex.multi && <div style={{ height: "0.7rem" }} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "0.9rem" }}>
        {ex.options.map((opt) => {
          const isSel = selected.includes(opt.id);
          const isCor = ex.correctAnswers.includes(opt.id);
          let bg = "var(--bg-secondary)";
          let border = "1.5px solid var(--border)";
          let color = "var(--text-primary)";
          if (submitted) {
            if (isCor) { bg = "rgba(34,197,94,0.1)"; border = "1.5px solid rgba(34,197,94,0.4)"; color = GREEN; }
            else if (isSel) { bg = "rgba(239,68,68,0.1)"; border = "1.5px solid rgba(239,68,68,0.4)"; color = RED; }
          } else if (isSel) {
            bg = "rgba(59,130,246,0.1)"; border = "1.5px solid var(--accent-primary)";
          }
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              disabled={submitted}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: bg, border, borderRadius: 8, cursor: submitted ? "default" : "pointer", textAlign: "left", color, fontFamily: "inherit" }}
            >
              <span style={{ fontWeight: 700, fontSize: FS.sm, minWidth: 18, flexShrink: 0 }}>{opt.id}.</span>
              <span style={{ fontSize: FS.sm, lineHeight: 1.5 }}>{opt.text}</span>
              {submitted && isCor && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✓</span>}
              {submitted && isSel && !isCor && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✗</span>}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <CheckButton onClick={submit} disabled={selected.length === 0} />
      ) : (
        <div>
          <ResultBadge score={score()} />
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 2 easy/medium — gắn nhãn từng câu
// ─────────────────────────────────────

function LabelingCard({ ex, onResult }: { ex: LabelingEx; onResult: (score: number) => void }) {
  const [picks, setPicks] = useState<string[]>(ex.sentences.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const options = seededShuffle(ex.labels, ex.id);

  function submit() {
    const correct = ex.sentences.filter((s, i) => picks[i] === s.label).length;
    setSubmitted(true);
    onResult(Math.round((correct / ex.sentences.length) * 100));
  }

  const allPicked = picks.every((p) => p);

  return (
    <div>
      {ex.intro && <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.9rem", lineHeight: 1.55 }}>{ex.intro}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1rem" }}>
        {ex.sentences.map((s, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${submitted ? (picks[i] === s.label ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)") : "var(--border)"}`, paddingLeft: 12 }}>
            <p style={{ fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 6px", whiteSpace: "pre-wrap" }}>{s.text}</p>
            <Select
              value={picks[i]}
              onChange={(v) => setPicks((prev) => { const n = [...prev]; n[i] = v; return n; })}
              options={options}
              disabled={submitted}
              state={submitted ? picks[i] === s.label : undefined}
            />
            {submitted && picks[i] !== s.label && (
              <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 3 }}>→ {s.label}</div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? <CheckButton onClick={submit} disabled={!allPicked} /> : <Explanation text={ex.explanation} />}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 2 hard — sắp xếp câu thành email
// ─────────────────────────────────────

function OrderingCard({ ex, onResult }: { ex: OrderingEx; onResult: (score: number) => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const pool = seededShuffle(ex.items, ex.id);
  const remaining = pool.filter((p) => !order.includes(p));

  function submit() {
    const correct = ex.items.filter((it, i) => order[i] === it).length;
    setSubmitted(true);
    onResult(Math.round((correct / ex.items.length) * 100));
  }

  return (
    <div>
      <p style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.9rem", lineHeight: 1.55 }}>{ex.prompt}</p>

      {/* Vùng đáp án */}
      <div style={{ border: "1.5px dashed var(--border)", borderRadius: 10, padding: order.length ? "0.6rem" : "1.2rem 0.6rem", marginBottom: "0.9rem", background: "var(--bg-secondary)", minHeight: 60 }}>
        {order.length === 0 ? (
          <p style={{ margin: 0, textAlign: "center", fontSize: FS.sm, color: "var(--text-muted)" }}>Bấm các câu bên dưới theo đúng thứ tự của e-mail</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {order.map((item, i) => {
              const ok = submitted ? ex.items[i] === item : undefined;
              return (
                <div
                  key={i}
                  onClick={() => { if (!submitted) setOrder((prev) => prev.filter((_, k) => k !== i)); }}
                  style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "7px 10px", borderRadius: 7, cursor: submitted ? "default" : "pointer", background: ok === undefined ? "var(--bg-elevated)" : ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${ok === undefined ? "var(--border)" : ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}` }}
                >
                  <span style={{ fontWeight: 700, fontSize: FS.xs, color: "var(--text-muted)", minWidth: 16, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: FS.sm, lineHeight: 1.55, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vùng câu chưa dùng */}
      {!submitted && remaining.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: "1rem" }}>
          {remaining.map((item) => (
            <button
              key={item}
              onClick={() => setOrder((prev) => [...prev, item])}
              style={{ textAlign: "left", padding: "8px 11px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: FS.sm, lineHeight: 1.55, cursor: "pointer", fontFamily: "inherit", whiteSpace: "pre-wrap" }}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {!submitted ? (
        <CheckButton onClick={submit} disabled={order.length !== ex.items.length} />
      ) : (
        <div>
          <ResultBadge score={Math.round((ex.items.filter((it, i) => order[i] === it).length / ex.items.length) * 100)} />
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: FS.xs, color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600 }}>Xem thứ tự đúng</summary>
            <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {ex.items.map((it, i) => (
                <li key={i} style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 3, whiteSpace: "pre-wrap" }}>{it}</li>
              ))}
            </ol>
          </details>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 3/4 — gõ từ vào chỗ trống
// ─────────────────────────────────────

function TypeBlankCard({ ex, onResult }: { ex: TypeBlankEx; onResult: (score: number) => void }) {
  const [inputs, setInputs] = useState<string[]>(ex.answers.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const parts = ex.sentence.split("___");

  function isOk(i: number): boolean {
    return matchesAccepted(inputs[i] ?? "", ex.answers[i], ex.accepted?.[i]);
  }

  function submit() {
    const correct = ex.answers.filter((_, i) => isOk(i)).length;
    setSubmitted(true);
    onResult(Math.round((correct / ex.answers.length) * 100));
  }

  const allFilled = inputs.every((v) => v.trim());

  return (
    <div>
      {ex.prompt && <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.7rem" }}>{ex.prompt}</p>}
      {ex.vi && (
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", marginBottom: "0.8rem", lineHeight: 1.55, fontStyle: "italic" }}>
          {ex.vi}
        </p>
      )}

      <div style={{ fontSize: FS.md, color: "var(--text-primary)", lineHeight: 2.3, marginBottom: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        {parts.map((part, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                type="text"
                value={inputs[i] ?? ""}
                onChange={(e) => setInputs((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                onKeyDown={(e) => { if (e.key === "Enter" && !submitted && allFilled) submit(); }}
                disabled={submitted}
                placeholder="…"
                style={{ width: 118, padding: "3px 8px", fontSize: FS.md, fontWeight: 600, border: submitted ? `1.5px solid ${isOk(i) ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)"}` : "1.5px solid var(--accent-primary)", borderRadius: 6, background: submitted ? (isOk(i) ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)") : "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", textAlign: "center", fontFamily: "inherit" }}
              />
            )}
          </span>
        ))}
      </div>

      {!submitted ? (
        <CheckButton onClick={submit} disabled={!allFilled} />
      ) : (
        <div>
          <ResultBadge score={Math.round((ex.answers.filter((_, i) => isOk(i)).length / ex.answers.length) * 100)} />
          <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.55rem 0 0" }}>
            <strong>Đáp án:</strong> {ex.answers.join(" · ")}
          </p>
          {ex.answers.flatMap((ans, i) => distinctAlternatives(ans, ex.accepted?.[i])).length > 0 && (
            <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "3px 0 0" }}>
              Cũng được chấp nhận: {ex.answers.flatMap((ans, i) => distinctAlternatives(ans, ex.accepted?.[i])).join(" · ")}
            </p>
          )}
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 4 hard — sắp xếp từ thành câu
// ─────────────────────────────────────

function WordOrderCard({ ex, onResult }: { ex: WordOrderEx; onResult: (score: number) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const shuffled = seededShuffle(ex.tokens.map((t, i) => ({ t, i })), ex.id);

  const built = picked.map((k) => shuffled[k].t).join(" ");

  function submit() {
    const c = matchesAccepted(built, ex.answer, ex.accepted);
    setCorrect(c);
    setSubmitted(true);
    onResult(c ? 100 : 0);
  }

  const near = submitted && !correct ? isNearMiss(built, ex.answer, ex.accepted) : null;

  return (
    <div>
      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 4 }}>
        SẮP XẾP THÀNH CÂU HOÀN CHỈNH
      </p>
      {ex.vi && (
        <p style={{ fontSize: FS.md, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.85rem", lineHeight: 1.5 }}>{ex.vi}</p>
      )}

      {/* Vùng câu đang dựng */}
      <div style={{ border: "1.5px dashed var(--border)", borderRadius: 10, padding: picked.length ? "0.7rem 0.9rem" : "1.1rem 0.9rem", marginBottom: "0.85rem", background: submitted ? (correct ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)") : "var(--bg-secondary)", minHeight: 46 }}>
        {picked.length === 0 ? (
          <p style={{ margin: 0, textAlign: "center", fontSize: FS.sm, color: "var(--text-muted)" }}>Bấm các từ bên dưới theo đúng thứ tự</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {picked.map((k, pos) => (
              <button
                key={pos}
                onClick={() => { if (!submitted) setPicked((prev) => prev.filter((_, j) => j !== pos)); }}
                disabled={submitted}
                style={{ padding: "4px 10px", fontSize: FS.sm, fontWeight: 600, borderRadius: 6, border: "1.5px solid var(--accent-primary)", background: "rgba(59,130,246,0.12)", color: "var(--text-primary)", cursor: submitted ? "default" : "pointer", fontFamily: "inherit" }}
              >
                {shuffled[k].t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kho từ */}
      {!submitted && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "1rem" }}>
          {shuffled.map((s, k) =>
            picked.includes(k) ? null : (
              <button
                key={k}
                onClick={() => setPicked((prev) => [...prev, k])}
                style={{ padding: "5px 12px", fontSize: FS.sm, fontWeight: 500, borderRadius: 6, border: "1.5px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}
              >
                {s.t}
              </button>
            ),
          )}
        </div>
      )}

      {!submitted ? (
        <CheckButton onClick={submit} disabled={picked.length !== ex.tokens.length} />
      ) : (
        <div>
          {correct ? (
            <ResultBadge score={100} />
          ) : near?.near ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: FS.xs, fontWeight: 600, color: AMBER, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 6, padding: "3px 10px" }}>
              ⚠ Gần đúng — sai vị trí 1 từ
            </span>
          ) : (
            <ResultBadge score={0} />
          )}
          <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.55rem 0 0" }}>
            <strong>Đáp án:</strong> {ex.answer}
          </p>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 5 — dịch Việt → Anh
// ─────────────────────────────────────

function TranslateCard({ ex, onResult }: { ex: TranslateEx; onResult: (score: number) => void }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  function submit() {
    if (!input.trim()) return;
    const c = matchesAccepted(input, ex.answer, ex.accepted);
    setCorrect(c);
    setSubmitted(true);
    onResult(c ? 100 : 0);
  }

  const near = submitted && !correct ? isNearMiss(input, ex.answer, ex.accepted) : null;
  const isBlock = ex.answer.split(/[.?!]\s/).length > 1;

  return (
    <div>
      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 5 }}>
        DỊCH SANG TIẾNG ANH
      </p>
      <p style={{ fontSize: FS.md, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.85rem", lineHeight: 1.6, padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border)" }}>
        {ex.vi}
      </p>

      {ex.hintWords && ex.hintWords.length > 0 && !submitted && (
        <div style={{ marginBottom: "0.8rem" }}>
          <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 5 }}>
            GỢI Ý — dùng các cụm này theo đúng thứ tự
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {ex.hintWords.map((w, i) => (
              <span key={i} style={{ padding: "3px 10px", fontSize: FS.sm, borderRadius: 6, border: "1px dashed var(--accent-primary)", background: "rgba(59,130,246,0.07)", color: "var(--text-secondary)" }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !submitted && !isBlock) { e.preventDefault(); submit(); } }}
        disabled={submitted}
        rows={isBlock ? 4 : 2}
        placeholder="Viết câu tiếng Anh…"
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 13px", fontSize: FS.md, border: submitted ? `1.5px solid ${correct ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}` : "1.5px solid var(--border)", borderRadius: 8, background: "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit", marginBottom: "0.65rem", lineHeight: 1.6 }}
      />

      {!submitted ? (
        <CheckButton onClick={submit} disabled={!input.trim()} />
      ) : (
        <div>
          {correct ? (
            <ResultBadge score={100} />
          ) : near?.near ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: FS.xs, fontWeight: 600, color: AMBER, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 6, padding: "3px 10px" }}>
              ⚠ Gần đúng — chỉ sai 1 từ
            </span>
          ) : (
            <ResultBadge score={0} />
          )}
          <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", margin: "0.55rem 0 0", lineHeight: 1.6 }}>
            <strong>Đáp án mẫu:</strong> {ex.answer}
          </p>
          {distinctAlternatives(ex.answer, ex.accepted).length > 0 && (
            <details style={{ marginTop: 6 }}>
              <summary style={{ fontSize: FS.xs, color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600 }}>
                Xem {distinctAlternatives(ex.answer, ex.accepted).length} cách viết khác cũng được chấp nhận
              </summary>
              <ul style={{ margin: "5px 0 0", paddingLeft: 20 }}>
                {distinctAlternatives(ex.answer, ex.accepted).map((a, i) => (
                  <li key={i} style={{ fontSize: FS.sm, color: "var(--text-secondary)", lineHeight: 1.65 }}>{a}</li>
                ))}
              </ul>
            </details>
          )}
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 6 easy — soi lỗi trong thư nháp
// ─────────────────────────────────────

function DirectionsBox({ text }: { text: string }) {
  return (
    <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(234,179,8,0.09)", border: "1px solid rgba(234,179,8,0.3)", marginBottom: "0.85rem" }}>
      <p style={{ margin: 0, fontSize: FS.sm, lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic" }}>
        <strong style={{ fontStyle: "normal" }}>Directions:</strong> {text}
      </p>
    </div>
  );
}

function ErrorSpotCard({ ex, onResult }: { ex: ErrorSpotEx; onResult: (score: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function pick(i: number) {
    if (submitted) return;
    setPicked(i);
    setSubmitted(true);
    onResult(i === ex.errorIndex ? 100 : 0);
  }

  return (
    <div>
      {ex.intro && <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.8rem", lineHeight: 1.55 }}>{ex.intro}</p>}
      {ex.directions && <DirectionsBox text={ex.directions} />}

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "0.9rem" }}>
        {ex.lines.map((line, i) => {
          const isErr = i === ex.errorIndex;
          const isPicked = picked === i;
          let bg = i % 2 === 0 ? "var(--bg-secondary)" : "var(--bg-primary)";
          let color = "var(--text-primary)";
          if (submitted) {
            if (isErr) { bg = "rgba(239,68,68,0.13)"; color = RED; }
            else if (isPicked) { bg = "rgba(234,179,8,0.13)"; color = AMBER; }
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={submitted}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%", padding: "9px 13px", background: bg, border: "none", borderBottom: i < ex.lines.length - 1 ? "1px solid var(--border)" : "none", cursor: submitted ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", color }}
            >
              <span style={{ fontSize: FS.xs, fontWeight: 700, color: "var(--text-muted)", minWidth: 16, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
              <span style={{ fontSize: FS.sm, lineHeight: 1.6, flex: 1 }}>{line}</span>
              {submitted && isErr && <span style={{ flexShrink: 0, fontSize: FS.sm }}>✗</span>}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div>
          <ResultBadge score={picked === ex.errorIndex ? 100 : 0} />
          <p style={{ fontSize: FS.sm, color: RED, margin: "0.55rem 0 0", fontWeight: 600 }}>
            Dòng {ex.errorIndex + 1} — {ex.errorLabel}
          </p>
          <p style={{ fontSize: FS.sm, color: GREEN, margin: "3px 0 0", fontWeight: 600, lineHeight: 1.6 }}>
            → {ex.fix}
          </p>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 6 medium — đối chiếu mission với Directions
// ─────────────────────────────────────

function MissionAuditCard({ ex, onResult }: { ex: MissionAuditEx; onResult: (score: number) => void }) {
  const [marks, setMarks] = useState<(boolean | null)[]>(ex.missions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    const correct = ex.missions.filter((m, i) => marks[i] === m.done).length;
    setSubmitted(true);
    onResult(Math.round((correct / ex.missions.length) * 100));
  }

  const allMarked = marks.every((m) => m !== null);

  return (
    <div>
      <DirectionsBox text={ex.directions} />

      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 5 }}>
        THƯ NHÁP CỦA MỘT HỌC VIÊN
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", background: "var(--bg-secondary)", marginBottom: "1.1rem" }}>
        {ex.draft.map((line, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.45rem 0 0", fontSize: FS.sm, lineHeight: 1.65, color: "var(--text-primary)" }}>{line}</p>
        ))}
      </div>

      <p style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.6rem" }}>
        Thư này đã làm được mission nào?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: "1rem" }}>
        {ex.missions.map((m, i) => {
          const ok = submitted && marks[i] === m.done;
          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 8, border: `1.5px solid ${submitted ? (ok ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)") : "var(--border)"}`, background: submitted ? (ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)") : "var(--bg-secondary)", flexWrap: "wrap" }}
            >
              <span style={{ flex: "1 1 160px", fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.5 }}>{m.text}</span>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {([[true, "Đã làm"], [false, "Còn thiếu"]] as [boolean, string][]).map(([val, label]) => {
                  const sel = marks[i] === val;
                  return (
                    <button
                      key={label}
                      onClick={() => { if (!submitted) setMarks((prev) => { const n = [...prev]; n[i] = val; return n; }); }}
                      disabled={submitted}
                      style={{ padding: "4px 12px", fontSize: FS.xs, fontWeight: 600, borderRadius: 6, border: `1.5px solid ${sel ? "var(--accent-primary)" : "var(--border)"}`, background: sel ? "rgba(59,130,246,0.14)" : "transparent", color: sel ? "var(--accent-primary)" : "var(--text-muted)", cursor: submitted ? "default" : "pointer", fontFamily: "inherit" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {submitted && !ok && (
                <span style={{ flexBasis: "100%", fontSize: FS.xs, color: "var(--text-muted)" }}>
                  → thực tế: {m.done ? "Đã làm" : "Còn thiếu"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <CheckButton onClick={submit} disabled={!allMarked} />
      ) : (
        <div>
          <ResultBadge score={Math.round((ex.missions.filter((m, i) => marks[i] === m.done).length / ex.missions.length) * 100)} />
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 6 hard — so sánh 2 bản trả lời
// ─────────────────────────────────────

function VersionBox({ label, lines, state }: { label: string; lines: string[]; state?: "better" | "worse" }) {
  const border = state === "better" ? "rgba(34,197,94,0.5)" : state === "worse" ? "rgba(239,68,68,0.4)" : "var(--border)";
  return (
    <div style={{ flex: "1 1 260px", border: `1.5px solid ${border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "6px 12px", background: state === "better" ? "rgba(34,197,94,0.12)" : state === "worse" ? "rgba(239,68,68,0.09)" : "var(--bg-elevated)", borderBottom: `1px solid ${border}`, fontSize: FS.xs, fontWeight: 700, color: state === "better" ? GREEN : state === "worse" ? RED : "var(--text-secondary)" }}>
        Bản {label}{state === "better" ? " ✓ tốt hơn" : ""}
      </div>
      <div style={{ padding: "10px 13px", background: "var(--bg-secondary)" }}>
        {lines.map((l, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.4rem 0 0", fontSize: FS.sm, lineHeight: 1.65, color: "var(--text-primary)" }}>{l}</p>
        ))}
      </div>
    </div>
  );
}

function CompareCard({ ex, onResult }: { ex: CompareEx; onResult: (score: number) => void }) {
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    const s = (choice === ex.better ? 50 : 0) + (reason === ex.correctReason ? 50 : 0);
    setSubmitted(true);
    onResult(s);
  }

  const score = (choice === ex.better ? 50 : 0) + (reason === ex.correctReason ? 50 : 0);

  return (
    <div>
      <DirectionsBox text={ex.directions} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "1.1rem" }}>
        <VersionBox label="A" lines={ex.versionA} state={submitted ? (ex.better === "A" ? "better" : "worse") : undefined} />
        <VersionBox label="B" lines={ex.versionB} state={submitted ? (ex.better === "B" ? "better" : "worse") : undefined} />
      </div>

      {/* Bước 1 */}
      <p style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
        1. Bản nào tốt hơn?
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: "1.1rem" }}>
        {(["A", "B"] as const).map((v) => {
          const sel = choice === v;
          const isAns = submitted && ex.better === v;
          const wrong = submitted && sel && ex.better !== v;
          return (
            <button
              key={v}
              onClick={() => { if (!submitted) setChoice(v); }}
              disabled={submitted}
              style={{ padding: "8px 26px", fontSize: FS.sm, fontWeight: 700, borderRadius: 8, border: `1.5px solid ${isAns ? "rgba(34,197,94,0.5)" : wrong ? "rgba(239,68,68,0.5)" : sel ? "var(--accent-primary)" : "var(--border)"}`, background: isAns ? "rgba(34,197,94,0.12)" : wrong ? "rgba(239,68,68,0.12)" : sel ? "rgba(59,130,246,0.12)" : "var(--bg-secondary)", color: isAns ? GREEN : wrong ? RED : sel ? "var(--accent-primary)" : "var(--text-primary)", cursor: submitted ? "default" : "pointer", fontFamily: "inherit" }}
            >
              Bản {v}
            </button>
          );
        })}
      </div>

      {/* Bước 2 */}
      <p style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
        2. Vì sao?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
        {ex.reasons.map((r) => {
          const sel = reason === r.id;
          const isAns = r.id === ex.correctReason;
          let bg = "var(--bg-secondary)";
          let border = "1.5px solid var(--border)";
          let color = "var(--text-primary)";
          if (submitted) {
            if (isAns) { bg = "rgba(34,197,94,0.1)"; border = "1.5px solid rgba(34,197,94,0.4)"; color = GREEN; }
            else if (sel) { bg = "rgba(239,68,68,0.1)"; border = "1.5px solid rgba(239,68,68,0.4)"; color = RED; }
          } else if (sel) {
            bg = "rgba(59,130,246,0.1)"; border = "1.5px solid var(--accent-primary)";
          }
          return (
            <button
              key={r.id}
              onClick={() => { if (!submitted) setReason(r.id); }}
              disabled={submitted}
              style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "10px 13px", background: bg, border, borderRadius: 8, cursor: submitted ? "default" : "pointer", textAlign: "left", color, fontFamily: "inherit" }}
            >
              <span style={{ fontWeight: 700, fontSize: FS.sm, minWidth: 16, flexShrink: 0 }}>{r.id}.</span>
              <span style={{ fontSize: FS.sm, lineHeight: 1.55 }}>{r.text}</span>
              {submitted && isAns && <span style={{ marginLeft: "auto", flexShrink: 0 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <CheckButton onClick={submit} disabled={choice === null || reason === null} />
      ) : (
        <div>
          <ResultBadge score={score} />
          <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.45rem 0 0" }}>
            Chọn bản đúng: 50 điểm · chọn lý do đúng: 50 điểm
          </p>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 8 — bỏ bớt câu thừa khỏi thư nháp
// ─────────────────────────────────────

function TrimCard({ ex, onResult }: { ex: TrimEx; onResult: (score: number) => void }) {
  const [cut, setCut] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const shouldCut = new Set(ex.cutIndexes);
  // Chấm theo từng dòng: giữ đúng cũng được điểm như bỏ đúng, nên đoán bừa "bỏ hết" không ăn được.
  const correctLines = ex.lines.filter((_, i) => cut.has(i) === shouldCut.has(i)).length;
  const score = Math.round((correctLines / ex.lines.length) * 100);

  function toggle(i: number) {
    if (submitted) return;
    setCut((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div>
      <DirectionsBox text={ex.directions} />
      {ex.intro && <p style={{ fontSize: FS.sm, color: "var(--text-secondary)", marginBottom: "0.8rem", lineHeight: 1.55 }}>{ex.intro}</p>}

      <p style={{ fontSize: FS.sm, color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.6rem" }}>
        Bấm vào những câu <span style={{ color: RED }}>nên BỎ</span> khỏi thư nháp:
      </p>

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "0.9rem" }}>
        {ex.lines.map((line, i) => {
          const picked = cut.has(i);
          const mustCut = shouldCut.has(i);
          const ok = picked === mustCut;

          let bg = i % 2 === 0 ? "var(--bg-secondary)" : "var(--bg-primary)";
          let border = "var(--border)";
          if (submitted) {
            bg = ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.1)";
            border = ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.45)";
          } else if (picked) {
            bg = "rgba(239,68,68,0.1)";
            border = "rgba(239,68,68,0.4)";
          }

          return (
            <div key={i} style={{ borderBottom: i < ex.lines.length - 1 ? `1px solid ${border}` : "none" }}>
              <button
                onClick={() => toggle(i)}
                disabled={submitted}
                style={{ display: "flex", gap: 10, alignItems: "flex-start", width: "100%", padding: "9px 13px", background: bg, border: "none", cursor: submitted ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", color: "var(--text-primary)" }}
              >
                <span style={{ fontSize: FS.xs, fontWeight: 700, color: "var(--text-muted)", minWidth: 16, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
                <span style={{ fontSize: FS.sm, lineHeight: 1.6, flex: 1, textDecoration: picked ? "line-through" : "none", opacity: picked && !submitted ? 0.6 : 1 }}>
                  {line}
                </span>
                <span style={{ flexShrink: 0, fontSize: FS.sm, marginTop: 1 }}>
                  {submitted ? (mustCut ? "✂" : "✓") : picked ? "✂" : ""}
                </span>
              </button>

              {submitted && ex.reasons[String(i)] && (
                <p style={{ margin: 0, padding: "0 13px 9px 39px", fontSize: FS.xs, lineHeight: 1.55, color: mustCut ? RED : GREEN, background: bg }}>
                  {mustCut ? "Bỏ — " : "Giữ — "}{ex.reasons[String(i)]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <CheckButton onClick={() => { setSubmitted(true); onResult(score); }} disabled={cut.size === 0} />
      ) : (
        <div>
          <ResultBadge score={score} />
          <p style={{ fontSize: FS.xs, color: "var(--text-muted)", margin: "0.45rem 0 0" }}>
            Đúng {correctLines}/{ex.lines.length} dòng · phải bỏ {ex.cutIndexes.length} câu
          </p>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────

function ExerciseCard({ ex, emails, onResult }: { ex: P2Exercise; emails: Record<string, EmailBlock>; onResult: (score: number) => void }) {
  switch (ex.type) {
    case "matching": return <MatchingCard ex={ex} onResult={onResult} />;
    case "word_bank": return <WordBankCard ex={ex} onResult={onResult} />;
    case "recall": return <RecallCard ex={ex} onResult={onResult} />;
    case "mcq": return <McqCard ex={ex} email={ex.emailRef ? emails[ex.emailRef] : undefined} onResult={onResult} />;
    case "labeling": return <LabelingCard ex={ex} onResult={onResult} />;
    case "ordering": return <OrderingCard ex={ex} onResult={onResult} />;
    case "type_blank": return <TypeBlankCard ex={ex} onResult={onResult} />;
    case "word_order": return <WordOrderCard ex={ex} onResult={onResult} />;
    case "translate": return <TranslateCard ex={ex} onResult={onResult} />;
    case "error_spot": return <ErrorSpotCard ex={ex} onResult={onResult} />;
    case "mission_audit": return <MissionAuditCard ex={ex} onResult={onResult} />;
    case "compare": return <CompareCard ex={ex} onResult={onResult} />;
    case "trim": return <TrimCard ex={ex} onResult={onResult} />;
  }
}

function ScoreBadge({ score, passed }: { score: number; passed: boolean }) {
  const color = passed ? GREEN : score >= 60 ? AMBER : RED;
  return (
    <span style={{ display: "inline-block", fontSize: FS.md, fontWeight: 700, color, background: color.replace("rgb", "rgba").replace(")", ",0.12)"), border: `1.5px solid ${color.replace("rgb", "rgba").replace(")", ",0.4)")}`, borderRadius: 8, padding: "4px 14px" }}>
      {score}%
    </span>
  );
}

// ─────────────────────────────────────
// Main
// ─────────────────────────────────────

export default function WritingPart2Client({ skillId, allTests, easyBest, mediumBest, hardBest, isTestUser, userId, passThreshold }: Props) {
  const [phase, setPhase] = useState<Phase>("tests");
  const [activeTest, setActiveTest] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [scoreSum, setScoreSum] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [answered, setAnswered] = useState(false);

  const testData = allTests[activeTest - 1];
  const exercises = testData?.levels.find((l) => l.difficulty === difficulty)?.exercises ?? [];
  const total = exercises.length;
  const current = exercises[exerciseIdx];

  const bestMap: Record<Difficulty, BestMap> = { easy: easyBest, medium: mediumBest, hard: hardBest };
  const diffLabel: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

  function start(testNum: number, diff: Difficulty) {
    setActiveTest(testNum);
    setDifficulty(diff);
    setExerciseIdx(0);
    setScoreSum(0);
    setPerfectCount(0);
    setAnswered(false);
    setPhase("doing");
  }

  function saveAttempt(payload: { score: number; passed: boolean; itemIdx: number | null }) {
    if (!userId || isTestUser) return;
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: dbPartW2(skillId, difficulty),
        questionWord: String(activeTest),
        exerciseIndex: 0,
        ...payload,
      }),
    }).catch(() => {});
  }

  function onExResult(score: number) {
    setScoreSum((s) => s + score);
    if (score === 100) setPerfectCount((c) => c + 1);
    setAnswered(true);
    saveAttempt({ score, passed: score === 100, itemIdx: exerciseIdx });
  }

  function advanceOrFinish() {
    if (exerciseIdx < total - 1) {
      setExerciseIdx((i) => i + 1);
    } else {
      const score = Math.round(scoreSum / total);
      setPhase("done");
      saveAttempt({ score, passed: score >= passThreshold, itemIdx: null });
    }
  }

  // ── Kết quả ──
  if (phase === "done") {
    const score = Math.round(scoreSum / total);
    const passed = score >= passThreshold;
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{ fontSize: FS.sm, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Test {activeTest} · {diffLabel[difficulty]}</div>
        <ScoreBadge score={score} passed={passed} />
        <p style={{ marginTop: "0.75rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>
          {perfectCount}/{total} bài đúng hoàn toàn · {passed ? "Passed ✓" : `Cần ≥ ${passThreshold}% để pass`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => start(activeTest, difficulty)} style={{ padding: "8px 20px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: FS.sm, cursor: "pointer", fontFamily: "inherit" }}>Làm lại</button>
          <button onClick={() => setPhase("tests")} style={{ padding: "8px 20px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: FS.sm, cursor: "pointer", fontFamily: "inherit" }}>← Về danh sách test</button>
        </div>
      </div>
    );
  }

  // ── Đang làm bài ──
  if (phase === "doing" && current) {
    const progress = Math.round((exerciseIdx / total) * 100);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Test {activeTest} · {diffLabel[difficulty]} · {exerciseIdx + 1}/{total}</span>
          <button onClick={() => setPhase("tests")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: FS.xs, cursor: "pointer", padding: 0 }}>← Thoát</button>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginBottom: "1.5rem" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.2s" }} />
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)", marginBottom: "1rem" }}>
          <ExerciseCard key={`${activeTest}-${difficulty}-${exerciseIdx}`} ex={current} emails={testData.emails} onResult={onExResult} />
        </div>

        {answered && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setAnswered(false); advanceOrFinish(); }}
              style={{ padding: "8px 24px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: FS.sm, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {exerciseIdx < total - 1 ? "Câu tiếp →" : "Kết thúc ✓"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Danh sách test ──
  return (
    <div>
      {allTests.map((test, ti) => {
        const testNum = ti + 1;
        const diffs: Difficulty[] = ["easy", "medium", "hard"];
        return (
          <div key={testNum} style={{ marginBottom: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ padding: "0.75rem 1.2rem", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)" }}>Test {testNum}</span>
              <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{test.levels[0]?.exercises.length ?? 0} bài/cấp</span>
            </div>
            {diffs.map((diff) => {
              const badge = bestMap[diff][String(testNum)];
              const scoreColor = badge ? (badge.passed ? GREEN : badge.score >= 60 ? AMBER : RED) : "var(--text-muted)";
              return (
                <div key={diff} style={{ display: "flex", alignItems: "center", padding: "0.7rem 1.2rem", borderBottom: diff !== "hard" ? "1px solid var(--border)" : "none", background: "var(--bg-primary)", gap: "1rem" }}>
                  <span style={{ fontSize: FS.sm, fontWeight: 600, color: "var(--text-secondary)", minWidth: 60 }}>{diffLabel[diff]}</span>
                  {badge ? (
                    <span style={{ fontSize: FS.xs, color: scoreColor, fontWeight: 600 }}>{badge.score}%{badge.passed ? " ✓" : ""}</span>
                  ) : (
                    <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>Chưa làm</span>
                  )}
                  <button
                    onClick={() => start(testNum, diff)}
                    style={{ marginLeft: "auto", padding: "5px 16px", border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", borderRadius: 6, fontSize: FS.xs, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {badge ? "Làm lại" : "Bắt đầu"}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
