"use client";

import { useState } from "react";
import {
  type Difficulty,
  checkProduce,
  maskPhrase,
  produceTarget,
  HARD_MIN_WORDS,
} from "@/lib/subskills/speaking-p2-steps";

function PhraseList({ phrases }: { phrases: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {phrases.map((b) => (
        <span key={b} style={{ fontSize: "0.87rem", padding: "3px 9px", borderRadius: 6, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
          {b}
        </span>
      ))}
    </div>
  );
}

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";
const AMBER = "rgb(234,179,8)";

interface Props {
  bank: string[];
  difficulty: Difficulty;
  prompt: string;
  placeholder: string;
  found: string[];
  revealed: boolean;
  done: boolean;
  onFound: (phrase: string) => void;
  onReveal: () => void;
}

export function ProduceStepPanel({
  bank, difficulty, prompt, placeholder, found, revealed, done, onFound, onReveal,
}: Props) {
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "warn" } | null>(null);

  const target = produceTarget(difficulty);
  const remaining = Math.max(0, target - found.length);
  const isHard = difficulty === "hard";

  function submit() {
    const raw = input.trim();
    if (!raw || revealed) return;
    const verdict = checkProduce(bank, raw, difficulty, found);

    if (verdict.ok) {
      onFound(verdict.matched);
      setInput("");
      setMsg({ text: `✓ "${verdict.matched}" — chuẩn rồi!`, tone: "ok" });
      return;
    }
    if (verdict.reason === "duplicate") {
      setMsg({ text: "Ý này bạn đã nêu rồi — thử một ý khác nhé.", tone: "warn" });
      return;
    }
    if (verdict.reason === "short") {
      setMsg({ text: `Mức Hard cần câu hoàn chỉnh (ít nhất ${HARD_MIN_WORDS} từ), không phải cụm rời.`, tone: "warn" });
      return;
    }
    setMsg({ text: "Chưa có trong danh sách gợi ý. Nhìn kỹ lại ảnh và thử cách diễn đạt khác.", tone: "bad" });
  }

  // Entries the learner has not produced yet — the source for hints and the reveal list.
  const notFound = bank.filter((b) => !found.includes(b));

  return (
    <div>
      <p style={{ fontSize: "1.05rem", color: "var(--text-primary)", margin: "0 0 0.3rem", lineHeight: 1.55 }}>
        {prompt}
      </p>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 0.85rem" }}>
        {isHard
          ? `Viết ${target} câu hoàn chỉnh, mỗi lần một câu.`
          : `Gõ ${target} cụm từ, mỗi lần một cụm.`}{" "}
        {revealed
          ? "Đã xem đáp án."
          : done
            ? "✓ Đủ chỉ tiêu — nghĩ thêm được ý nào càng tốt."
            : `Còn ${remaining}.`}
      </p>

      {/* Những gì học viên đã nêu ra */}
      {found.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "0.8rem" }}>
          {found.map((f) => (
            <span key={f} style={{ fontSize: "0.85rem", padding: "4px 10px", borderRadius: 999, background: "rgba(34,197,94,0.12)", border: `1px solid rgba(34,197,94,0.4)`, color: GREEN, fontWeight: 600 }}>
              ✓ {f}
            </span>
          ))}
        </div>
      )}

      {!revealed && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.6rem" }}>
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); setMsg(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder={placeholder}
              style={{ flex: "1 1 240px", padding: "0.6rem 0.85rem", borderRadius: 8, fontSize: "1rem", border: "1.5px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)" }}
            />
            <button onClick={submit} disabled={!input.trim()}
              style={{ padding: "0.55rem 1.3rem", borderRadius: 8, border: "none", background: input.trim() ? "var(--accent-primary)" : "var(--bg-elevated)", color: input.trim() ? "#fff" : "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600, cursor: input.trim() ? "pointer" : "not-allowed" }}>
              Thêm
            </button>
          </div>

          {msg && (
            <p style={{ margin: "0 0 0.7rem", fontSize: "0.87rem", lineHeight: 1.55, color: msg.tone === "ok" ? GREEN : msg.tone === "warn" ? AMBER : RED }}>
              {msg.text}
            </p>
          )}

          {/* Medium được gợi ý chữ cái đầu; Hard thì không. */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isHard && !revealed && notFound.length > 0 && (
              <details style={{ fontSize: "0.85rem" }}>
                <summary style={{ cursor: "pointer", color: "var(--accent-primary)", fontWeight: 600 }}>
                  Gợi ý chữ cái đầu
                </summary>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {notFound.slice(0, 6).map((b) => (
                    <span key={b} style={{ fontSize: "0.85rem", padding: "3px 9px", borderRadius: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      {maskPhrase(b)}
                    </span>
                  ))}
                </div>
              </details>
            )}
            <button onClick={onReveal}
              style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer" }}>
              {done ? "Xem toàn bộ đáp án" : "Bỏ qua — xem đáp án"}
            </button>
          </div>
        </>
      )}

      {/* Ngân hàng từ. Bỏ qua giữa chừng → mở luôn; tự đạt chỉ tiêu → thu gọn để còn chỗ nghĩ tiếp. */}
      {revealed && notFound.length > 0 && (
        <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 8, padding: "0.85rem 1rem", marginTop: "0.4rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.45rem" }}>
            Các cách nói khác cho bước này
          </div>
          <PhraseList phrases={notFound} />
        </div>
      )}
      {!revealed && done && notFound.length > 0 && (
        <details style={{ marginTop: "0.7rem", fontSize: "0.85rem" }}>
          <summary style={{ cursor: "pointer", color: "var(--accent-primary)", fontWeight: 600 }}>
            Các cách nói khác cho bước này ({notFound.length})
          </summary>
          <div style={{ marginTop: "0.5rem" }}>
            <PhraseList phrases={notFound} />
          </div>
        </details>
      )}
    </div>
  );
}
