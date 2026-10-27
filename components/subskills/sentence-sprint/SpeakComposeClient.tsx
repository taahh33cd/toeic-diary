"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FS } from "@/lib/ui/scale";
import { blobToWav } from "@/lib/audio/wav";
import { matchModel } from "@/lib/subskills/sentence-sprint/match";
import type { SentenceAssess } from "@/lib/subskills/sentence-sprint/types";
import { AssessPanel } from "./AssessPanel";
import {
  Clock,
  GREEN,
  Progress,
  RED,
  ResultPanel,
  WordChip,
  btn,
  card,
  scoreColor,
  saveAttempt,
  useCountdown,
} from "./shell";

export type SpeakTask = {
  id: string;
  words: string[];
  vi: string[];
  /** Chỉ cấp 1: khuôn câu phải nói trọn thành câu */
  frame?: string;
  situation: string;
  model: string;
  minSentences: number;
};

type Phase = "think" | "recording" | "processing" | "graded";

export default function SpeakComposeClient({
  tasks,
  mode,
  seconds,
  thinkSeconds,
  passThreshold,
  partKey,
  levelSlug,
  backHref,
  signedIn,
}: {
  tasks: SpeakTask[];
  /** "frame" = so khớp với câu mẫu; "free" = AI chấm câu tự đặt */
  mode: "frame" | "free";
  seconds: number;
  thinkSeconds: number;
  passThreshold: number;
  partKey: string;
  levelSlug: string;
  backHref: string;
  signedIn: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("think");
  const [transcript, setTranscript] = useState("");
  const [assess, setAssess] = useState<SentenceAssess | null>(null);
  const [matchScore, setMatchScore] = useState<{ score: number; missed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const task = tasks[idx];

  // Thu dọn: rời trang giữa lúc đang thu thì vẫn phải tắt micro.
  useEffect(
    () => () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const finish = useCallback((score: number) => {
    setScores((s) => [...s, score]);
    setPhase("graded");
  }, []);

  const handleBlob = useCallback(
    async (blob: Blob) => {
      setPhase("processing");
      setAudioUrl(URL.createObjectURL(blob));
      try {
        const wav = await blobToWav(blob);
        const form = new FormData();
        form.append("audio", wav, "sentence.wav");
        const sttRes = await fetch("/api/subskills/sentence-stt", { method: "POST", body: form });
        const sttData = await sttRes.json().catch(() => ({ error: "Không đọc được phản hồi" }));
        if (!sttRes.ok) throw new Error(sttData.error ?? "Không chuyển được bản thu thành chữ");

        const said = (sttData.transcript as string) ?? "";
        setTranscript(said);

        if (mode === "frame") {
          const m = matchModel(task.model, said);
          setMatchScore({ score: m.score, missed: m.missed });
          finish(m.score);
          return;
        }

        const res = await fetch("/api/subskills/sentence-assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            words: task.words,
            situation: task.situation,
            model: task.model,
            answer: said,
            mode: "speak",
            minSentences: task.minSentences,
          }),
        });
        const data = await res.json().catch(() => ({ error: "Không đọc được phản hồi" }));
        if (!res.ok) throw new Error(data.error ?? "Chấm không được");
        const result = data as SentenceAssess;
        setAssess(result);
        finish(result.score);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi khi xử lý bản thu");
        finish(0);
      }
    },
    [finish, mode, task],
  );

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") rec.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void handleBlob(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
    } catch {
      setError("Không truy cập được micro. Cho phép micro rồi thử lại.");
      finish(0);
    }
  }, [finish, handleBlob]);

  const thinkLeft = useCountdown(thinkSeconds, phase === "think" && !done, () => void start());
  const recLeft = useCountdown(seconds, phase === "recording" && !done, stop);

  const next = () => {
    if (idx + 1 >= tasks.length) {
      const score = Math.round(scores.reduce((a, b) => a + b, 0) / tasks.length);
      setDone(true);
      if (signedIn) {
        void saveAttempt({
          part: partKey,
          questionWord: levelSlug,
          exerciseIndex: 0,
          score,
          passed: score >= passThreshold,
        });
      }
      return;
    }
    setIdx(idx + 1);
    setPhase("think");
    setTranscript("");
    setAssess(null);
    setMatchScore(null);
    setError(null);
    setAudioUrl(null);
  };

  const restart = () => {
    setIdx(0);
    setPhase("think");
    setTranscript("");
    setAssess(null);
    setMatchScore(null);
    setError(null);
    setAudioUrl(null);
    setScores([]);
    setDone(false);
  };

  if (done) {
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / tasks.length);
    return (
      <ResultPanel
        score={score}
        passThreshold={passThreshold}
        detail={`Trung bình ${tasks.length} lượt nói`}
        onRestart={restart}
        backHref={backHref}
        backLabel="Về trang bộ từ"
        signedIn={signedIn}
      />
    );
  }

  return (
    <div>
      <Progress idx={idx} total={tasks.length} />

      <div style={{ ...card, marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {task.words.map((w, i) => (
            <WordChip key={w} word={w} vi={task.vi[i]} />
          ))}
        </div>

        {task.frame && (
          <p style={{ margin: "0 0 0.6rem", fontSize: FS.md, lineHeight: 1.8, color: "var(--text-primary)" }}>
            {task.frame}
          </p>
        )}
        {task.situation && (
          <p style={{ margin: "0 0 0.6rem", fontSize: FS.sm, color: "var(--text-secondary)" }}>{task.situation}</p>
        )}

        {phase === "think" && <Clock left={thinkLeft} total={thinkSeconds} label="Nghĩ" />}
        {phase === "recording" && <Clock left={recLeft} total={seconds} label="Đang thu" />}
      </div>

      {phase === "graded" && mode === "frame" && matchScore && (
        <div style={{ ...card, marginBottom: "1rem", borderColor: scoreColor(matchScore.score) }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: FS.sm, fontWeight: 700, color: scoreColor(matchScore.score) }}>
            Khớp {matchScore.score}% từ nội dung của câu đúng
          </p>
          {matchScore.missed.length > 0 && (
            <p style={{ margin: "0 0 0.5rem", fontSize: FS.xs, color: RED }}>
              Thiếu: {matchScore.missed.join(", ")}
            </p>
          )}
          {matchScore.missed.length === 0 && (
            <p style={{ margin: "0 0 0.5rem", fontSize: FS.xs, color: GREEN }}>Nói đủ các từ nội dung.</p>
          )}
          <p style={{ margin: 0, fontSize: FS.xs, color: "var(--text-muted)" }}>
            <strong>Câu đúng: </strong>
            {task.model}
          </p>
        </div>
      )}

      {phase === "graded" && mode === "free" && assess && (
        <AssessPanel result={assess} model={task.model} words={task.words} />
      )}

      {transcript && (
        <div style={{ ...card, marginBottom: "1rem" }}>
          <p style={{ margin: "0 0 0.3rem", fontSize: FS.xs, color: "var(--text-muted)" }}>Máy nghe được:</p>
          <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-primary)" }}>{transcript}</p>
        </div>
      )}

      {audioUrl && (
        <audio controls src={audioUrl} style={{ width: "100%", marginBottom: "1rem" }} />
      )}

      {error && (
        <p style={{ fontSize: FS.sm, color: RED, marginBottom: "1rem" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        {phase === "think" && (
          <>
            <button onClick={() => void start()} style={btn("primary")}>
              🎙 Nói luôn
            </button>
            <span style={{ fontSize: FS.xs, color: "var(--text-muted)" }}>
              Hết {thinkSeconds}s là tự bật thu
            </span>
          </>
        )}
        {phase === "recording" && (
          <button onClick={stop} style={btn("ghost")}>
            ⏹ Xong
          </button>
        )}
        {phase === "processing" && (
          <span style={{ fontSize: FS.sm, color: "var(--text-secondary)" }}>Đang nghe lại và chấm…</span>
        )}
        {phase === "graded" && (
          <button onClick={next} style={btn("primary")} autoFocus>
            {idx + 1 >= tasks.length ? "Xem kết quả" : "Câu tiếp"}
          </button>
        )}
      </div>
    </div>
  );
}
