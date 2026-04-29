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
    <div className="card p-4 mb-6">
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

      {/* Seekbar */}
      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--bg-tertiary) ${pct}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
          <span>{fmt(currentTime)}</span>
          <span>{duration > 0 ? fmt(duration) : "--:--"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Replay -5s */}
        <button
          onClick={handleReplay}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Lùi 5 giây"
        >
          <RotateCcw size={15} />
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!isLoaded}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isBuffering ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* Speed */}
        <div className="flex items-center gap-1 ml-auto">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-xs px-2 py-1 rounded font-mono font-medium transition-colors ${
                speed === s
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
