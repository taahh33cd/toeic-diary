"use client";

import { useState } from "react";
import {
  type VocabGroupId, type ScanPoolId,
  VOCAB_GROUPS, SCAN_POOLS, getVocabGroup, groupLabel,
} from "@/lib/subskills/speaking-p2-vocab";
import FlashcardDeck from "./FlashcardDeck";
import MemoryGame from "./MemoryGame";
import ScanGame from "./ScanGame";
import { FS } from "@/lib/ui/scale";

type View =
  | { mode: "hub" }
  | { mode: "flash"; group: VocabGroupId }
  | { mode: "memory"; group: VocabGroupId }
  | { mode: "scan"; pool: ScanPoolId };

/** Which scan pool a study group feeds into, for the "học xong → luyện luôn" hand-off. */
const POOL_OF: Record<VocabGroupId, ScanPoolId> = {
  "clothing-items": "clothing",
  "clothing-style": "clothing",
  "action-posture": "action",
  "action-object": "action",
};

export default function VocabClient({ userId }: { userId: string | null }) {
  const [view, setView] = useState<View>({ mode: "hub" });
  const hub = () => setView({ mode: "hub" });

  if (view.mode === "flash") {
    return (
      <FlashcardDeck
        words={getVocabGroup(view.group)}
        label={groupLabel(view.group)}
        onExit={hub}
        onDone={() => setView({ mode: "scan", pool: POOL_OF[view.group] })}
      />
    );
  }
  if (view.mode === "memory") {
    return <MemoryGame words={getVocabGroup(view.group)} label={groupLabel(view.group)} onExit={hub} />;
  }
  if (view.mode === "scan") {
    return <ScanGame pool={view.pool} userId={userId} onExit={hub} />;
  }

  return (
    <div>
      {/* Bước 1 — học */}
      <div style={sectionHead}>
        <span style={stepBadge}>1</span> Học thẻ trước
      </div>
      <p style={sectionNote}>
        Lật thẻ xem nghĩa, tự đánh dấu <b>Đã thuộc</b> hay <b>Còn yếu</b>. Từ còn yếu quay lại cuối xấp cho tới khi thuộc hết.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.7rem", marginBottom: "1.8rem" }}>
        {VOCAB_GROUPS.map((g) => (
          <div key={g.id} style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: FS.lg }}>{g.icon}</span>
              <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>{g.label}</span>
            </div>
            <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.7rem" }}>
              {getVocabGroup(g.id).length} từ · {g.hint}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setView({ mode: "flash", group: g.id })} style={btnPrimarySm}>Học thẻ</button>
              <button onClick={() => setView({ mode: "memory", group: g.id })} style={btnGhostSm}>🃏 Lật thẻ ghi nhớ</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bước 2 — phản xạ */}
      <div style={sectionHead}>
        <span style={stepBadge}>2</span> Luyện phản xạ 45 giây
      </div>
      <p style={sectionNote}>
        Một bức ảnh Part 2 thật, đồng hồ đếm ngược. Gõ được càng nhiều từ càng tốt — hết giờ sẽ chỉ ra những từ bạn bỏ sót.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.7rem" }}>
        {SCAN_POOLS.map((p) => (
          <button key={p.id} onClick={() => setView({ mode: "scan", pool: p.id })}
            style={{ ...card, cursor: "pointer", textAlign: "left", borderColor: "var(--accent-primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: FS.lg }}>{p.icon}</span>
              <span style={{ fontSize: FS.md, fontWeight: 700, color: "var(--accent-primary)" }}>
                Quét ảnh · {p.label}
              </span>
            </div>
            <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{p.ask}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, fontSize: FS.md, fontWeight: 800,
  color: "var(--text-primary)", marginBottom: "0.3rem",
};
const stepBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22,
  borderRadius: 999, background: "var(--accent-primary)", color: "#fff", fontSize: FS.xs, fontWeight: 800,
};
const sectionNote: React.CSSProperties = {
  fontSize: FS.sm, color: "var(--text-muted)", margin: "0 0 0.9rem", lineHeight: 1.6,
};
const card: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
  background: "var(--bg-secondary)", padding: "0.9rem 1rem",
};
const btnPrimarySm: React.CSSProperties = {
  padding: "0.4rem 1rem", borderRadius: 7, border: "none", background: "var(--accent-primary)",
  color: "#fff", fontSize: FS.sm, fontWeight: 700, cursor: "pointer",
};
const btnGhostSm: React.CSSProperties = {
  padding: "0.4rem 0.9rem", borderRadius: 7, border: "1.5px solid var(--border)",
  background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: FS.sm,
  fontWeight: 600, cursor: "pointer",
};
