"use client";

import { useState } from "react";
import type {
  P3TestData,
  P3Exercise,
  PassageBlock,
  P3McqEx,
  P3LabelingEx,
  P3OrderingEx,
  P3MatchingEx,
  P3TypeBlankEx,
  P3ErrorSpotEx,
  P3MissionAuditEx,
} from "@/lib/subskills/writing-part3";
import { normP3, matchesAcceptedP3, dbPartW3 } from "@/lib/subskills/writing-part3";

type BestMap = Record<string, { score: number; passed: boolean }>;
type Difficulty = "easy" | "medium" | "hard";
type Phase = "tests" | "doing" | "done";

type Props = {
  skillId: string;
  allTests: P3TestData[];
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 600, color, background: color.replace("rgb", "rgba").replace(")", ",0.1)"), border: `1px solid ${color.replace("rgb", "rgba").replace(")", ",0.3)")}`, borderRadius: 6, padding: "3px 10px" }}>
      {label}
    </span>
  );
}

function Explanation({ text }: { text: string }) {
  return <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.5rem 0 0", lineHeight: 1.6 }}>{text}</p>;
}

/** Chỉ giữ những biến thể THẬT SỰ khác đáp án chính (xem WritingPart2Client) */
function distinctAlternatives(answer: string, accepted?: string[]): string[] {
  const seen = new Set([normP3(answer)]);
  const out: string[] = [];
  for (const a of accepted ?? []) {
    const n = normP3(a);
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
      style={{ background: disabled ? "var(--bg-elevated)" : "var(--accent-primary)", color: disabled ? "var(--text-muted)" : "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit" }}
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
      style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", fontSize: "0.85rem", border, borderRadius: 8, background: bg, color: "var(--text-primary)", outline: "none", fontFamily: "inherit", cursor: disabled ? "default" : "pointer" }}
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

const KIND_LABEL: Record<NonNullable<PassageBlock["kind"]>, string> = {
  prompt: "ĐỀ BÀI",
  essay: "BÀI LUẬN",
  paragraph: "ĐOẠN VĂN",
  draft: "BÀI NHÁP",
};

/**
 * Khung hiển thị văn bản đề — bản Part 3 của EmailView.
 * Không có header e-mail; thay vào đó là nhãn loại văn bản.
 */
function PassageView({ passage }: { passage: PassageBlock }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "1rem", background: "var(--bg-secondary)" }}>
      <div style={{ padding: "6px 12px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em" }}>
        {KIND_LABEL[passage.kind ?? "prompt"]}
        {passage.title && <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: "none" }}> · {passage.title}</span>}
      </div>
      <div style={{ padding: "11px 13px" }}>
        {passage.body.map((p, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.65rem 0 0", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{p}</p>
        ))}
      </div>
      {passage.directions && (
        <div style={{ padding: "9px 12px", borderTop: "1px solid var(--border)", background: "rgba(234,179,8,0.07)" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic" }}>
            <strong style={{ fontStyle: "normal" }}>Directions:</strong> {passage.directions}
          </p>
        </div>
      )}
    </div>
  );
}

function DirectionsBox({ text }: { text: string }) {
  return (
    <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(234,179,8,0.09)", border: "1px solid rgba(234,179,8,0.3)", marginBottom: "0.85rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic" }}>
        <strong style={{ fontStyle: "normal" }}>Directions:</strong> {text}
      </p>
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 1–4 — trắc nghiệm trên đề hoặc đoạn văn
// ─────────────────────────────────────

function McqCard({ ex, passage, onResult }: { ex: P3McqEx; passage?: PassageBlock; onResult: (score: number) => void }) {
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
      {passage && <PassageView passage={passage} />}
      <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.2rem", lineHeight: 1.55 }}>{ex.question}</p>
      {ex.multi ? (
        <p style={{ fontSize: "0.73rem", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.7rem" }}>
          Chọn nhiều đáp án · chọn sai sẽ bị trừ điểm
        </p>
      ) : (
        <div style={{ height: "0.7rem" }} />
      )}

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
              <span style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 18, flexShrink: 0 }}>{opt.id}.</span>
              <span style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{opt.text}</span>
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
// Tầng 1 & 4 — gắn chức năng cho từng câu
// ─────────────────────────────────────

function LabelingCard({ ex, passage, onResult }: { ex: P3LabelingEx; passage?: PassageBlock; onResult: (score: number) => void }) {
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
      {passage && <PassageView passage={passage} />}
      {ex.intro && <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "0.9rem", lineHeight: 1.55 }}>{ex.intro}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1rem" }}>
        {ex.sentences.map((s, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${submitted ? (picks[i] === s.label ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)") : "var(--border)"}`, paddingLeft: 12 }}>
            <p style={{ fontSize: "0.87rem", color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 6px", whiteSpace: "pre-wrap" }}>{s.text}</p>
            <Select
              value={picks[i]}
              onChange={(v) => setPicks((prev) => { const n = [...prev]; n[i] = v; return n; })}
              options={options}
              disabled={submitted}
              state={submitted ? picks[i] === s.label : undefined}
            />
            {submitted && picks[i] !== s.label && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3 }}>→ {s.label}</div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? <CheckButton onClick={submit} disabled={!allPicked} /> : <Explanation text={ex.explanation} />}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 3 easy — ghép lý do với ví dụ
// ─────────────────────────────────────

function MatchingCard({ ex, onResult }: { ex: P3MatchingEx; onResult: (score: number) => void }) {
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
      <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.9rem", lineHeight: 1.5 }}>{ex.prompt}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1rem" }}>
        {ex.pairs.map((p, i) => (
          <div key={i}>
            <div style={{ fontSize: "0.87rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: 5, lineHeight: 1.5 }}>{p.left} …</div>
            <Select
              value={picks[i]}
              onChange={(v) => setPicks((prev) => { const n = [...prev]; n[i] = v; return n; })}
              options={options}
              disabled={submitted}
              state={submitted ? picks[i] === p.right : undefined}
            />
            {submitted && picks[i] !== p.right && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>→ {p.right}</div>
            )}
          </div>
        ))}
      </div>
      {!submitted ? <CheckButton onClick={submit} disabled={!allPicked} /> : <Explanation text={ex.explanation} />}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 3 & 4 hard — dựng lại dàn ý / đoạn văn
// ─────────────────────────────────────

function OrderingCard({ ex, onResult }: { ex: P3OrderingEx; onResult: (score: number) => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const pool = seededShuffle(ex.items, ex.id);
  const remaining = pool.filter((p) => !order.includes(p));

  function correctCount(): number {
    return ex.items.filter((it, i) => order[i] === it).length;
  }

  function submit() {
    setSubmitted(true);
    onResult(Math.round((correctCount() / ex.items.length) * 100));
  }

  return (
    <div>
      <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.9rem", lineHeight: 1.55 }}>{ex.prompt}</p>

      {/* Vùng đáp án */}
      <div style={{ border: "1.5px dashed var(--border)", borderRadius: 10, padding: order.length ? "0.6rem" : "1.2rem 0.6rem", marginBottom: "0.9rem", background: "var(--bg-secondary)", minHeight: 60 }}>
        {order.length === 0 ? (
          <p style={{ margin: 0, textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>Bấm các mảnh bên dưới theo đúng thứ tự</p>
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
                  <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 16, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: "0.84rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vùng mảnh chưa dùng */}
      {!submitted && remaining.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: "1rem" }}>
          {remaining.map((item) => (
            <button
              key={item}
              onClick={() => setOrder((prev) => [...prev, item])}
              style={{ textAlign: "left", padding: "8px 11px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.84rem", lineHeight: 1.6, cursor: "pointer", fontFamily: "inherit", whiteSpace: "pre-wrap" }}
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
          <ResultBadge score={Math.round((correctCount() / ex.items.length) * 100)} />
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: "0.78rem", color: "var(--accent-primary)", cursor: "pointer", fontWeight: 600 }}>Xem thứ tự đúng</summary>
            <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {ex.items.map((it, i) => (
                <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 4, whiteSpace: "pre-wrap" }}>{it}</li>
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
// Tầng 2 medium — điền khuôn câu luận điểm
// ─────────────────────────────────────

function TypeBlankCard({ ex, onResult }: { ex: P3TypeBlankEx; onResult: (score: number) => void }) {
  const [inputs, setInputs] = useState<string[]>(ex.answers.map(() => ""));
  const [submitted, setSubmitted] = useState(false);
  const parts = ex.sentence.split("___");

  function isOk(i: number): boolean {
    return matchesAcceptedP3(inputs[i] ?? "", ex.answers[i], ex.accepted?.[i]);
  }

  function correctCount(): number {
    return ex.answers.filter((_, i) => isOk(i)).length;
  }

  function submit() {
    setSubmitted(true);
    onResult(Math.round((correctCount() / ex.answers.length) * 100));
  }

  const allFilled = inputs.every((v) => v.trim());
  const alts = ex.answers.flatMap((ans, i) => distinctAlternatives(ans, ex.accepted?.[i]));

  return (
    <div>
      {ex.prompt && <p style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "0.6rem" }}>{ex.prompt}</p>}
      {ex.vi && (
        <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginBottom: "0.9rem", lineHeight: 1.6, fontStyle: "italic" }}>{ex.vi}</p>
      )}

      <div style={{ fontSize: "0.97rem", color: "var(--text-primary)", lineHeight: 2.3, marginBottom: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
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
                style={{ width: 118, padding: "3px 8px", fontSize: "0.92rem", fontWeight: 600, border: submitted ? `1.5px solid ${isOk(i) ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)"}` : "1.5px solid var(--accent-primary)", borderRadius: 6, background: submitted ? (isOk(i) ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)") : "var(--bg-secondary)", color: "var(--text-primary)", outline: "none", textAlign: "center", fontFamily: "inherit" }}
              />
            )}
          </span>
        ))}
      </div>

      {!submitted ? (
        <CheckButton onClick={submit} disabled={!allFilled} />
      ) : (
        <div>
          <ResultBadge score={Math.round((correctCount() / ex.answers.length) * 100)} />
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.55rem 0 0" }}>
            <strong>Đáp án:</strong> {ex.answers.join(" · ")}
          </p>
          {alts.length > 0 && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "3px 0 0" }}>
              Cũng được chấp nhận: {alts.join(" · ")}
            </p>
          )}
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 2 hard — bấm vào dòng làm hỏng đoạn
// ─────────────────────────────────────

function ErrorSpotCard({ ex, onResult }: { ex: P3ErrorSpotEx; onResult: (score: number) => void }) {
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
      {ex.intro && <p style={{ fontSize: "0.87rem", color: "var(--text-secondary)", marginBottom: "0.8rem", lineHeight: 1.55 }}>{ex.intro}</p>}
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
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", minWidth: 16, flexShrink: 0, marginTop: 3 }}>{i + 1}</span>
              <span style={{ fontSize: "0.87rem", lineHeight: 1.65, flex: 1 }}>{line}</span>
              {submitted && isErr && <span style={{ flexShrink: 0, fontSize: "0.8rem" }}>✗</span>}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div>
          <ResultBadge score={picked === ex.errorIndex ? 100 : 0} />
          <p style={{ fontSize: "0.84rem", color: RED, margin: "0.55rem 0 0", fontWeight: 600 }}>
            Dòng {ex.errorIndex + 1} — {ex.errorLabel}
          </p>
          <p style={{ fontSize: "0.86rem", color: GREEN, margin: "3px 0 0", fontWeight: 600, lineHeight: 1.6 }}>
            → {ex.fix}
          </p>
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Tầng 1 hard — đề giao mấy việc, bài làm được mấy việc
// ─────────────────────────────────────

function MissionAuditCard({ ex, onResult }: { ex: P3MissionAuditEx; onResult: (score: number) => void }) {
  const [marks, setMarks] = useState<(boolean | null)[]>(ex.missions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  function correctCount(): number {
    return ex.missions.filter((m, i) => marks[i] === m.done).length;
  }

  function submit() {
    setSubmitted(true);
    onResult(Math.round((correctCount() / ex.missions.length) * 100));
  }

  const allMarked = marks.every((m) => m !== null);

  return (
    <div>
      <DirectionsBox text={ex.directions} />

      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.07em", marginBottom: 5 }}>
        BÀI NHÁP CỦA MỘT HỌC VIÊN
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", background: "var(--bg-secondary)", marginBottom: "1.1rem" }}>
        {ex.draft.map((line, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.5rem 0 0", fontSize: "0.86rem", lineHeight: 1.7, color: "var(--text-primary)" }}>{line}</p>
        ))}
      </div>

      <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.6rem" }}>
        Bài này đã làm được việc nào đề giao?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: "1rem" }}>
        {ex.missions.map((m, i) => {
          const ok = submitted && marks[i] === m.done;
          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 8, border: `1.5px solid ${submitted ? (ok ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)") : "var(--border)"}`, background: submitted ? (ok ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)") : "var(--bg-secondary)", flexWrap: "wrap" }}
            >
              <span style={{ flex: "1 1 160px", fontSize: "0.86rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{m.text}</span>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {([[true, "Đã làm"], [false, "Còn thiếu"]] as [boolean, string][]).map(([val, label]) => {
                  const sel = marks[i] === val;
                  return (
                    <button
                      key={label}
                      onClick={() => { if (!submitted) setMarks((prev) => { const n = [...prev]; n[i] = val; return n; }); }}
                      disabled={submitted}
                      style={{ padding: "4px 12px", fontSize: "0.77rem", fontWeight: 600, borderRadius: 6, border: `1.5px solid ${sel ? "var(--accent-primary)" : "var(--border)"}`, background: sel ? "rgba(59,130,246,0.14)" : "transparent", color: sel ? "var(--accent-primary)" : "var(--text-muted)", cursor: submitted ? "default" : "pointer", fontFamily: "inherit" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {submitted && !ok && (
                <span style={{ flexBasis: "100%", fontSize: "0.76rem", color: "var(--text-muted)" }}>
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
          <ResultBadge score={Math.round((correctCount() / ex.missions.length) * 100)} />
          <Explanation text={ex.explanation} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Điều phối
// ─────────────────────────────────────

function ExerciseCard({ ex, passages, onResult }: { ex: P3Exercise; passages: Record<string, PassageBlock>; onResult: (score: number) => void }) {
  switch (ex.type) {
    case "mcq": return <McqCard ex={ex} passage={ex.passageRef ? passages[ex.passageRef] : undefined} onResult={onResult} />;
    case "labeling": return <LabelingCard ex={ex} passage={ex.passageRef ? passages[ex.passageRef] : undefined} onResult={onResult} />;
    case "matching": return <MatchingCard ex={ex} onResult={onResult} />;
    case "ordering": return <OrderingCard ex={ex} onResult={onResult} />;
    case "type_blank": return <TypeBlankCard ex={ex} onResult={onResult} />;
    case "error_spot": return <ErrorSpotCard ex={ex} onResult={onResult} />;
    case "mission_audit": return <MissionAuditCard ex={ex} onResult={onResult} />;
  }
}

function ScoreBadge({ score, passed }: { score: number; passed: boolean }) {
  const color = passed ? GREEN : score >= 60 ? AMBER : RED;
  return (
    <span style={{ display: "inline-block", fontSize: "1rem", fontWeight: 700, color, background: color.replace("rgb", "rgba").replace(")", ",0.12)"), border: `1.5px solid ${color.replace("rgb", "rgba").replace(")", ",0.4)")}`, borderRadius: 8, padding: "4px 14px" }}>
      {score}%
    </span>
  );
}

// ─────────────────────────────────────
// Main
// ─────────────────────────────────────

export default function WritingPart3Client({ skillId, allTests, easyBest, mediumBest, hardBest, isTestUser, userId, passThreshold }: Props) {
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
        part: dbPartW3(skillId, difficulty),
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
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Test {activeTest} · {diffLabel[difficulty]}</div>
        <ScoreBadge score={score} passed={passed} />
        <p style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          {perfectCount}/{total} bài đúng hoàn toàn · {passed ? "Passed ✓" : `Cần ≥ ${passThreshold}% để pass`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <button onClick={() => start(activeTest, difficulty)} style={{ padding: "8px 20px", border: "1.5px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>Làm lại</button>
          <button onClick={() => setPhase("tests")} style={{ padding: "8px 20px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>← Về danh sách test</button>
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
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Test {activeTest} · {diffLabel[difficulty]} · {exerciseIdx + 1}/{total}</span>
          <button onClick={() => setPhase("tests")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}>← Thoát</button>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginBottom: "1.5rem" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent-primary)", borderRadius: 999, transition: "width 0.2s" }} />
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", background: "var(--bg-elevated)", boxShadow: "var(--shadow-sm)", marginBottom: "1rem" }}>
          <ExerciseCard key={`${activeTest}-${difficulty}-${exerciseIdx}`} ex={current} passages={testData.passages} onResult={onExResult} />
        </div>

        {answered && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setAnswered(false); advanceOrFinish(); }}
              style={{ padding: "8px 24px", border: "none", background: "var(--accent-primary)", color: "#fff", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
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
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>Test {testNum}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{test.levels[0]?.exercises.length ?? 0} bài/cấp</span>
            </div>
            {diffs.map((diff) => {
              const badge = bestMap[diff][String(testNum)];
              const scoreColor = badge ? (badge.passed ? GREEN : badge.score >= 60 ? AMBER : RED) : "var(--text-muted)";
              return (
                <div key={diff} style={{ display: "flex", alignItems: "center", padding: "0.7rem 1.2rem", borderBottom: diff !== "hard" ? "1px solid var(--border)" : "none", background: "var(--bg-primary)", gap: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", minWidth: 60 }}>{diffLabel[diff]}</span>
                  {badge ? (
                    <span style={{ fontSize: "0.78rem", color: scoreColor, fontWeight: 600 }}>{badge.score}%{badge.passed ? " ✓" : ""}</span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Chưa làm</span>
                  )}
                  <button
                    onClick={() => start(testNum, diff)}
                    style={{ marginLeft: "auto", padding: "5px 16px", border: "1.5px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
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
