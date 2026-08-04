"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  type ScanPoolId, type VocabWord,
  SCAN_POOLS, getScanPool, scanPictures, matchTypedWord, seededShuffle, SCAN_SECONDS,
} from "@/lib/subskills/speaking-p2-vocab";

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";
const AMBER = "rgb(234,179,8)";

type Phase = "ready" | "playing" | "over";

interface Props {
  pool: ScanPoolId;
  userId: string | null;
  onExit: () => void;
}

export default function ScanGame({ pool, userId, onExit }: Props) {
  const meta = SCAN_POOLS.find((p) => p.id === pool)!;
  // Rounds are picked deterministically so server and client render the same first screen.
  const rounds = seededShuffle(scanPictures(getScanPool(pool)), pool.length * 977);

  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState(SCAN_SECONDS);
  const [found, setFound] = useState<VocabWord[]>([]);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<"hit" | "miss" | "dupe" | null>(null);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = rounds[round % rounds.length];

  // The running score has to be readable from the end-of-round timer without
  // making that timer depend on every keystroke.
  const foundRef = useRef<VocabWord[]>([]);
  useEffect(() => { foundRef.current = found; }, [found]);

  const saveScore = useCallback((hits: number, total: number) => {
    if (!userId || total === 0) return;
    fetch("/api/subskills/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        part: "sp2-tu-vung-scan",
        questionWord: pool,
        exerciseIndex: 0,
        score: Math.round((hits / total) * 100),
        passed: hits >= Math.ceil(total * 0.6),
      }),
    }).catch(() => { /* điểm chỉ để vui, mất cũng không sao */ });
  }, [userId, pool]);

  // ── countdown ─────────────────────────────────────────────
  const wordCount = current?.words.length ?? 0;
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    const end = setTimeout(() => {
      const hits = foundRef.current.length;
      setPhase("over");
      setBest((b) => Math.max(b, hits));
      saveScore(hits, wordCount);
    }, SCAN_SECONDS * 1000);
    return () => { clearInterval(tick); clearTimeout(end); };
  }, [phase, wordCount, saveScore]);

  // ── play ──────────────────────────────────────────────────
  function start() {
    setPhase("playing");
    setLeft(SCAN_SECONDS);
    setFound([]);
    setInput("");
    setCombo(0);
    setFlash(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function nextRound() {
    setRound((r) => r + 1);
    setPhase("ready");
  }

  function submit() {
    if (phase !== "playing" || !current) return;
    const raw = input.trim();
    if (!raw) return;
    setInput("");

    const hit = matchTypedWord(current.words, raw);
    if (!hit) {
      // Might be a real word, just not visible in this photo — say so, it teaches more.
      const elsewhere = matchTypedWord(getScanPool(pool), raw);
      setFlash(elsewhere ? "miss" : "miss");
      setCombo(0);
      return;
    }
    if (found.some((f) => f.id === hit.id)) {
      setFlash("dupe");
      return;
    }
    setFound((f) => [...f, hit]);
    setCombo((c) => c + 1);
    setFlash("hit");
  }

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 550);
    return () => clearTimeout(t);
  }, [flash, found.length]);

  if (!current) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        Chưa có ảnh nào đủ từ cho nhóm này.
        <button onClick={onExit} style={btnGhost}>← Quay lại</button>
      </div>
    );
  }

  const total = current.words.length;
  const pct = total ? (found.length / total) * 100 : 0;
  const timePct = (left / SCAN_SECONDS) * 100;
  const missed = current.words.filter((w) => !found.some((f) => f.id === w.id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        <button onClick={onExit} style={btnGhost}>← Thoát</button>
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {meta.icon} Quét ảnh · {meta.label} · Lượt {round + 1}
        </span>
        {best > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: AMBER, fontWeight: 700 }}>
            ★ Kỷ lục {best} từ
          </span>
        )}
      </div>

      {/* Timer bar */}
      <div style={{ height: 8, borderRadius: 999, background: "var(--border)", overflow: "hidden", marginBottom: "0.9rem" }}>
        <div style={{
          height: "100%", width: `${phase === "playing" ? timePct : 100}%`,
          background: left <= 10 && phase === "playing" ? RED : "var(--accent-primary)",
          transition: "width 1s linear",
        }} />
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ position: "relative", background: "var(--bg-elevated)", display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.item.image} alt="" style={{ maxWidth: "100%", height: "auto", display: "block", filter: phase === "ready" ? "blur(14px)" : "none" }} />
          {phase === "ready" && (
            <div style={overlay}>
              <div style={{ fontSize: "2.6rem", marginBottom: "0.4rem" }}>{meta.icon}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", marginBottom: "0.3rem", textAlign: "center", padding: "0 1rem" }}>
                {meta.ask}
              </div>
              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "1rem" }}>
                {SCAN_SECONDS} giây · có {total} từ trong ảnh này
              </div>
              <button onClick={start} style={btnPrimaryBig}>Bắt đầu →</button>
            </div>
          )}
          {phase === "playing" && (
            <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.55)", color: "#fff", padding: "3px 12px", borderRadius: 999, fontSize: "1.05rem", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {Math.max(0, left)}s
            </div>
          )}
          {phase === "playing" && combo >= 3 && (
            <div style={{ position: "absolute", top: 10, left: 12, background: AMBER, color: "#000", padding: "3px 12px", borderRadius: 999, fontSize: "0.85rem", fontWeight: 800 }}>
              🔥 {combo} liên tiếp
            </div>
          )}
        </div>

        <div style={{ padding: "1.1rem 1.3rem" }}>
          {phase === "playing" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: "0.7rem" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                  placeholder="Gõ một từ rồi Enter…"
                  autoComplete="off"
                  style={{
                    flex: 1, minWidth: 0, padding: "0.65rem 0.9rem", borderRadius: 8, fontSize: "1.05rem",
                    background: "var(--bg-elevated)", color: "var(--text-primary)",
                    border: `2px solid ${flash === "hit" ? GREEN : flash === "miss" ? RED : flash === "dupe" ? AMBER : "var(--border)"}`,
                    transition: "border-color 0.15s",
                  }}
                />
                <button onClick={submit} style={btnPrimary}>Gõ</button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem" }}>
                <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: GREEN, transition: "width 0.25s" }} />
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {found.length}/{total}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 32 }}>
                {found.map((w) => (
                  <span key={w.id} style={chipGreen}>✓ {w.en}</span>
                ))}
              </div>
            </>
          )}

          {phase === "over" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem" }}>{pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "💪"}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: pct >= 50 ? GREEN : "var(--text-primary)" }}>
                {found.length}/{total}
              </div>
              <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", margin: "0.3rem 0 1rem" }}>
                {pct >= 80 ? "Phản xạ rất nhanh!" : pct >= 50 ? "Khá ổn — làm lại sẽ nhanh hơn." : "Ôn lại thẻ rồi quay lại nhé."}
              </p>

              {found.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: "0.9rem" }}>
                  {found.map((w) => <span key={w.id} style={chipGreen}>✓ {w.en}</span>)}
                </div>
              )}

              {missed.length > 0 && (
                <div style={{ textAlign: "left", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "0.8rem 1rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: RED, marginBottom: "0.45rem" }}>
                    Bỏ sót {missed.length} từ
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {missed.map((w) => (
                      <div key={w.id} style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        <b>{w.en}</b> <span style={{ color: "var(--text-muted)" }}>— {w.vi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={start} style={btnGhost}>↻ Ảnh này lần nữa</button>
                <button onClick={nextRound} style={btnPrimary}>Ảnh khác →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── styles ──────────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)",
};
const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.3rem", borderRadius: 8, border: "none", background: "var(--accent-primary)",
  color: "#fff", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer",
};
const btnPrimaryBig: React.CSSProperties = { ...btnPrimary, padding: "0.7rem 2rem", fontSize: "1rem" };
const btnGhost: React.CSSProperties = {
  padding: "0.55rem 1.1rem", borderRadius: 8, border: "1.5px solid var(--border)",
  background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.88rem",
  fontWeight: 600, cursor: "pointer",
};
const chipGreen: React.CSSProperties = {
  fontSize: "0.86rem", padding: "4px 10px", borderRadius: 999, fontWeight: 600,
  background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.42)", color: GREEN,
};
