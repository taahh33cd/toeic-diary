"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { RotateCcw, SkipForward, Play, Pause, CheckCircle2, XCircle } from "lucide-react";
import { saveProgress } from "@/app/actions/saveProgress";
import { getTimeSpent } from "@/stores/practiceStore";
import { generateBlanks, GeneratedBlank } from "@/lib/generateBlanks";

interface Sentence {
  id: string;
  orderIndex: number;
  content: string;
  startTime: number;
  endTime: number;
  speaker: string | null;
}

interface Props {
  lessonId: string;
  audioUrl: string;
  sentences: Sentence[];
  startTime: number | null;
  onScored: (score: number) => void;
}

type BlankStatus = "idle" | "correct" | "wrong";

interface BlankState {
  value: string;
  status: BlankStatus;
  confirmed: boolean;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5];
const MAX_REPLAY = 5;
const BLANK_COUNT = 5;

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9']/g, "");
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function Level2Practice({ lessonId, audioUrl, sentences, startTime: sessionStart, onScored }: Props) {
  // Stable seed per mount so blanks stay consistent during a session
  const seed = useMemo(() => Math.floor(Math.random() * 10000), []);

  // Generate blanks for each sentence (runtime, not from DB)
  const sentencesWithBlanks = useMemo(() =>
    sentences.map((s) => ({
      ...s,
      blanks: generateBlanks(s.id, s.content, BLANK_COUNT, seed),
    })),
  [sentences, seed]);

  const blankSentences = sentencesWithBlanks.filter((s) => s.blanks.length > 0);

  const [activeIdx, setActiveIdx] = useState(() =>
    sentencesWithBlanks.findIndex((s) => s.blanks.length > 0) ?? 0
  );

  const [blankStates, setBlankStates] = useState<Record<string, BlankState>>(() => {
    const init: Record<string, BlankState> = {};
    sentencesWithBlanks.forEach((s) =>
      s.blanks.forEach((b) => {
        init[b.id] = { value: "", status: "idle", confirmed: false };
      })
    );
    return init;
  });

  const [replayCounts, setReplayCounts] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrent, setAudioCurrent] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const replayStateRef = useRef<{ sentenceId: string; count: number }>({ sentenceId: "", count: 0 });

  const [showSubmit, setShowSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeSentence = sentencesWithBlanks[activeIdx];
  const activeBlankIdx = blankSentences.findIndex((s) => s.id === activeSentence?.id);
  const replayCount = replayCounts[activeSentence?.id ?? ""] ?? 0;

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSentence) return;

    replayStateRef.current = { sentenceId: activeSentence.id, count: 0 };
    setReplayCounts((prev) => ({ ...prev, [activeSentence.id]: 0 }));

    const doSeekAndPlay = () => {
      const seekTo = activeSentence.startTime > 0 ? activeSentence.startTime : 0;
      audio.currentTime = seekTo;
      audio.play().catch(() => {});
      setIsPlaying(true);
    };

    if (audio.readyState >= 2) {
      doSeekAndPlay();
    } else {
      audio.addEventListener("canplay", doSeekAndPlay, { once: true });
      audio.load();
    }
  }, [activeIdx]);

  useEffect(() => {
    if (!activeSentence || activeSentence.blanks.length === 0) return;
    const firstBlank = activeSentence.blanks[0];
    const timer = setTimeout(() => inputRefs.current[firstBlank.id]?.focus(), 80);
    return () => clearTimeout(timer);
  }, [activeIdx]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !activeSentence) return;
    const t = audio.currentTime;
    setAudioCurrent(t);

    if (activeSentence.blanks.length === 0) return;
    const endTime = activeSentence.endTime;
    if (endTime <= 0) return;

    if (t >= endTime + 0.5) {
      const state = replayStateRef.current;
      if (state.sentenceId !== activeSentence.id) return;
      if (state.count < MAX_REPLAY - 1) {
        state.count += 1;
        setReplayCounts((prev) => ({ ...prev, [activeSentence.id]: state.count }));
        audio.currentTime = activeSentence.startTime > 0 ? activeSentence.startTime : 0;
        audio.play().catch(() => {});
      } else {
        state.count = MAX_REPLAY;
        setReplayCounts((prev) => ({ ...prev, [activeSentence.id]: MAX_REPLAY }));
        audio.pause();
        setIsPlaying(false);
      }
    }
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  }

  function handleReplay() {
    const audio = audioRef.current;
    if (!audio || !activeSentence) return;
    const seekTo = activeSentence.startTime > 0 ? activeSentence.startTime : 0;
    replayStateRef.current = { sentenceId: activeSentence.id, count: 0 };
    setReplayCounts((prev) => ({ ...prev, [activeSentence.id]: 0 }));
    audio.currentTime = seekTo;
    audio.play().catch(() => {});
    setIsPlaying(true);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || audioDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioDuration;
  }

  function advanceToNextBlankSentence() {
    audioRef.current?.pause();
    setIsPlaying(false);
    const nextIdx = sentencesWithBlanks.findIndex((s, i) => i > activeIdx && s.blanks.length > 0);
    if (nextIdx === -1) setShowSubmit(true);
    else setActiveIdx(nextIdx);
  }

  function focusNextOrAdvance(currentBlankId: string) {
    if (!activeSentence) return;
    const idx = activeSentence.blanks.findIndex((b) => b.id === currentBlankId);
    const nextBlank = activeSentence.blanks
      .slice(idx + 1)
      .find((b) => blankStates[b.id]?.status === "idle");
    if (nextBlank) {
      inputRefs.current[nextBlank.id]?.focus();
    } else {
      setTimeout(() => advanceToNextBlankSentence(), 500);
    }
  }

  function handleInput(blankId: string, value: string) {
    setBlankStates((prev) => ({
      ...prev,
      [blankId]: { ...prev[blankId], value, status: "idle", confirmed: false },
    }));
  }

  function handleEnter(blankId: string) {
    const blankDef = activeSentence?.blanks.find((b) => b.id === blankId);
    if (!blankDef) return;
    const state = blankStates[blankId];

    if (state.status === "wrong" && !state.confirmed) {
      setBlankStates((prev) => ({ ...prev, [blankId]: { ...prev[blankId], confirmed: true } }));
      focusNextOrAdvance(blankId);
      return;
    }
    if (state.status !== "idle") { focusNextOrAdvance(blankId); return; }

    const correct = normalize(state.value) === normalize(blankDef.answer);
    setBlankStates((prev) => ({
      ...prev,
      [blankId]: { ...prev[blankId], status: correct ? "correct" : "wrong", confirmed: correct },
    }));
    if (correct) focusNextOrAdvance(blankId);
  }

  async function handleSubmit() {
    const allBlanks = sentencesWithBlanks.flatMap((s) => s.blanks);
    const correctCount = allBlanks.filter((b) => blankStates[b.id]?.status === "correct").length;
    const score = allBlanks.length > 0 ? Math.round((correctCount / allBlanks.length) * 100) : 0;

    setFinalScore(score);
    setSubmitted(true);
    onScored(score);

    await saveProgress({
      lessonId,
      level: 2,
      score,
      status: score >= 70 ? "completed" : "in_progress",
      userAnswer: JSON.stringify(
        Object.fromEntries(Object.entries(blankStates).map(([id, s]) => [id, s.value]))
      ),
      timeSpentSeconds: getTimeSpent(sessionStart),
    });
  }

  function renderWords(sentence: typeof sentencesWithBlanks[0]) {
    const words = sentence.content.split(" ");
    const blankByPos = new Map<number, GeneratedBlank>(sentence.blanks.map((b) => [b.position, b]));

    return words.map((word, i) => {
      const blank = blankByPos.get(i);
      if (!blank) {
        return <span key={i} className="text-[var(--text-primary)]">{word}</span>;
      }

      const bs = blankStates[blank.id];
      const isCorrect = bs?.status === "correct";
      const isWrong = bs?.status === "wrong";

      return (
        <span key={i} className="inline-flex flex-col items-center mx-1 relative" style={{ verticalAlign: "bottom" }}>
          <input
            ref={(el) => { inputRefs.current[blank.id] = el; }}
            type="text"
            value={bs?.value ?? ""}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => handleInput(blank.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleEnter(blank.id); }
              if (e.key === " ") e.preventDefault();
            }}
            disabled={submitted || isCorrect || bs?.confirmed}
            placeholder={blank.hint}
            className={`
              h-11 px-2 text-xl text-center rounded-xl border-2 font-mono outline-none transition-all
              ${isCorrect ? "border-emerald-400 bg-emerald-500/10 text-emerald-400" : ""}
              ${isWrong && !bs?.confirmed ? "border-red-400 bg-red-500/10 text-red-400" : ""}
              ${isWrong && bs?.confirmed ? "border-red-400/40 bg-red-500/5 text-red-400/60" : ""}
              ${!isCorrect && !isWrong ? "border-[#006591]/40 bg-white text-[#0b1c30] focus:border-[#006591] focus:bg-white" : ""}
            `}
            style={{ width: `${Math.max(5, (blank.hint).length + 3)}ch` }}
          />
          {isWrong && !bs?.confirmed && (
            <span className="absolute -bottom-5 text-xs text-emerald-400 font-mono whitespace-nowrap">
              {blank.answer}
            </span>
          )}
        </span>
      );
    });
  }

  // Score screen
  if (submitted && finalScore !== null) {
    const allBlanks = sentencesWithBlanks.flatMap((s) => s.blanks);
    const correctCount = allBlanks.filter((b) => blankStates[b.id]?.status === "correct").length;
    return (
      <div className="flex flex-col items-center gap-5 py-16">
        <div className={`text-7xl font-display font-bold tabular-nums ${finalScore >= 70 ? "text-emerald-400" : "text-orange-400"}`}>
          {finalScore}
        </div>
        <div className="text-[var(--text-muted)] text-sm">
          {correctCount}/{allBlanks.length} blank đúng
        </div>
        {finalScore >= 70 ? (
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 size={18} />
            Đạt — Level 2 hoàn thành!
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-orange-400 font-medium">
              <XCircle size={18} />
              Chưa đạt — cần luyện thêm
            </div>
            <button onClick={() => window.location.reload()} className="btn-secondary px-8 py-2 rounded-xl text-sm">
              Thử lại
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Audio bar */}
      <div style={{ background: "#eff4ff", border: "1px solid #bec8d2", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3e4850", fontFamily: "monospace", width: 36 }}>{fmt(audioCurrent)}</span>
          <div
            style={{ position: "relative", flex: 1, height: 6, background: "#bec8d2", borderRadius: 9999, cursor: "pointer" }}
            onClick={handleSeek}
          >
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${audioDuration > 0 ? (audioCurrent / audioDuration) * 100 : 0}%`, background: "#006591", borderRadius: 9999, transition: "width 0.1s" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3e4850", fontFamily: "monospace", width: 36, textAlign: "right" }}>{audioDuration > 0 ? fmt(audioDuration) : "--:--"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={togglePlay}
            style={{ width: 48, height: 48, borderRadius: "50%", background: "#006591", color: "#ffffff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,101,145,0.2)", flexShrink: 0 }}
            className="active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", background: "#e5eeff", borderRadius: 9999, padding: "6px 12px", gap: 4, border: "1px solid rgba(190,200,210,0.3)" }}>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer", background: speed === s ? "#006591" : "transparent", color: speed === s ? "#ffffff" : "#3e4850", transition: "all 0.15s" }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs text-[var(--text-muted)]">
          {activeBlankIdx >= 0 ? `Câu ${activeBlankIdx + 1} / ${blankSentences.length}` : "Hoàn thành"}
        </span>
        <div className="flex gap-1.5">
          {blankSentences.map((s) => {
            const allCorrect = s.blanks.every((b) => blankStates[b.id]?.status === "correct");
            const anyWrong = s.blanks.some((b) => blankStates[b.id]?.status === "wrong");
            const isActive = s.id === activeSentence?.id;
            return (
              <div key={s.id} className={`rounded-full transition-all duration-300 ${
                allCorrect ? "w-2 h-2 bg-emerald-400" : anyWrong ? "w-2 h-2 bg-orange-400"
                : isActive ? "w-4 h-2 bg-[#006591]" : "w-2 h-2 bg-[#dce9ff]"
              }`} />
            );
          })}
        </div>
      </div>

      {/* Teleprompter */}
      {!showSubmit && activeSentence && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-10 min-h-[260px]">
          {activeSentence.speaker && (
            <div className={`text-xs font-bold uppercase tracking-widest mb-5 ${
              activeSentence.speaker === "W" ? "text-pink-400"
              : activeSentence.speaker === "M" ? "text-blue-400"
              : "text-[var(--text-muted)]"
            }`}>
              {activeSentence.speaker === "W" ? "Woman" : activeSentence.speaker === "M" ? "Man" : activeSentence.speaker}
            </div>
          )}
          <div className="text-2xl md:text-3xl leading-loose font-medium flex flex-wrap justify-center items-end gap-x-1 gap-y-3 mb-4">
            {activeSentence.blanks.length > 0
              ? renderWords(activeSentence)
              : <span className="text-[var(--text-primary)]">{activeSentence.content}</span>}
          </div>
          {activeSentence.blanks.length > 0 && !isPlaying && replayCount === 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-4 animate-pulse">↓ Bấm Replay để nghe câu này</p>
          )}
        </div>
      )}

      {/* Submit screen */}
      {showSubmit && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-[var(--text-muted)] text-sm">Bạn đã hoàn thành tất cả các câu!</p>
          <button onClick={handleSubmit} className="btn-primary px-12 py-3 rounded-xl font-display font-bold text-lg">
            Nộp bài
          </button>
        </div>
      )}

      {/* Bottom controls */}
      {!showSubmit && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#bec8d2]">
          <div className="flex items-center gap-3">
            <button onClick={handleReplay} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#bec8d2] text-sm text-[#3e4850] hover:bg-[#eff4ff] transition-colors">
              <RotateCcw size={13} />
              Replay
            </button>
            <div className="flex gap-1">
              {Array.from({ length: MAX_REPLAY }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < replayCount ? "bg-[#006591]" : "bg-[#dce9ff]"}`} />
              ))}
            </div>
          </div>
          <button onClick={advanceToNextBlankSentence} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#bec8d2] text-sm text-[#3e4850] hover:bg-[#eff4ff] transition-colors">
            Skip <SkipForward size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
