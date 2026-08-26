"use client";

import { useState } from "react";
import { IPA_CHART, type Phoneme, type PhonemeGroupKey } from "@/lib/subskills/ipa/chart";
import { playPhoneme, speechAvailable } from "@/lib/subskills/ipa/audio";
import { FS } from "@/lib/ui/scale";

/** Render the example word with its sound-carrying letters bolded. */
function HighlightedWord({ word, highlight }: { word: string; highlight: string }) {
  const idx = word.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <>{word}</>;
  return (
    <>
      {word.slice(0, idx)}
      <strong style={{ color: "var(--accent-primary)" }}>{word.slice(idx, idx + highlight.length)}</strong>
      {word.slice(idx + highlight.length)}
    </>
  );
}

export function PhonemicChart() {
  const [selected, setSelected] = useState<(Phoneme & { group: PhonemeGroupKey }) | null>(null);
  const canSpeak = speechAvailable();

  function handleClick(p: Phoneme, group: PhonemeGroupKey) {
    setSelected({ ...p, group });
    void playPhoneme(p.word);
  }

  function practice(group: PhonemeGroupKey) {
    document.getElementById(`ex-${group}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      {IPA_CHART.map((g) => (
        <div key={g.key} style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: FS.xs, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
            {g.label}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {g.phonemes.map((p) => {
              const active = selected?.id === p.id && selected.group === g.key;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleClick(p, g.key)}
                  aria-label={`Phát âm ${p.symbol} như trong ${p.word}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.15rem",
                    padding: "0.5rem 0.25rem",
                    borderRadius: "var(--radius-md, 8px)",
                    border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border)"}`,
                    background: active ? "rgba(59,130,246,0.1)" : "var(--bg-elevated)",
                    cursor: "pointer",
                    transition: "border-color 0.12s, background 0.12s",
                  }}
                >
                  <span style={{ fontSize: FS.lg, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{p.symbol}</span>
                  <span style={{ fontSize: FS.xs, color: "var(--text-muted)", lineHeight: 1 }}>
                    <HighlightedWord word={p.word} highlight={p.highlight} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Detail panel */}
      {selected && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: FS.xl, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{selected.symbol}</span>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: FS.md, color: "var(--text-primary)", fontWeight: 600 }}>
              <HighlightedWord word={selected.word} highlight={selected.highlight} />
            </div>
            {!canSpeak && (
              <div style={{ fontSize: FS.xs, color: "var(--text-muted)", marginTop: 2 }}>
                Trình duyệt không phát được âm — audio thật sẽ có sau.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void playPhoneme(selected.word)}
            style={{ padding: "0.45rem 0.9rem", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: FS.sm, cursor: "pointer" }}
          >
            🔊 Nghe lại
          </button>
          <button
            type="button"
            onClick={() => practice(selected.group)}
            style={{ padding: "0.45rem 0.9rem", borderRadius: "var(--radius-md, 8px)", border: "none", background: "var(--accent-primary)", color: "#fff", fontSize: FS.sm, fontWeight: 600, cursor: "pointer" }}
          >
            Luyện âm này →
          </button>
        </div>
      )}
    </div>
  );
}
