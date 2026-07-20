"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying, currentTime, duration, isLoaded, isBuffering, speed,
    setIsPlaying, setCurrentTime, setDuration, setIsLoaded, setIsBuffering, setSpeed, setAudioUrl,
    loopAB,
  } = useAudioStore();

  // Sync URL
  useEffect(() => {
    setAudioUrl(audioUrl);
  }, [audioUrl, setAudioUrl]);

  // Sync speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Detached <audio> keeps playing after unmount — stop it explicitly
  useEffect(() => {
    const audio = audioRef.current;
    return () => { audio?.pause(); };
  }, []);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying, isLoaded, setIsPlaying]);

  // Loop A-B enforcement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!loopAB.isLooping || loopAB.pointA === null || loopAB.pointB === null) return;
    if (currentTime >= loopAB.pointB) {
      audio.currentTime = loopAB.pointA;
    }
  }, [currentTime, loopAB]);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  }

  function handleReplay() {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-6 mb-8 shadow-sm">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setDuration((e.target as HTMLAudioElement).duration);
          setIsLoaded(true);
        }}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Seekbar row */}
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-xs font-semibold text-[var(--text-secondary)] w-9">{fmt(currentTime)}</span>
          <div className="relative flex-1 h-2 bg-[var(--bg-secondary)] rounded-full cursor-pointer group">
            <div className="absolute top-0 left-0 h-full bg-[var(--practice-accent)] rounded-full transition-[width] duration-100" style={{ width: `${pct}%` }} />
            <div
              className="absolute w-4 h-4 bg-[var(--practice-accent)] border-2 border-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)" }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="font-mono text-xs font-semibold text-[var(--text-secondary)] w-9 text-right">
            {duration > 0 ? fmt(duration) : "--:--"}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Replay -5s */}
          <button
            onClick={handleReplay}
            title="Lùi 5 giây"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--practice-accent)] transition-colors rounded-lg"
          >
            <RotateCcw size={20} />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!isLoaded}
            className="w-14 h-14 rounded-full bg-[var(--practice-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--practice-accent)]/25 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-default flex-shrink-0"
          >
            {isBuffering ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} style={{ marginLeft: 2 }} />
            )}
          </button>

          {/* Speed controls */}
          <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border)]/40">
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-all ${speed === s ? "bg-[var(--practice-accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--practice-accent)]"}`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
