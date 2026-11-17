"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicState = "idle" | "requesting" | "ready" | "recording" | "denied" | "unsupported";

export interface Recording {
  blob: Blob;
  url: string;
  durationSec: number;
}

interface StartOptions {
  /** Dừng hẳn sau chừng này giây dù vẫn đang nói. */
  maxSec: number;
  /** Tự dừng khi đã nói rồi im lặng liên tục chừng này ms. Bỏ trống = chỉ dừng tay. */
  stopOnSilenceMs?: number;
  /** Tự dừng nếu chưa nói gì sau chừng này giây. */
  noSpeechTimeoutSec?: number;
}

const SPEECH_LEVEL = 0.02;

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

/**
 * Ghi âm giọng học viên. Giữ luồng mic mở suốt phiên để những lần ghi sau bắt
 * đầu ngay, không hỏi quyền lại. `level` là âm lượng tức thời 0..1 cho đồng hồ mức.
 */
export function useRecorder() {
  const [state, setState] = useState<MicState>("idle");
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef(0);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { if (recRef.current?.state === "recording") recRef.current.stop(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const ensureStream = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("unsupported");
      return false;
    }
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      setState("ready");
      return true;
    } catch (e) {
      const name = (e as DOMException)?.name;
      setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unsupported");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    const r = recRef.current;
    if (r && r.state === "recording") r.stop();
  }, []);

  /** Bắt đầu ghi; promise trả bản ghi khi dừng (tay, im lặng hoặc hết giờ), null nếu không ghi được. */
  const start = useCallback(
    async (opts: StartOptions): Promise<Recording | null> => {
      if (recRef.current?.state === "recording") return null;
      if (!(await ensureStream())) return null;
      const stream = streamRef.current!;
      const analyser = analyserRef.current!;
      await ctxRef.current?.resume().catch(() => {});

      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recRef.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

      const t0 = performance.now();
      let spoke = false;
      let silentSince = 0;
      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const lvl = Math.sqrt(s / buf.length);
        // Làm tròn để React bỏ qua lần render trùng giá trị — đồng hồ mức không cần 60 lần/giây.
        setLevel(Math.round(Math.min(1, lvl * 8) * 20) / 20);
        const now = performance.now();
        const elapsed = (now - t0) / 1000;
        if (lvl > SPEECH_LEVEL) { spoke = true; silentSince = 0; }
        else if (spoke && !silentSince) silentSince = now;
        const silenceHit = opts.stopOnSilenceMs && spoke && silentSince && now - silentSince >= opts.stopOnSilenceMs;
        const noSpeech = opts.noSpeechTimeoutSec && !spoke && elapsed >= opts.noSpeechTimeoutSec;
        if (elapsed >= opts.maxSec || silenceHit || noSpeech) { stop(); return; }
        rafRef.current = requestAnimationFrame(tick);
      };

      return new Promise<Recording | null>((resolve) => {
        rec.onstop = () => {
          cancelAnimationFrame(rafRef.current);
          setLevel(0);
          setState("ready");
          if (!chunks.length) { resolve(null); return; }
          const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
          const url = URL.createObjectURL(blob);
          urlsRef.current.push(url);
          resolve({ blob, url, durationSec: (performance.now() - t0) / 1000 });
        };
        rec.start();
        setState("recording");
        rafRef.current = requestAnimationFrame(tick);
      });
    },
    [ensureStream, stop]
  );

  return { state, level, start, stop };
}
