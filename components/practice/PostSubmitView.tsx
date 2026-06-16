"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen, FileText, CheckCircle2, XCircle,
  ArrowRight, RotateCcw, Play, Pause,
} from "lucide-react";
import type { VocabItem } from "./TranscriptVocabModal";

const SPEEDS = [0.75, 1.0, 1.25, 1.5];

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

interface Props {
  score: number;
  levelLabel: string;
  detail: string;            // e.g. "12/15 blank đúng"
  audioUrl: string;
  transcriptFull: string;
  vocabItems: VocabItem[] | null;
  nextLessonUrl?: string | null;
  onRetry: () => void;
}

export function PostSubmitView({
  score, levelLabel, detail, audioUrl, transcriptFull,
  vocabItems, nextLessonUrl, onRetry,
}: Props) {
  const passed = score >= 70;

  // ── Self-contained audio player (starts fresh at 0:00) ──────────────────────
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else { a.play().catch(() => {}); setIsPlaying(true); }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Score bar ── */}
      <div className="flex items-center gap-4 flex-wrap bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] px-5 py-4">
        <span className={`text-5xl font-display font-bold tabular-nums leading-none ${passed ? "text-emerald-400" : "text-orange-400"}`}>
          {score}
        </span>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 font-semibold text-sm ${passed ? "text-emerald-400" : "text-orange-400"}`}>
            {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {passed ? `Đạt — ${levelLabel} hoàn thành!` : "Chưa đạt — cần luyện thêm"}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{detail}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--practice-accent)] hover:text-[var(--practice-accent)] transition-all"
          >
            <RotateCcw size={13} />
            Thử lại
          </button>
          {nextLessonUrl && (
            <button
              onClick={() => { window.location.href = nextLessonUrl; }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity"
            >
              Tiếp theo <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Audio player ── */}
      <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-5">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
          onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        <div className="flex flex-col md:flex-row items-center gap-5">
          {/* Play button */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-[var(--practice-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--practice-accent)]/20 hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
          </button>
          {/* Seekbar */}
          <div className="flex-grow w-full">
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">{fmt(current)}</span>
              <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">{duration > 0 ? fmt(duration) : "--:--"}</span>
            </div>
            <div
              className="relative h-2 bg-[var(--bg-secondary)] rounded-full cursor-pointer group"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSeek}
            >
              <div
                className="absolute top-0 left-0 h-full bg-[var(--practice-accent)] rounded-full transition-[width] duration-100"
                style={{ width: `${duration > 0 ? (current / duration) * 100 : 0}%` }}
              />
              <div
                className="absolute w-4 h-4 bg-[var(--practice-accent)] border-2 border-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ top: "50%", left: `${duration > 0 ? (current / duration) * 100 : 0}%`, transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>
          {/* Speed */}
          <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border)]/40">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-all ${
                  speed === s ? "bg-[var(--practice-accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--practice-accent)]"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Transcript ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-[var(--practice-accent)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Transcript</span>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
          {transcriptFull}
        </div>
      </section>

      {/* ── Vocabulary ── */}
      {vocabItems && vocabItems.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-[var(--practice-accent)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Từ vựng trọng điểm</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {vocabItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-elevated)]">
                <div className="flex items-baseline gap-2.5 flex-wrap mb-1.5">
                  <span className="font-bold text-[var(--text-primary)] text-base">{item.word}</span>
                  {item.ipa && (
                    <span className="text-xs text-[var(--text-muted)] font-mono">{item.ipa}</span>
                  )}
                  {item.partOfSpeech && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--practice-accent)] font-semibold uppercase tracking-wide">
                      {item.partOfSpeech}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--practice-accent)] mb-1">{item.meaning}</p>
                {item.example && (
                  <p className="text-xs text-[var(--text-secondary)] italic">&ldquo;{item.example}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
