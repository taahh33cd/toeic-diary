"use client";

import { useState, useEffect } from "react";
import { FS } from "@/lib/ui/scale";
import {
  type VocabWord, UNSPLASH, seededShuffle, MEMORY_PAIRS,
} from "@/lib/subskills/speaking-p2-vocab";

const GREEN = "rgb(34,197,94)";
const AMBER = "rgb(234,179,8)";

type Card = { key: string; wordId: string; side: "prompt" | "answer"; word: VocabWord };

interface Props {
  words: VocabWord[];
  label: string;
  onExit: () => void;
}

export default function MemoryGame({ words, label, onExit }: Props) {
  const [game, setGame] = useState(0);
  const [open, setOpen] = useState<string[]>([]);   // keys currently face-up
  const [matched, setMatched] = useState<string[]>([]); // wordIds already paired
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const picked = seededShuffle(words, (game + 1) * 7919).slice(0, MEMORY_PAIRS);
  const deck: Card[] = seededShuffle(
    picked.flatMap((w) => [
      { key: `${w.id}-p`, wordId: w.id, side: "prompt" as const, word: w },
      { key: `${w.id}-a`, wordId: w.id, side: "answer" as const, word: w },
    ]),
    (game + 1) * 104729,
  );

  const won = matched.length === picked.length;

  // Resolve a pair after a beat so the learner sees both faces.
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((k) => deck.find((c) => c.key === k)!);
    const isPair = a.wordId === b.wordId;
    const t = setTimeout(() => {
      if (isPair) setMatched((m) => [...m, a.wordId]);
      setOpen([]);
      setLocked(false);
    }, isPair ? 420 : 850);
    return () => clearTimeout(t);
  }, [open, deck]);

  function flip(c: Card) {
    if (locked || open.includes(c.key) || matched.includes(c.wordId)) return;
    if (open.length === 0) setMoves((m) => m + 1);
    const next = [...open, c.key];
    setOpen(next);
    // Lock here rather than in the effect: the board must freeze the instant the
    // second card turns, before the resolve timer runs.
    if (next.length === 2) setLocked(true);
  }

  function restart() {
    setGame((g) => g + 1);
    setOpen([]); setMatched([]); setMoves(0); setLocked(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        <button onClick={onExit} style={btnGhostSm}>← Thoát</button>
        <span style={{ fontSize: FS.sm, color: "var(--text-muted)" }}>Lật thẻ ghi nhớ · {label}</span>
        <span style={{ marginLeft: "auto", fontSize: FS.sm, color: "var(--text-muted)" }}>
          {matched.length}/{picked.length} cặp · {moves} lượt
        </span>
      </div>

      {won && (
        <div style={{ textAlign: "center", background: "rgba(34,197,94,0.09)", border: `1px solid rgba(34,197,94,0.35)`, borderRadius: "var(--radius-lg)", padding: "1.1rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: FS.xl }}>{moves <= picked.length + 2 ? "🏆" : "🎉"}</div>
          <div style={{ fontSize: FS.md, fontWeight: 800, color: GREEN }}>
            Ghép xong trong {moves} lượt!
          </div>
          <p style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0.3rem 0 0.9rem" }}>
            {moves <= picked.length + 2 ? "Gần như không sai lượt nào." : `Ít nhất có thể làm trong ${picked.length} lượt — thử lại xem.`}
          </p>
          <button onClick={restart} style={btnPrimary}>Bộ thẻ khác →</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.6rem" }}>
        {deck.map((c) => {
          const isOpen = open.includes(c.key) || matched.includes(c.wordId);
          const isMatched = matched.includes(c.wordId);
          return (
            <button
              key={c.key}
              onClick={() => flip(c)}
              style={{
                aspectRatio: "3 / 4", padding: 0, overflow: "hidden", cursor: isOpen ? "default" : "pointer",
                borderRadius: "var(--radius-lg)",
                border: `2px solid ${isMatched ? GREEN : isOpen ? "var(--accent-primary)" : "var(--border)"}`,
                background: isOpen ? "var(--bg-secondary)" : "var(--bg-elevated)",
                opacity: isMatched ? 0.55 : 1,
                transition: "border-color 0.2s, opacity 0.3s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {!isOpen ? (
                <span style={{ fontSize: FS.xl, opacity: 0.35 }}>❓</span>
              ) : c.side === "prompt" ? (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                  {c.word.swatch ? (
                    <>
                      <div style={{ width: "100%", flex: 1, background: c.word.swatch, minHeight: 0 }} />
                      <div style={{ padding: "0.35rem", fontSize: FS.xs, color: "var(--text-muted)" }}>{c.word.vi}</div>
                    </>
                  ) : c.word.photo ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={UNSPLASH(c.word.photo, 300)} alt="" style={{ width: "100%", flex: 1, objectFit: "contain", minHeight: 0 }} />
                      <div style={{ padding: "0.35rem", fontSize: FS.xs, color: "var(--text-muted)" }}>{c.word.vi}</div>
                    </>
                  ) : (
                    <div style={{ margin: "auto", padding: "0.5rem", fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>
                      {c.word.vi}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: "0.5rem", fontSize: FS.md, fontWeight: 800, color: "var(--accent-primary)" }}>
                  {c.word.en}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!won && (
        <button onClick={restart} style={{ ...btnGhost, marginTop: "0.9rem", borderColor: AMBER, color: AMBER }}>
          ↻ Xáo lại
        </button>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.3rem", borderRadius: 8, border: "none", background: "var(--accent-primary)",
  color: "#fff", fontSize: FS.md, fontWeight: 700, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "0.55rem 1.1rem", borderRadius: 8, border: "1.5px solid var(--border)",
  background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: FS.sm,
  fontWeight: 600, cursor: "pointer",
};
const btnGhostSm: React.CSSProperties = { ...btnGhost, padding: "4px 10px", fontSize: FS.xs, color: "var(--text-muted)" };
