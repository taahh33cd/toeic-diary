"use client";

import { useState, useRef, useCallback } from "react";

type PanelState = "idle" | "recording" | "processing" | "done" | "error";

interface Scores {
  pronunciationScore: number;
  fluencyScore: number;
  prosodyScore: number;
  overallScore: number;
}

// ── WAV encoder (16kHz mono 16-bit PCM) ──────────────────────────────────────
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataSize = samples.length * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const s = (off: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
  s(0, "RIFF"); v.setUint32(4, 36 + dataSize, true);
  s(8, "WAVE"); s(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true);
  v.setUint16(34, 16, true); s(36, "data");
  v.setUint32(40, dataSize, true);
  let off = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    v.setInt16(off, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    off += 2;
  }
  return buf;
}

async function blobToWav(blob: Blob): Promise<Blob> {
  const raw = await blob.arrayBuffer();
  const decodeCtx = new AudioContext();
  const decoded = await decodeCtx.decodeAudioData(raw);
  await decodeCtx.close();

  const TARGET_RATE = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * TARGET_RATE), TARGET_RATE);
  const src = offlineCtx.createBufferSource();
  src.buffer = decoded;
  src.connect(offlineCtx.destination);
  src.start(0);
  const resampled = await offlineCtx.startRendering();
  return new Blob([encodeWav(resampled.getChannelData(0), TARGET_RATE)], { type: "audio/wav" });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (s: number) =>
  s >= 80 ? "rgb(34,197,94)" : s >= 60 ? "rgb(234,179,8)" : "rgb(239,68,68)";

const scoreLabel = (s: number) =>
  s >= 80 ? "Tốt! ✓" : s >= 60 ? "Cần cải thiện" : "Cần luyện thêm";

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Mặc định 15 giây như Part 1/2; Q8-10 câu 10 cần 30 giây nên truyền `maxSeconds`. */
const DEFAULT_MAX_SECONDS = 15;

// ── Component ─────────────────────────────────────────────────────────────────
export function RecordingPanel({
  referenceText,
  skillId,
  testNum,
  exerciseIndex,
  userId,
  maxSeconds = DEFAULT_MAX_SECONDS,
}: {
  referenceText: string;
  skillId: string;
  testNum: number;
  exerciseIndex: number;
  userId: string;
  /** Thời lượng ghi âm tối đa, giây. */
  maxSeconds?: number;
}) {
  const [state, setState] = useState<PanelState>("idle");
  const [scores, setScores] = useState<Scores | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const stopRecorder = useCallback(() => {
    clearTimer();
    recorderRef.current?.stop();
  }, []);

  const submit = useCallback(async (blob: Blob) => {
    setState("processing");
    try {
      const wav = await blobToWav(blob);
      const form = new FormData();
      form.append("audio", wav, "recording.wav");
      form.append("referenceText", referenceText);
      form.append("skillId", skillId);
      form.append("testNum", String(testNum));
      form.append("exerciseIndex", String(exerciseIndex));
      form.append("userId", userId);

      const res = await fetch("/api/speaking/assess", { method: "POST", body: form });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
        throw new Error(error ?? "Lỗi API");
      }
      const { scores: s } = await res.json();
      setScores(s);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setState("error");
    }
  }, [referenceText, skillId, testNum, exerciseIndex, userId]);

  const startRecording = useCallback(async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      setSeconds(0);

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        submit(blob);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setState("recording");

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stopRecorder();
      }, 1000);
    } catch {
      setErrorMsg("Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.");
      setState("error");
    }
  }, [submit, stopRecorder, maxSeconds]);

  const reset = () => { setState("idle"); setScores(null); setSeconds(0); setErrorMsg(""); };

  return (
    <div style={{
      padding: "14px 16px",
      background: "var(--bg-elevated)",
      borderRadius: 10,
      border: "1px solid var(--border)",
      borderLeft: "3px solid rgba(168,85,247,0.55)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(168,85,247,0.85)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          🎙 Luyện đọc
        </span>
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>· không bắt buộc</span>
      </div>

      {/* Reference text */}
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", fontStyle: "italic" }}>
        "{referenceText}"
      </div>

      {/* Idle */}
      {state === "idle" && (
        <button
          onClick={startRecording}
          style={{
            alignSelf: "flex-start",
            padding: "7px 18px", borderRadius: 20,
            background: "rgba(168,85,247,0.1)",
            border: "1.5px solid rgba(168,85,247,0.4)",
            color: "rgba(168,85,247,0.9)",
            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          }}
        >
          🎙 Bắt đầu ghi âm
        </button>
      )}

      {/* Recording */}
      {state === "recording" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "rgb(239,68,68)", fontWeight: 700, minWidth: 44 }}>
            ● {fmtTime(seconds)}
          </span>
          <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (seconds / maxSeconds) * 100)}%`, background: "rgb(239,68,68)", borderRadius: 999, transition: "width 0.9s linear" }} />
          </div>
          <button
            onClick={stopRecorder}
            style={{
              padding: "7px 16px", borderRadius: 20,
              background: "rgba(239,68,68,0.1)",
              border: "1.5px solid rgba(239,68,68,0.45)",
              color: "rgb(239,68,68)",
              fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            ■ Dừng & nộp
          </button>
        </div>
      )}

      {/* Processing */}
      {state === "processing" && (
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          ⏳ Đang phân tích phát âm...
        </span>
      )}

      {/* Error */}
      {state === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.8rem", color: "rgb(239,68,68)" }}>{errorMsg}</span>
          <button onClick={reset} style={{ fontSize: "0.78rem", color: "var(--accent-primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Done — scores */}
      {state === "done" && scores && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Overall circle + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
              background: `conic-gradient(${scoreColor(scores.overallScore)} ${scores.overallScore * 3.6}deg, var(--bg-primary) 0)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "1rem", fontWeight: 800, color: scoreColor(scores.overallScore), lineHeight: 1 }}>
                  {scores.overallScore}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Điểm phát âm tổng thể</div>
              <div style={{ fontSize: "0.75rem", color: scoreColor(scores.overallScore), fontWeight: 600 }}>
                {scoreLabel(scores.overallScore)}
              </div>
            </div>
          </div>

          {/* Breakdown chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { label: "Chính xác", value: scores.pronunciationScore },
              { label: "Lưu loát",  value: scores.fluencyScore },
              ...(scores.prosodyScore > 0 ? [{ label: "Ngữ điệu", value: scores.prosodyScore }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: "4px 10px", borderRadius: 20,
                background: "var(--bg-primary)", border: "1px solid var(--border)",
                fontSize: "0.72rem", color: "var(--text-secondary)",
              }}>
                {label}: <strong style={{ color: scoreColor(value) }}>{value}%</strong>
              </div>
            ))}
          </div>

          <button
            onClick={reset}
            style={{
              alignSelf: "flex-start",
              padding: "5px 14px", borderRadius: 16,
              background: "none", border: "1px solid var(--border)",
              color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer",
            }}
          >
            Ghi âm lại
          </button>
        </div>
      )}
    </div>
  );
}
