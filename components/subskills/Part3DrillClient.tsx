"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Drill, DrillItem, Part3Level } from "@/lib/subskills/part3";
import { part3AttemptKey } from "@/lib/subskills/part3";

type Props = {
  level: Part3Level;
  drill: Drill;
  drillIndex: number;
  signedIn: boolean;
};

const GREEN = "rgb(34,197,94)";
const RED = "rgb(239,68,68)";

export default function Part3DrillClient({ level, drill, drillIndex, signedIn }: Props) {
  const items = drill.items;

  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [plays, setPlays] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const item: DrillItem | undefined = items[idx];
  const { playbackRate, transcriptPolicy, replayLimit } = level.config;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mỗi câu mới: đặt lại bộ đếm nghe và trạng thái transcript
  useEffect(() => {
    setPlays(0);
    setShowTranscript(transcriptPolicy === "always");
  }, [idx, transcriptPolicy]);

  // Tốc độ phát phải gán lại mỗi lần đổi nguồn audio
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = playbackRate;
  }, [idx, playbackRate]);

  const outOfPlays = replayLimit !== null && plays >= replayLimit;

  // Ở cấp mô phỏng phòng thi, phương án chỉ hiện sau khi đã bấm nghe
  const optionsHidden = !!drill.hideOptionsUntilPlayed && plays === 0;

  const transcriptAvailable =
    !!item?.transcript &&
    (transcriptPolicy === "always" ||
      (transcriptPolicy === "after-2" && plays >= 2) ||
      (transcriptPolicy === "after-submit" && locked));

  const handlePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || outOfPlays) return;
    el.playbackRate = playbackRate;
    el.currentTime = 0;
    void el.play();
    setPlays((p) => p + 1);
  }, [outOfPlays, playbackRate]);

  // Bài "đoán từ phần mở đầu" chỉ cho nghe mấy giây đầu
  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    const limit = item?.audioPreviewSeconds;
    if (el && limit && el.currentTime >= limit) el.pause();
  }, [item?.audioPreviewSeconds]);

  const score = useMemo(
    () => (items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100)),
    [correctCount, items.length]
  );
  const passed = score >= level.passThreshold;

  const saveAttempt = useCallback(
    async (finalScore: number) => {
      if (!signedIn) return;
      try {
        await fetch("/api/subskills/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            part: part3AttemptKey(level.level),
            questionWord: drill.id,
            exerciseIndex: drillIndex,
            score: finalScore,
            passed: finalScore >= level.passThreshold,
          }),
        });
      } catch {
        // Mất mạng thì bỏ qua — không chặn người học làm tiếp
      }
    },
    [signedIn, level.level, level.passThreshold, drill.id, drillIndex]
  );

  function submit() {
    if (choice === null || locked || !item) return;
    setLocked(true);
    if (choice === item.correct) setCorrectCount((c) => c + 1);
    audioRef.current?.pause();
  }

  function next() {
    if (!item) return;
    const isLast = idx === items.length - 1;
    if (isLast) {
      const finalCorrect = correctCount;
      const finalScore = Math.round((finalCorrect / items.length) * 100);
      setFinished(true);
      void saveAttempt(finalScore);
      return;
    }
    setIdx((i) => i + 1);
    setChoice(null);
    setLocked(false);
  }

  function restart() {
    setIdx(0);
    setChoice(null);
    setLocked(false);
    setCorrectCount(0);
    setFinished(false);
  }

  // ── Màn hình kết quả ────────────────────────────────────────────────
  if (finished) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: "50%",
            margin: "0 auto 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem",
            fontWeight: 800,
            background: passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
            border: `2px solid ${passed ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.4)"}`,
            color: passed ? GREEN : RED,
          }}
        >
          {score}%
        </div>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {passed ? "Đạt" : "Chưa đạt"}
        </h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Đúng {correctCount}/{items.length} câu · cần {level.passThreshold}% để qua
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={restart}
            style={{
              padding: "0.6rem 1.3rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Làm lại
          </button>
          <Link
            href={`/subskills/listening/part3/${level.level}`}
            style={{
              padding: "0.6rem 1.3rem",
              borderRadius: 8,
              border: "1px solid var(--accent-primary)",
              background: "var(--accent-primary)",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Về danh sách bài
          </Link>
        </div>
        {!signedIn && (
          <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Đăng nhập để lưu kết quả.
          </p>
        )}
      </div>
    );
  }

  if (!item) {
    return <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Bài này chưa có câu hỏi.</p>;
  }

  const pct = Math.round((idx / items.length) * 100);

  return (
    <div>
      {/* Thanh tiến độ */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 999 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "var(--accent-primary)",
              borderRadius: 999,
              transition: "width 0.25s",
            }}
          />
        </div>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {idx + 1}/{items.length}
        </span>
      </div>

      {/* Audio */}
      {item.audioUrl && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            background: "var(--bg-elevated)",
            padding: "0.9rem 1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handlePlay}
              disabled={outOfPlays}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: 8,
                border: "1px solid var(--accent-primary)",
                background: outOfPlays ? "var(--bg-secondary)" : "var(--accent-primary)",
                color: outOfPlays ? "var(--text-muted)" : "#fff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: outOfPlays ? "not-allowed" : "pointer",
              }}
            >
              {plays === 0 ? "▶ Nghe" : "▶ Nghe lại"}
            </button>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Tốc độ {playbackRate}×
              {replayLimit !== null && ` · còn ${Math.max(0, replayLimit - plays)}/${replayLimit} lượt`}
              {item.audioPreviewSeconds && ` · chỉ ${item.audioPreviewSeconds} giây đầu`}
            </span>
          </div>
          <audio
            ref={audioRef}
            src={item.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            preload="none"
            style={{ display: "none" }}
          />
        </div>
      )}

      {item.image && (
        // Ảnh bảng biểu do Supabase phục vụ, không qua next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt="Bảng biểu đi kèm câu hỏi"
          style={{
            maxWidth: "100%",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--border)",
            marginBottom: "1rem",
          }}
        />
      )}

      {/* Câu lệnh */}
      <p
        style={{
          margin: "0 0 0.75rem",
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.55,
          whiteSpace: "pre-line",
        }}
      >
        {item.question}
      </p>

      {/* Khối ngữ cảnh */}
      {item.context && (
        <div
          style={{
            padding: "0.8rem 1rem",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            lineHeight: 1.6,
            marginBottom: "1rem",
            whiteSpace: "pre-line",
          }}
        >
          {item.context}
        </div>
      )}

      {/* Phương án */}
      {optionsHidden ? (
        <div
          style={{
            padding: "1.4rem 1rem",
            textAlign: "center",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px dashed var(--border)",
            background: "var(--bg-secondary)",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            marginBottom: "1.1rem",
          }}
        >
          Bấm ▶ Nghe để hiện phương án. Thi trên máy cũng không cho đọc trước.
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.1rem" }}>
        {item.options.map((opt, i) => {
          const isChosen = choice === i;
          const isCorrect = i === item.correct;
          const showRight = locked && isCorrect;
          const showWrong = locked && isChosen && !isCorrect;

          return (
            <button
              key={i}
              onClick={() => !locked && setChoice(i)}
              disabled={locked}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.7rem",
                textAlign: "left",
                padding: "0.75rem 0.9rem",
                borderRadius: "var(--radius-md, 8px)",
                border: `1.5px solid ${
                  showRight ? "rgba(34,197,94,0.6)" : showWrong ? "rgba(239,68,68,0.5)" : isChosen ? "var(--accent-primary)" : "var(--border)"
                }`,
                background: showRight
                  ? "rgba(34,197,94,0.1)"
                  : showWrong
                    ? "rgba(239,68,68,0.08)"
                    : isChosen
                      ? "var(--bg-elevated)"
                      : "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: "0.87rem",
                lineHeight: 1.55,
                cursor: locked ? "default" : "pointer",
                whiteSpace: "pre-line",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  background: showRight ? "rgba(34,197,94,0.2)" : showWrong ? "rgba(239,68,68,0.15)" : "var(--bg-elevated)",
                  color: showRight ? GREEN : showWrong ? RED : "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Giải thích */}
      {locked && item.explanation && (
        <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "var(--radius-md, 8px)",
            border: `1px solid ${choice === item.correct ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.3)"}`,
            background: choice === item.correct ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.05)",
            fontSize: "0.83rem",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            marginBottom: "1rem",
            whiteSpace: "pre-line",
          }}
        >
          <strong style={{ color: choice === item.correct ? GREEN : RED }}>
            {choice === item.correct ? "Đúng. " : "Sai. "}
          </strong>
          {item.explanation}
        </div>
      )}

      {/* Transcript */}
      {item.transcript && (
        <div style={{ marginBottom: "1.1rem" }}>
          {transcriptAvailable ? (
            <>
              <button
                onClick={() => setShowTranscript((s) => !s)}
                style={{
                  padding: "0.35rem 0.8rem",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  fontSize: "0.73rem",
                  cursor: "pointer",
                }}
              >
                {showTranscript ? "Ẩn transcript" : "Xem transcript"}
              </button>
              {showTranscript && (
                <pre
                  style={{
                    marginTop: "0.6rem",
                    padding: "0.85rem 1rem",
                    borderRadius: "var(--radius-md, 8px)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    overflowX: "auto",
                  }}
                >
                  {item.transcript}
                </pre>
              )}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {level.config.transcriptPolicy === "after-2"
                ? `Transcript mở sau 2 lần nghe (đã nghe ${plays}).`
                : level.config.transcriptPolicy === "after-submit"
                  ? "Transcript mở sau khi trả lời."
                  : "Cấp này không dùng transcript."}
            </p>
          )}
        </div>
      )}

      {/* Nút hành động */}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        {!locked ? (
          <button
            onClick={submit}
            disabled={choice === null}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: 8,
              border: "1px solid var(--accent-primary)",
              background: choice === null ? "var(--bg-secondary)" : "var(--accent-primary)",
              color: choice === null ? "var(--text-muted)" : "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: choice === null ? "not-allowed" : "pointer",
            }}
          >
            Trả lời
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              padding: "0.6rem 1.5rem",
              borderRadius: 8,
              border: "1px solid var(--accent-primary)",
              background: "var(--accent-primary)",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {idx === items.length - 1 ? "Xem kết quả" : "Câu tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
