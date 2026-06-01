"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { saveProgress } from "@/app/actions/saveProgress";
import { getTimeSpent } from "@/stores/practiceStore";
import { generateBlanks, GeneratedBlank } from "@/lib/generateBlanks";
import { type VocabItem } from "./TranscriptVocabModal";
import { PostSubmitView } from "./PostSubmitView";

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
  transcriptFull: string;
  onScored: (score: number) => void;
}

type BlankStatus = "idle" | "correct" | "wrong";

interface BlankState {
  value: string;
  status: BlankStatus;
  hintCount: number;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5];
const MAX_REPLAY = 20;
const BLANK_COUNT = 5;
const AUDIO_OFFSET = 0.2;

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9']/g, "");
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function cleanAnswer(answer: string) {
  return answer.replace(/[^a-z0-9']/g, "");
}

export function Level2Practice({ lessonId, audioUrl, sentences, startTime: sessionStart, transcriptFull, onScored }: Props) {
  const seed = useMemo(() => Math.floor(Math.random() * 10000), []);

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
        init[b.id] = { value: "", status: "idle", hintCount: 0 };
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

  const [vocabItems, setVocabItems] = useState<VocabItem[] | null | "error">(null);
  const vocabFetchStartedRef = useRef(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeSentence = sentencesWithBlanks[activeIdx];
  const activeBlankIdx = blankSentences.findIndex((s) => s.id === activeSentence?.id);
  const replayCount = replayCounts[activeSentence?.id ?? ""] ?? 0;

  function isBlankResolved(blank: GeneratedBlank): boolean {
    const bs = blankStates[blank.id];
    if (!bs) return false;
    if (bs.status === "correct") return true;
    return bs.status === "wrong" && bs.hintCount >= cleanAnswer(blank.answer).length;
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSentence) return;

    replayStateRef.current = { sentenceId: activeSentence.id, count: 0 };
    setReplayCounts((prev) => ({ ...prev, [activeSentence.id]: 0 }));

    const seekTo = activeSentence.startTime > 0 ? Math.max(0, activeSentence.startTime - AUDIO_OFFSET) : 0;

    const doSeekAndPlay = () => {
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
        audio.currentTime = activeSentence.startTime > 0 ? Math.max(0, activeSentence.startTime - AUDIO_OFFSET) : 0;
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
    const seekTo = activeSentence.startTime > 0 ? Math.max(0, activeSentence.startTime - AUDIO_OFFSET) : 0;
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

    const blanksAfter = activeSentence.blanks.slice(idx + 1);
    const blanksBefore = activeSentence.blanks.slice(0, idx);
    const ordered = [...blanksAfter, ...blanksBefore];

    const nextBlank = ordered.find((b) => !isBlankResolved(b));

    if (nextBlank) {
      inputRefs.current[nextBlank.id]?.focus();
    } else {
      setTimeout(() => advanceToNextBlankSentence(), 500);
    }
  }

  function handleInput(blankId: string, value: string) {
    setBlankStates((prev) => ({
      ...prev,
      [blankId]: { ...prev[blankId], value, status: "idle" },
    }));
  }

  function handleEnter(blankId: string) {
    const blankDef = activeSentence?.blanks.find((b) => b.id === blankId);
    if (!blankDef) return;
    const state = blankStates[blankId];
    const ca = cleanAnswer(blankDef.answer);

    if (state.status === "correct") { focusNextOrAdvance(blankId); return; }
    if (state.status === "wrong" && state.hintCount >= ca.length) { focusNextOrAdvance(blankId); return; }

    const correct = normalize(state.value) === normalize(blankDef.answer);

    if (correct) {
      setBlankStates((prev) => ({
        ...prev,
        [blankId]: { ...prev[blankId], status: "correct" },
      }));
      focusNextOrAdvance(blankId);
    } else {
      const newHintCount = state.hintCount + 1;
      setBlankStates((prev) => ({
        ...prev,
        [blankId]: { value: "", status: "wrong", hintCount: newHintCount },
      }));
      // No auto-advance when fully revealed — user must press Enter to proceed
    }
  }

  useEffect(() => {
    if (showSubmit) triggerFetchVocab();
  }, [showSubmit]);

  function triggerFetchVocab() {
    if (vocabFetchStartedRef.current) return;
    vocabFetchStartedRef.current = true;
    void fetchVocab();
  }

  function retryVocab() {
    vocabFetchStartedRef.current = false;
    setVocabItems(null);
    triggerFetchVocab();
  }

  async function fetchVocab() {
    try {
      const res = await fetch("/api/ai/extract-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptFull }),
      });
      if (!res.ok) { setVocabItems("error"); return; }
      const data = await res.json();
      setVocabItems(Array.isArray(data.items) && data.items.length > 0 ? data.items : data.items?.length === 0 ? [] : "error");
    } catch {
      setVocabItems("error");
    }
  }

  async function handleSubmit() {
    const allBlanks = sentencesWithBlanks.flatMap((s) => s.blanks);
    const correctCount = allBlanks.filter((b) => blankStates[b.id]?.status === "correct").length;
    const score = allBlanks.length > 0 ? Math.round((correctCount / allBlanks.length) * 100) : 0;

    setFinalScore(score);
    setSubmitted(true);
    onScored(score);

    void saveProgress({
      lessonId,
      level: 2,
      score,
      status: score >= 70 ? "completed" : "in_progress",
      userAnswer: JSON.stringify(
        Object.fromEntries(Object.entries(blankStates).map(([id, s]) => [id, s.value]))
      ),
      timeSpentSeconds: getTimeSpent(sessionStart),
    });
    triggerFetchVocab(); // fallback nếu useEffect chưa kịp trigger
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
      const resolved = isBlankResolved(blank);
      const ca = cleanAnswer(blank.answer);

      const hintStr = bs?.hintCount > 0
        ? ca.slice(0, bs.hintCount) + "*".repeat(Math.max(0, ca.length - bs.hintCount))
        : null;

      return (
        <span key={i} className="inline-flex flex-col items-center mx-1 relative pb-7" style={{ verticalAlign: "bottom" }}>
          <span className="rounded-t bg-[var(--bg-secondary)] px-2 pb-1">
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
              disabled={submitted || bs?.status === "correct"}
              placeholder={blank.hint}
              className={`
                bg-transparent border-b-2 text-3xl md:text-[40px] text-center font-medium outline-none transition-all
                placeholder:text-[var(--text-muted)]
                ${isCorrect ? "border-emerald-400 text-emerald-500" : ""}
                ${isWrong ? "border-red-400 text-red-400" : ""}
                ${resolved && !isCorrect ? "border-red-300/50 text-red-400/60" : ""}
                ${!isCorrect && !isWrong && !resolved ? "border-[var(--border)] focus:border-[var(--practice-accent)] text-[var(--practice-accent)]" : ""}
              `}
              style={{ width: `${Math.max(4, ca.length)}ch` }}
            />
          </span>
          {hintStr && (
            <span className={`absolute bottom-0 text-xs font-mono whitespace-nowrap tracking-wider ${
              bs.hintCount >= ca.length ? "text-emerald-400" : "text-amber-400"
            }`}>
              {hintStr}
            </span>
          )}
        </span>
      );
    });
  }

  if (submitted && finalScore !== null) {
    const allBlanks = sentencesWithBlanks.flatMap((s) => s.blanks);
    const correctCount = allBlanks.filter((b) => blankStates[b.id]?.status === "correct").length;
    return (
      <PostSubmitView
        score={finalScore}
        levelLabel="Level 2"
        detail={`${correctCount}/${allBlanks.length} blank đúng`}
        audioUrl={audioUrl}
        transcriptFull={transcriptFull}
        vocabItems={vocabItems}
        onRetry={() => window.location.reload()}
        onRetryVocab={retryVocab}
      />
    );
  }

  return (
    <div className="flex flex-col pb-32">
      {/* Audio bar */}
      <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-6 mb-6 shadow-sm">
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
        <div className="flex flex-col md:flex-row items-center gap-6">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[var(--practice-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--practice-accent)]/20 hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 2 }} />}
          </button>
          <div className="flex-grow w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">{fmt(audioCurrent)}</span>
              <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">{audioDuration > 0 ? fmt(audioDuration) : "--:--"}</span>
            </div>
            <div
              className="relative h-2 bg-[var(--bg-secondary)] rounded-full cursor-pointer group"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSeek}
            >
              <div className="absolute top-0 left-0 h-full bg-[var(--practice-accent)] rounded-full transition-[width] duration-100" style={{ width: `${audioDuration > 0 ? (audioCurrent / audioDuration) * 100 : 0}%` }} />
              <div
                className="absolute w-4 h-4 bg-[var(--practice-accent)] border-2 border-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ top: "50%", left: `${audioDuration > 0 ? (audioCurrent / audioDuration) * 100 : 0}%`, transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>
          <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border)]/40">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold rounded transition-all ${speed === s ? "bg-[var(--practice-accent)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--practice-accent)]"}`}
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
                : isActive ? "w-4 h-2 bg-[var(--practice-accent)]" : "w-2 h-2 bg-[var(--bg-secondary)]"
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
          <div className="text-3xl md:text-[40px] leading-loose font-medium flex flex-wrap justify-center items-end gap-x-4 gap-y-10 mb-4">
            {activeSentence.blanks.length > 0
              ? renderWords(activeSentence)
              : <span className="text-[var(--text-primary)]">{activeSentence.content}</span>}
          </div>
          {activeSentence.blanks.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-6 select-none">
              ⌨ Gõ vào ô trống · Enter để kiểm tra · Replay để nghe lại
            </p>
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

      {/* Floating bottom action bar */}
      {!submitted && !showSubmit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
          <div className="flex flex-col items-center gap-1.5">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleReplay}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full text-[var(--text-secondary)] hover:border-[var(--practice-accent)] hover:text-[var(--practice-accent)] transition-all shadow-sm text-sm font-medium"
            >
              <RotateCcw size={14} />
              Replay
            </button>
            <div className="flex gap-1">
              {Array.from({ length: MAX_REPLAY }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < replayCount ? "bg-[var(--practice-accent)]" : "bg-[var(--bg-secondary)]"}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
