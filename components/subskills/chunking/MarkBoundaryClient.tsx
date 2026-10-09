"use client";

import { useCallback, useRef, useState } from "react";
import { FS } from "@/lib/ui/scale";
import { gradeMarkBoundary, type MarkBoundaryItem } from "@/lib/subskills/chunking/drills";
import { attemptPart } from "@/lib/subskills/chunking";
import { btn, card, GREEN, Progress, RED, ResultPanel, saveAttempt } from "./shell";

/** Đọc mẫu từng cụm, nghỉ giữa các cụm để nghe rõ chỗ ngắt. */
function useChunkReader() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const [reading, setReading] = useState(false);

  const readChunks = useCallback(async (chunks: string[]) => {
    setReading(true);
    try {
      for (const text of chunks) {
        let src = cacheRef.current.get(text);
        if (!src) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (res.ok) {
            const { audioContent } = await res.json();
            src = `data:audio/mp3;base64,${audioContent}`;
            cacheRef.current.set(text, src);
          }
        }
        if (src) {
          const el = new Audio(src);
          await new Promise<void>((resolve) => {
            el.onended = () => resolve();
            el.onerror = () => resolve();
            void el.play().catch(() => resolve());
          });
        } else if (typeof window !== "undefined" && window.speechSynthesis) {
          // Không có Google TTS thì dùng giọng của trình duyệt
          await new Promise<void>((resolve) => {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = "en-US";
            u.onend = () => resolve();
            u.onerror = () => resolve();
            window.speechSynthesis.speak(u);
          });
        }
        // Khoảng nghỉ giữa hai cụm — đây chính là thứ cần nghe ra
        await new Promise((r) => setTimeout(r, 320));
      }
    } finally {
      setReading(false);
    }
  }, []);

  return { readChunks, reading };
}

export default function MarkBoundaryClient({
  items,
  passThreshold,
  signedIn,
}: {
  items: MarkBoundaryItem[];
  passThreshold: number;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [points, setPoints] = useState(0);
  const [finished, setFinished] = useState(false);
  const { readChunks, reading } = useChunkReader();

  const item = items[idx];
  const score = items.length === 0 ? 0 : Math.round((points / items.length) * 100);
  const graded = locked && item ? gradeMarkBoundary(item, picked) : null;

  function restart() {
    setIdx(0);
    setPicked([]);
    setLocked(false);
    setPoints(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`${items.length} câu đã cắt`}
        onRestart={restart}
        signedIn={signedIn}
      />
    );
  }

  if (!item) {
    return <p style={{ color: "var(--text-muted)", fontSize: FS.sm }}>Cấp này chưa có đề.</p>;
  }

  function submit() {
    if (locked) return;
    setLocked(true);
    setPoints((p) => p + gradeMarkBoundary(item, picked).ratio);
  }

  function next() {
    if (idx === items.length - 1) {
      const final = Math.round((points / items.length) * 100);
      setFinished(true);
      if (signedIn) {
        void saveAttempt({
          part: attemptPart("noi"),
          questionWord: "l1",
          exerciseIndex: 0,
          score: final,
          passed: final >= passThreshold,
        });
      }
      return;
    }
    setIdx((i) => i + 1);
    setPicked([]);
    setLocked(false);
  }

  /** Các cụm theo đáp án, để đọc mẫu và để hiện khi chữa bài. */
  function answerChunks(): string[] {
    const edges = [0, ...item.answer, item.words.length];
    return edges.slice(0, -1).map((from, k) => item.words.slice(from, edges[k + 1]).join(" "));
  }

  return (
    <div>
      <Progress idx={idx} total={items.length} />

      <p style={{ margin: "0 0 0.3rem", fontSize: FS.xs, color: "var(--text-muted)" }}>{item.genreVi}</p>
      <p style={{ margin: "0 0 0.9rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>
        Bấm vào khe giữa hai từ để cắt. Cần {item.answer.length} chỗ ngắt.
      </p>

      {/* Câu với các khe bấm được */}
      <div
        style={{
          ...card,
          marginBottom: "1rem",
          fontSize: FS.md,
          lineHeight: 2.2,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {item.words.map((w, i) => {
          const isCut = picked.includes(i);
          const shouldCut = item.answer.includes(i);
          let gapColor = "transparent";
          if (locked) {
            if (isCut && shouldCut) gapColor = GREEN;
            else if (isCut && !shouldCut) gapColor = RED;
            else if (!isCut && shouldCut) gapColor = "var(--text-muted)";
          } else if (isCut) {
            gapColor = "var(--accent-primary)";
          }

          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              {i > 0 && (
                <button
                  onClick={() =>
                    !locked &&
                    setPicked((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]))
                  }
                  disabled={locked}
                  aria-label={`Cắt trước từ ${w}`}
                  title={locked ? item.reasons[i] : "Bấm để cắt ở đây"}
                  style={{
                    width: isCut || (locked && shouldCut) ? 14 : 10,
                    height: 26,
                    margin: "0 1px",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: locked ? "default" : "pointer",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 2,
                      transform: "translateX(-50%)",
                      width: 2,
                      height: 22,
                      borderRadius: 2,
                      background: gapColor,
                      borderLeft:
                        locked && !isCut && shouldCut ? "2px dashed var(--text-muted)" : undefined,
                    }}
                  />
                </button>
              )}
              <span style={{ color: "var(--text-primary)" }}>{w}</span>
            </span>
          );
        })}
      </div>

      {locked && graded && (
        <div style={{ ...card, marginBottom: "1rem", background: "var(--bg-secondary)" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>
            Đúng {graded.hits.length}/{item.answer.length} chỗ
            {graded.extra.length > 0 && ` · cắt thừa ${graded.extra.length} chỗ`}
          </p>
          <p style={{ margin: "0 0 0.6rem", fontSize: FS.md, color: "var(--text-primary)", lineHeight: 1.7 }}>
            {answerChunks().join("  /  ")}
          </p>
          {graded.missed.map((m) => (
            <p key={m} style={{ margin: "0 0 0.25rem", fontSize: FS.xs, color: "var(--text-secondary)" }}>
              Bỏ sót trước &ldquo;{item.words[m]}&rdquo;: {item.reasons[m]}
            </p>
          ))}
          {graded.extra.map((e) => (
            <p key={e} style={{ margin: "0 0 0.25rem", fontSize: FS.xs, color: RED }}>
              Cắt thừa trước &ldquo;{item.words[e]}&rdquo; — chỗ này không phải ranh giới cụm
            </p>
          ))}
          <button
            onClick={() => void readChunks(answerChunks())}
            disabled={reading}
            style={{ ...btn("ghost"), marginTop: "0.6rem" }}
          >
            {reading ? "Đang đọc…" : "🔊 Nghe mẫu ngắt theo cụm"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!locked ? (
          <button
            onClick={submit}
            disabled={picked.length === 0}
            style={{ ...btn("primary"), opacity: picked.length === 0 ? 0.5 : 1 }}
          >
            Kiểm tra
          </button>
        ) : (
          <button onClick={next} style={btn("primary")}>
            {idx === items.length - 1 ? "Xem kết quả" : "Câu tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
