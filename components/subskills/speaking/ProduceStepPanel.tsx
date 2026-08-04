"use client";

import { useState } from "react";
import {
  type Difficulty,
  checkProduce,
  splitProduceInput,
  maskPhrase,
  produceTarget,
  HARD_MIN_WORDS,
} from "@/lib/subskills/speaking-p2-steps";

const REJECT_REASON: Record<"short" | "duplicate" | "unknown" | "close", string> = {
  short: `cần câu hoàn chỉnh ít nhất ${HARD_MIN_WORDS} từ`,
  duplicate: "ý này bạn đã nêu rồi",
  close: "gần đúng, sai một chi tiết — nhìn kỹ lại ảnh",
  unknown: "chưa có trong danh sách gợi ý",
};

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
  step: 1 | 2 | 3;
  prompt: string;
  placeholder: string;
  found: string[];
  revealed: boolean;
  done: boolean;
  onFound: (phrase: string) => void;
  onReveal: () => void;
}

export function ProduceStepPanel({
  bank, difficulty, step, prompt, placeholder, found, revealed, done, onFound, onReveal,
}: Props) {
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "warn" } | null>(null);

  const target = produceTarget(difficulty, step);
  const remaining = Math.max(0, target - found.length);
  const isHard = difficulty === "hard";

  function submit() {
    const raw = input.trim();
    if (!raw || revealed) return;

    // The learner may enter several answers at once, so grade each and report per answer.
    const parts = splitProduceInput(raw, difficulty);
    const accepted: string[] = [];
    const rejected: string[] = [];
    const leftover: string[] = [];
    const seen = [...found];

    for (const part of parts) {
      const verdict = checkProduce(bank, part, difficulty, seen);
      if (verdict.ok) {
        accepted.push(verdict.matched);
        seen.push(verdict.matched);
        onFound(verdict.matched);
      } else {
        rejected.push(`"${part}" — ${REJECT_REASON[verdict.reason]}`);
        leftover.push(part);
      }
    }

    // Keep only what did not land, so the learner can fix it without retyping the rest.
    setInput(leftover.join(difficulty === "hard" ? ". " : ", "));
    if (accepted.length > 0 && rejected.length === 0) {
      setMsg({ text: `✓ ${accepted.map((a) => `"${a}"`).join(", ")} — chuẩn rồi!`, tone: "ok" });
    } else if (accepted.length > 0) {
      setMsg({ text: `✓ Nhận ${accepted.length} ý. Còn lại: ${rejected.join(" · ")}`, tone: "warn" });
    } else {
      setMsg({ text: rejected.join(" · "), tone: "bad" });
    }
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
          ? `Viết ${target} câu hoàn chỉnh — nhiều câu một lượt cũng được, ngăn bằng dấu chấm.`
          : `Gõ ${target} cụm từ — nhiều cụm một lượt cũng được, ngăn bằng dấu phẩy.`}{" "}
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
