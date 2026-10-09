"use client";

import { useState } from "react";
import { FS } from "@/lib/ui/scale";
import type { MatchMeaningItem } from "@/lib/subskills/chunking/drills";
import { attemptPart } from "@/lib/subskills/chunking";
import { btn, card, GREEN, Progress, RED, ResultPanel, saveAttempt } from "./shell";

type Step = "meaning" | "stress" | "done";

export default function MatchMeaningClient({
  items,
  passThreshold,
  signedIn,
}: {
  items: MatchMeaningItem[];
  passThreshold: number;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>("meaning");
  const [meaningPick, setMeaningPick] = useState<number | null>(null);
  const [stressPick, setStressPick] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [finished, setFinished] = useState(false);

  const item = items[idx];
  // Mỗi cụm 2 điểm: nghĩa và đỉnh nhấn
  const score = items.length === 0 ? 0 : Math.round((points / (items.length * 2)) * 100);

  function restart() {
    setIdx(0);
    setStep("meaning");
    setMeaningPick(null);
    setStressPick(null);
    setPoints(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`${points}/${items.length * 2} ý đúng trên ${items.length} cụm`}
        onRestart={restart}
        signedIn={signedIn}
      />
    );
  }

  if (!item) {
    return <p style={{ color: "var(--text-muted)", fontSize: FS.sm }}>Cấp này chưa có đề.</p>;
  }

  function submitMeaning() {
    if (meaningPick === null) return;
    if (meaningPick === item.correct) setPoints((p) => p + 1);
    setStep("stress");
  }

  function submitStress() {
    if (stressPick === null) return;
    if (stressPick === item.stressIdx) setPoints((p) => p + 1);
    setStep("done");
  }

  function next() {
    if (idx === items.length - 1) {
      const final = Math.round((points / (items.length * 2)) * 100);
      setFinished(true);
      if (signedIn) {
        void saveAttempt({
          part: attemptPart("noi"),
          questionWord: "l2",
          exerciseIndex: 0,
          score: final,
          passed: final >= passThreshold,
        });
      }
      return;
    }
    setIdx((i) => i + 1);
    setStep("meaning");
    setMeaningPick(null);
    setStressPick(null);
  }

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <div style={{ ...card, marginBottom: "1rem", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: FS.lg, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>
          {step === "meaning"
            ? item.en
            : item.words.map((w, i) => (
                <span
                  key={i}
                  style={{
                    color:
                      step === "done" && i === item.stressIdx
                        ? GREEN
                        : step === "done" && i === stressPick
                          ? RED
                          : "var(--text-primary)",
                    fontWeight: step === "done" && i === item.stressIdx ? 800 : 600,
                  }}
                >
                  {w}{" "}
                </span>
              ))}
        </p>
      </div>

      {step === "meaning" && (
        <>
          <p style={{ margin: "0 0 0.75rem", fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)" }}>
            Cả cụm này nghĩa là gì?
          </p>
          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
            {item.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setMeaningPick(i)}
                style={{
                  textAlign: "left",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 8,
                  border: `1px solid ${i === meaningPick ? "var(--accent-primary)" : "var(--border)"}`,
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: FS.sm,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            onClick={submitMeaning}
            disabled={meaningPick === null}
            style={{ ...btn("primary"), opacity: meaningPick === null ? 0.5 : 1 }}
          >
            Tiếp
          </button>
        </>
      )}

      {step === "stress" && (
        <>
          <p style={{ margin: "0 0 0.3rem", fontSize: FS.md, fontWeight: 600, color: "var(--text-primary)" }}>
            Bấm vào từ nhận đỉnh nhấn của cụm
          </p>
          <p style={{ margin: "0 0 0.75rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
            Mỗi cụm chỉ một đỉnh — thường là từ nội dung cuối cụm, không phải từ chức năng như
            &ldquo;the&rdquo;, &ldquo;of&rdquo;, &ldquo;to&rdquo;.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
            {item.words.map((w, i) => (
              <button
                key={i}
                onClick={() => setStressPick(i)}
                style={{
                  padding: "0.45rem 0.8rem",
                  borderRadius: 999,
                  border: `1px solid ${i === stressPick ? "var(--accent-primary)" : "var(--border)"}`,
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  fontSize: FS.sm,
                  cursor: "pointer",
                }}
              >
                {w}
              </button>
            ))}
          </div>
          <button
            onClick={submitStress}
            disabled={stressPick === null}
            style={{ ...btn("primary"), opacity: stressPick === null ? 0.5 : 1 }}
          >
            Kiểm tra
          </button>
        </>
      )}

      {step === "done" && (
        <>
          <div style={{ ...card, marginBottom: "1rem", background: "var(--bg-secondary)" }}>
            <p style={{ margin: "0 0 0.35rem", fontSize: FS.sm, color: "var(--text-primary)" }}>
              Nghĩa cả cụm:{" "}
              <strong style={{ color: meaningPick === item.correct ? GREEN : RED }}>
                {item.options[item.correct]}
              </strong>
            </p>
            <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-primary)" }}>
              Đỉnh nhấn:{" "}
              <strong style={{ color: stressPick === item.stressIdx ? GREEN : RED }}>
                {item.words[item.stressIdx]}
              </strong>
              {stressPick !== item.stressIdx && stressPick !== null && (
                <span style={{ color: "var(--text-muted)" }}> — bạn chọn &ldquo;{item.words[stressPick]}&rdquo;</span>
              )}
            </p>
          </div>
          <button onClick={next} style={btn("primary")}>
            {idx === items.length - 1 ? "Xem kết quả" : "Cụm tiếp"}
          </button>
        </>
      )}
    </div>
  );
}
