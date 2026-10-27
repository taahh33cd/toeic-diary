"use client";

import { FS } from "@/lib/ui/scale";
import type { SentenceAssess } from "@/lib/subskills/sentence-sprint/types";
import { card, scoreColor } from "./shell";

const LABELS: { key: keyof SentenceAssess["criteria"]; label: string }[] = [
  { key: "usage", label: "Dùng đúng từ" },
  { key: "grammar", label: "Ngữ pháp" },
  { key: "fit", label: "Khớp tình huống" },
  { key: "natural", label: "Tự nhiên" },
];

/** Kết quả AI chấm một câu — dùng chung cho nhánh Viết và nhánh Nói. */
export function AssessPanel({
  result,
  model,
  words,
}: {
  result: SentenceAssess;
  model: string;
  words: string[];
}) {
  const missing = words.filter((w) => !result.usedWords.includes(w));
  return (
    <div style={{ ...card, marginBottom: "1rem", borderColor: scoreColor(result.score) }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: FS.lg, fontWeight: 800, color: scoreColor(result.score) }}>{result.score}</span>
        <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>/100</span>
        {missing.length > 0 && (
          <span style={{ fontSize: FS.xs, color: "rgb(239,68,68)" }}>
            Chưa dùng: {missing.join(", ")}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "0.85rem" }}>
        {LABELS.map(({ key, label }) => {
          const v = result.criteria[key];
          return (
            <div key={key} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.45rem 0.6rem" }}>
              <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginBottom: "0.2rem" }}>{label}</div>
              <div style={{ fontSize: FS.sm, fontWeight: 700, color: scoreColor(v * 4) }}>{v}/25</div>
            </div>
          );
        })}
      </div>

      {result.feedback && (
        <p style={{ margin: "0 0 0.6rem", fontSize: FS.sm, color: "var(--text-primary)" }}>{result.feedback}</p>
      )}

      {result.corrected && (
        <p style={{ margin: "0 0 0.6rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>Sửa lại: </strong>
          {result.corrected}
        </p>
      )}

      <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)" }}>
        <strong>Câu mẫu: </strong>
        {model}
      </p>
    </div>
  );
}
