"use client";

import { useState } from "react";
import { SAMPLE_PAIRS, type P3SamplePair } from "@/lib/subskills/writing-part3/samples";
import { P3_ESSAY_TYPES, countWords } from "@/lib/subskills/writing-part3";
import { FS } from "@/lib/ui/scale";

const GREEN = "rgb(34,197,94)";
const AMBER = "rgb(234,179,8)";

function EssayColumn({
  band,
  paras,
  highlight,
}: {
  band: 3 | 5;
  paras: string[];
  highlight: boolean;
}) {
  const color = band === 5 ? GREEN : AMBER;
  const words = countWords(paras.join(" "));
  return (
    <div
      style={{
        flex: "1 1 340px",
        minWidth: 0,
        border: `1.5px solid ${highlight ? color.replace("rgb", "rgba").replace(")", ",0.5)") : "var(--border)"}`,
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        style={{
          padding: "8px 13px",
          borderBottom: "1px solid var(--border)",
          background: highlight ? color.replace("rgb", "rgba").replace(")", ",0.1)") : "var(--bg-elevated)",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span style={{ fontSize: FS.sm, fontWeight: 800, color }}>Mức {band}/5</span>
        <span style={{ marginLeft: "auto", fontSize: FS.xs, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {words} từ
        </span>
      </div>
      <div style={{ padding: "12px 15px" }}>
        {paras.map((p, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : "0.75rem 0 0", fontSize: FS.sm, lineHeight: 1.85, color: "var(--text-primary)" }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function PairView({ pair, onBack }: { pair: P3SamplePair; onBack: () => void }) {
  const [focus, setFocus] = useState<3 | 5 | null>(null);
  const meta = P3_ESSAY_TYPES.find((t) => t.id === pair.essayType)!;

  return (
    <div>
      <button
        onClick={onBack}
        style={{ marginBottom: "1rem", padding: "5px 12px", fontSize: FS.xs, fontWeight: 600, borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
      >
        ← Chọn cặp khác
      </button>

      {/* Đề chung của cả hai bài */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--bg-secondary)", marginBottom: "1.1rem" }}>
        <div style={{ padding: "7px 13px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: FS.xs, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)" }}>CẢ HAI BÀI CÙNG TRẢ LỜI ĐỀ NÀY</span>
          <span style={{ fontSize: FS.xs, fontWeight: 700, color: "var(--accent-primary)", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 5, padding: "1px 8px" }}>
            {meta.labelVi}
          </span>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: FS.sm, lineHeight: 1.75, color: "var(--text-primary)" }}>{pair.prompt}</p>
        </div>
      </div>

      {/* Nút soi từng bài */}
      <div style={{ display: "flex", gap: 6, marginBottom: "0.9rem", flexWrap: "wrap" }}>
        {([null, 3, 5] as const).map((b) => {
          const on = focus === b;
          const label = b === null ? "Xem song song" : `Chỉ soi bài mức ${b}`;
          return (
            <button
              key={String(b)}
              onClick={() => setFocus(b)}
              style={{ padding: "5px 13px", fontSize: FS.xs, fontWeight: 600, borderRadius: 999, border: `1.5px solid ${on ? "var(--accent-primary)" : "var(--border)"}`, background: on ? "rgba(59,130,246,0.12)" : "transparent", color: on ? "var(--accent-primary)" : "var(--text-muted)", cursor: "pointer", fontFamily: "inherit" }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1.4rem", alignItems: "flex-start" }}>
        {focus !== 5 && <EssayColumn band={3} paras={pair.band3} highlight={focus === 3} />}
        {focus !== 3 && <EssayColumn band={5} paras={pair.band5} highlight={focus === 5} />}
      </div>

      {/* Khoảng cách theo từng trục */}
      <p style={{ fontSize: FS.xs, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 7 }}>
        HAI BÀI KHÁC NHAU Ở ĐÂU
      </p>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: "1.2rem" }}>
        {pair.gaps.map((g, i) => (
          <div
            key={g.axis}
            style={{ padding: "12px 14px", background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", borderBottom: i < pair.gaps.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div style={{ fontSize: FS.sm, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{g.axis}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <p style={{ flex: "1 1 260px", margin: 0, fontSize: FS.xs, lineHeight: 1.65, color: "var(--text-secondary)", borderLeft: `3px solid ${AMBER.replace("rgb", "rgba").replace(")", ",0.5)")}`, paddingLeft: 10 }}>
                <strong style={{ color: AMBER }}>Mức 3 —</strong> {g.band3}
              </p>
              <p style={{ flex: "1 1 260px", margin: 0, fontSize: FS.xs, lineHeight: 1.65, color: "var(--text-secondary)", borderLeft: `3px solid ${GREEN.replace("rgb", "rgba").replace(")", ",0.5)")}`, paddingLeft: 10 }}>
                <strong style={{ color: GREEN }}>Mức 5 —</strong> {g.band5}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderLeft: "3px solid var(--accent-primary)", background: "rgba(59,130,246,0.07)", borderRadius: "0 8px 8px 0", padding: "12px 15px" }}>
        <p style={{ margin: 0, fontSize: FS.sm, lineHeight: 1.7, color: "var(--text-primary)" }}>{pair.takeaway}</p>
      </div>
    </div>
  );
}

export default function WritingP3SamplesClient() {
  const [pairId, setPairId] = useState<string | null>(null);
  const pair = SAMPLE_PAIRS.find((p) => p.id === pairId);

  if (pair) return <PairView pair={pair} onBack={() => setPairId(null)} />;

  return (
    <div>
      <div style={{ padding: "11px 14px", marginBottom: "1.2rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <p style={{ margin: 0, fontSize: FS.sm, lineHeight: 1.7, color: "var(--text-secondary)" }}>
          Mỗi cặp là <strong style={{ color: "var(--text-primary)" }}>hai bài trả lời cùng một đề</strong>, một bài mức 3 và một bài mức 5.
          Bài mức 3 được viết cố ý <strong style={{ color: "var(--text-primary)" }}>gần như không có lỗi ngữ pháp nào</strong> — đó chính là bài học.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1.65 }}>
          ETS mô tả mức 3 là «đúng nhưng hạn hẹp về cấu trúc câu và từ vựng». Nghĩa là sạch lỗi thôi chưa đủ để lên mức 4.
          Hai khái niệm khó nhất — «cụ thể hơn» và «đa dạng hơn» — gần như không định nghĩa nổi bằng lời, phải nhìn cạnh nhau mới thấy.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        {SAMPLE_PAIRS.map((p, i) => {
          const meta = P3_ESSAY_TYPES.find((t) => t.id === p.essayType)!;
          return (
            <button
              key={p.id}
              onClick={() => setPairId(p.id)}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 15px", background: i % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)", border: "none", borderBottom: i < SAMPLE_PAIRS.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>{meta.labelVi}</div>
              </div>
              <span style={{ flexShrink: 0, fontSize: FS.sm, color: "var(--accent-primary)", marginTop: 4 }}>→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
