"use client";

import { useState } from "react";
import { type VocabWord, UNSPLASH } from "@/lib/subskills/speaking-p2-vocab";
import { FS } from "@/lib/ui/scale";

const GREEN = "rgb(34,197,94)";
const AMBER = "rgb(234,179,8)";

interface Props {
  words: VocabWord[];
  label: string;
  onExit: () => void;
  onDone: () => void;
}

export default function FlashcardDeck({ words, label, onExit, onDone }: Props) {
  // Weak cards go to the back of the queue, so a run ends only when everything landed.
  const [queue, setQueue] = useState<VocabWord[]>(words);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState<string[]>([]);
  const [again, setAgain] = useState(0);

  const card = queue[0];
  const done = learned.length;

  function mark(known: boolean) {
    if (!card) return;
    setFlipped(false);
    if (known) {
      setLearned((l) => [...l, card.id]);
      setQueue((q) => q.slice(1));
    } else {
      setAgain((n) => n + 1);
      setQueue((q) => [...q.slice(1), q[0]]);
    }
  }

  if (!card) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)" }}>
        <div style={{ fontSize: FS.xl }}>🎓</div>
        <div style={{ fontSize: FS.lg, fontWeight: 800, color: GREEN, marginTop: "0.3rem" }}>
          Xong {words.length} thẻ!
        </div>
        <p style={{ fontSize: FS.sm, color: "var(--text-muted)", margin: "0.4rem 0 1.2rem" }}>
          {again > 0 ? `Bạn đã lật lại ${again} lần — giờ thử phản xạ xem nhớ được bao nhiêu.` : "Không phải lật lại lần nào. Sang phần luyện phản xạ thôi!"}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onExit} style={btnGhost}>← Về danh sách</button>
          <button onClick={onDone} style={btnPrimary}>Luyện phản xạ →</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
        <button onClick={onExit} style={btnGhostSm}>← Thoát</button>
        <span style={{ fontSize: FS.sm, color: "var(--text-muted)" }}>Học thẻ · {label}</span>
        <span style={{ marginLeft: "auto", fontSize: FS.sm, color: "var(--text-muted)" }}>
          {done}/{words.length} thuộc
        </span>
      </div>

      <div style={{ height: 6, borderRadius: 999, background: "var(--border)", overflow: "hidden", marginBottom: "1rem" }}>
        <div style={{ height: "100%", width: `${(done / words.length) * 100}%`, background: GREEN, transition: "width 0.3s" }} />
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        style={{
          width: "100%", padding: 0, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
          background: "var(--bg-secondary)", cursor: "pointer", overflow: "hidden", display: "block", textAlign: "center",
        }}
      >
        {card.swatch ? (
          <div style={{ width: "100%", height: 240, background: card.swatch }} />
        ) : card.photo ? (
          // contain, never cover: a cropped garment is exactly what the card must not show.
          <div style={{ width: "100%", height: 260, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={UNSPLASH(card.photo, 700)} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
          </div>
        ) : null}
        <div style={{ padding: "1.6rem 1.3rem", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.5rem" }}>
          {!flipped ? (
            <>
              <div style={{ fontSize: FS.lg, fontWeight: 800, color: "var(--text-primary)" }}>{card.vi}</div>
              <div style={{ fontSize: FS.sm, color: "var(--text-muted)" }}>Bấm để xem tiếng Anh</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: FS.xl, fontWeight: 800, color: "var(--accent-primary)" }}>{card.en}</div>
              <div style={{ fontSize: FS.md, color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                “{card.example}”
              </div>
              {card.forms.length > 0 && (
                <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
                  cũng chấp nhận: {card.forms.join(", ")}
                </div>
              )}
            </>
          )}
        </div>
      </button>

      {flipped && (
        <div style={{ display: "flex", gap: 8, marginTop: "0.9rem" }}>
          <button onClick={() => mark(false)} style={{ ...btnGhost, flex: 1, borderColor: AMBER, color: AMBER }}>
            Còn yếu — cho gặp lại
          </button>
          <button onClick={() => mark(true)} style={{ ...btnPrimary, flex: 1, background: GREEN }}>
            Đã thuộc ✓
          </button>
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "0.65rem 1.3rem", borderRadius: 8, border: "none", background: "var(--accent-primary)",
  color: "#fff", fontSize: FS.md, fontWeight: 700, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "0.65rem 1.2rem", borderRadius: 8, border: "1.5px solid var(--border)",
  background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: FS.sm,
  fontWeight: 600, cursor: "pointer",
};
const btnGhostSm: React.CSSProperties = { ...btnGhost, padding: "4px 10px", fontSize: FS.xs, color: "var(--text-muted)" };
