"use client";

import { useCallback, useRef, useState } from "react";
import { FS } from "@/lib/ui/scale";
import { blobToWav } from "@/lib/audio/wav";
import { AMBER, btn, card, GREEN, RED } from "./shell";

export type ReadAloudSource = {
  kind: "passage" | "sample";
  id: string;
  label: string;
  /** Đề bài, chỉ có ở bài nói tự do */
  question?: string;
  questionVi?: string;
  chunks: { en: string; vi: string; stress: string }[];
};

type Result = {
  scores: {
    chunkScore: number;
    pronunciationScore: number;
    fluencyScore: number;
    prosodyScore: number;
    overallScore: number;
  };
  major: { total: number; hit: number; missed: { after: string; before: string }[] };
  grouping: { ratio: number; nativeRatio: number; score: number };
  intrusiveBreaks: { chunk: string; at: string }[];
  advice: string;
};

const MAX_SECONDS = 75;

export default function ReadAloudClient({
  sources,
  signedIn,
}: {
  sources: ReadAloudSource[];
  signedIn: boolean;
}) {
  const [pick, setPick] = useState(0);
  const [state, setState] = useState<"idle" | "recording" | "processing" | "done" | "error">("idle");
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const source = sources[pick];

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submit = useCallback(
    async (blob: Blob) => {
      setState("processing");
      try {
        const wav = await blobToWav(blob);
        const form = new FormData();
        form.append("audio", wav, "recording.wav");
        form.append("kind", source.kind);
        form.append("sourceId", source.id);
        form.append("exerciseIndex", String(pick));

        const res = await fetch("/api/subskills/chunk-read", { method: "POST", body: form });
        const data = await res.json().catch(() => ({ error: "Không đọc được phản hồi" }));
        if (!res.ok) throw new Error(data.error ?? "Lỗi khi chấm");
        setResult(data as Result);
        setState("done");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra");
        setState("error");
      }
    },
    [source, pick]
  );

  const startRecording = useCallback(async () => {
    setErrorMsg("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      setSeconds(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void submit(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setState("recording");

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) {
          clearTimer();
          recorder.stop();
        }
      }, 1000);
    } catch {
      setErrorMsg("Không mở được micro. Kiểm tra quyền truy cập micro của trình duyệt.");
      setState("error");
    }
  }, [submit]);

  const stopRecording = useCallback(() => {
    clearTimer();
    recorderRef.current?.stop();
  }, []);

  function choose(i: number) {
    if (state === "recording" || state === "processing") return;
    setPick(i);
    setState("idle");
    setResult(null);
    setErrorMsg("");
  }

  const ring = (s: number) => (s >= 80 ? GREEN : s >= 60 ? AMBER : RED);

  return (
    <div>
      {/* Chọn bài */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
        {sources.map((s, i) => (
          <button
            key={s.id}
            onClick={() => choose(i)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 999,
              border: `1px solid ${i === pick ? "var(--accent-primary)" : "var(--border)"}`,
              background: i === pick ? "rgba(30,95,142,0.12)" : "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: FS.xs,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {source.question && (
        <div style={{ ...card, marginBottom: "1rem", background: "var(--bg-secondary)" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>
            {source.question}
          </p>
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)" }}>{source.questionVi}</p>
        </div>
      )}

      {/* Bài đọc, cắt sẵn theo cụm */}
      <div style={{ ...card, marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.6rem", fontSize: FS.xs, color: "var(--text-muted)" }}>
          Mỗi khối là một cụm — đọc liền trong cụm, nghỉ ngắn giữa hai cụm, nhấn vào từ in đậm.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {source.chunks.map((c, i) => (
            <span
              key={i}
              title={c.vi}
              style={{
                padding: "0.4rem 0.65rem",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                fontSize: FS.md,
                lineHeight: 1.5,
                color: "var(--text-primary)",
              }}
            >
              {c.en.split(/\s+/).map((w, wi) => (
                <span key={wi} style={{ fontWeight: w === c.stress ? 800 : 400 }}>
                  {w}{" "}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Ghi âm */}
      <div style={{ ...card, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {state === "recording" ? (
          <button onClick={stopRecording} style={{ ...btn("primary"), background: RED, borderColor: RED }}>
            ■ Dừng ({seconds}s)
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={state === "processing"}
            style={{ ...btn("primary"), opacity: state === "processing" ? 0.6 : 1 }}
          >
            {state === "processing" ? "Đang chấm…" : "● Thu âm đọc cả đoạn"}
          </button>
        )}
        <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
          Tối đa {MAX_SECONDS} giây · bản thu chỉ dùng để đo nhịp ngắt, không lưu lại
        </span>
      </div>

      {state === "error" && (
        <div style={{ ...card, marginBottom: "1rem", border: `1px solid ${RED}`, background: "rgba(239,68,68,0.06)" }}>
          <p style={{ margin: 0, fontSize: FS.sm, color: RED }}>{errorMsg}</p>
        </div>
      )}

      {result && (
        <div style={{ ...card }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: FS.lg,
                fontWeight: 800,
                color: ring(result.scores.chunkScore),
                border: `2px solid ${ring(result.scores.chunkScore)}`,
                background: "var(--bg-secondary)",
              }}
            >
              {result.scores.chunkScore}
            </div>
            <div>
              <p style={{ margin: "0 0 0.2rem", fontSize: FS.md, fontWeight: 700, color: "var(--text-primary)" }}>
                Nhịp ngắt theo cụm
              </p>
              <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-secondary)" }}>
                Dừng đúng {result.major.hit}/{result.major.total} chỗ ngắt lớn · gom cụm{" "}
                {result.grouping.ratio.toFixed(2)}× (bản ngữ ~{result.grouping.nativeRatio}×)
              </p>
            </div>
          </div>

          {/* Chỉ số tổng thể: đo được cả đoạn chứ không chỉ mặt từng chỗ */}
          <div style={{ marginBottom: "0.9rem" }}>
            <p style={{ margin: "0 0 0.3rem", fontSize: FS.sm, fontWeight: 600, color: "var(--text-primary)" }}>
              Mức gom cụm {result.grouping.score}/100
            </p>
            <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {result.grouping.ratio < 1.1
                ? "Bạn đọc đều tăm tắp, mọi từ dài như nhau — người nghe không thấy cụm ở đâu. Hãy kéo dài nhẹ từ cuối mỗi cụm."
                : result.grouping.score >= 80
                  ? "Âm cuối cụm được kéo dài rõ — người nghe nhận ra ranh giới cụm."
                  : "Có gom cụm nhưng còn mờ. Kéo dài thêm từ cuối cụm, nhất là từ nội dung cuối."}
            </p>
          </div>

          {result.major.missed.length > 0 && (
            <div style={{ marginBottom: "0.9rem" }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: FS.sm, fontWeight: 600, color: AMBER }}>
                Đọc trôi qua chỗ cần dừng rõ
              </p>
              {result.major.missed.slice(0, 6).map((m, i) => (
                <p key={i} style={{ margin: "0 0 0.2rem", fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  sau &ldquo;{m.after}&rdquo; → trước &ldquo;{m.before}&rdquo;
                </p>
              ))}
            </div>
          )}

          {result.intrusiveBreaks.length > 0 && (
            <div style={{ marginBottom: "0.9rem" }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: FS.sm, fontWeight: 600, color: RED }}>
                Ngắt giữa cụm — chỗ này nghe thành lắp
              </p>
              {result.intrusiveBreaks.slice(0, 6).map((m, i) => (
                <p key={i} style={{ margin: "0 0 0.2rem", fontSize: FS.xs, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  &ldquo;{m.at}&rdquo; trong cụm &ldquo;{m.chunk}&rdquo;
                </p>
              ))}
            </div>
          )}

          {result.major.missed.length === 0 && result.intrusiveBreaks.length === 0 && (
            <p style={{ margin: "0 0 0.9rem", fontSize: FS.sm, color: GREEN }}>
              Dừng đủ ở mọi chỗ ngắt lớn, không ngắt sai giữa cụm nào.
            </p>
          )}

          {result.advice && (
            <div
              style={{
                padding: "0.75rem 0.9rem",
                borderRadius: 8,
                background: "var(--bg-secondary)",
                marginBottom: "0.9rem",
              }}
            >
              <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-primary)", lineHeight: 1.65 }}>
                {result.advice}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: FS.xs, color: "var(--text-muted)" }}>
            <span>Phát âm {result.scores.pronunciationScore}</span>
            <span>Độ trôi {result.scores.fluencyScore}</span>
            <span>Ngữ điệu {result.scores.prosodyScore}</span>
            <span>Tổng {result.scores.overallScore}</span>
          </div>

          {!signedIn && (
            <p style={{ margin: "0.9rem 0 0", fontSize: FS.xs, color: "var(--text-muted)" }}>
              Đăng nhập để lưu kết quả.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
