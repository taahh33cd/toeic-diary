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
    <div style={{ background: "#eff4ff", border: "1px solid #bec8d2", borderRadius: 16, padding: 24, marginBottom: 32 }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3e4850", fontFamily: "monospace", width: 36 }}>
            {fmt(currentTime)}
          </span>
          <div style={{ position: "relative", flex: 1, height: 6, background: "#bec8d2", borderRadius: 9999, cursor: "pointer" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, background: "#006591", borderRadius: 9999, transition: "width 0.1s" }} />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", margin: 0 }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3e4850", fontFamily: "monospace", width: 36, textAlign: "right" }}>
            {duration > 0 ? fmt(duration) : "--:--"}
          </span>
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Replay */}
          <button
            onClick={handleReplay}
            title="Lùi 5 giây"
            style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: "#3e4850", borderRadius: 8, transition: "color 0.2s" }}
            className="hover:text-[#006591]"
          >
            <RotateCcw size={20} />
          </button>

          {/* Play / Pause — center */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!isLoaded}
            style={{
              width: 56, height: 56,
              borderRadius: "50%",
              background: "#006591",
              color: "#ffffff",
              border: "none",
              cursor: isLoaded ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isLoaded ? 1 : 0.4,
              boxShadow: "0 4px 12px rgba(0,101,145,0.25)",
              transition: "transform 0.1s",
              flexShrink: 0,
            }}
            className="active:scale-95"
          >
            {isBuffering ? (
              <span style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} style={{ marginLeft: 2 }} />
            )}
          </button>

          {/* Speed controls */}
          <div style={{ display: "flex", alignItems: "center", background: "#e5eeff", borderRadius: 9999, padding: "6px 12px", gap: 4, border: "1px solid rgba(190,200,210,0.3)" }}>
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  fontSize: 12, fontWeight: 600, fontFamily: "monospace",
                  padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                  background: speed === s ? "#006591" : "transparent",
                  color: speed === s ? "#ffffff" : "#3e4850",
                  transition: "all 0.15s",
                }}
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
