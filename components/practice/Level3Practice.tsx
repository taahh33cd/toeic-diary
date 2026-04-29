"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCcw, SkipForward, Play, Pause, Eye, CheckCircle2, XCircle } from "lucide-react";
import { saveProgress } from "@/app/actions/saveProgress";
import { getTimeSpent } from "@/stores/practiceStore";
import { Part2Result } from "./Part2Result";

interface Sentence {
  id: string;
  orderIndex: number;
  content: string;
  startTime: number;
  endTime: number;
  speaker: string | null;
  optionLabel?: string | null;
  blanks: { id: string; position: number; answer: string; hint: string | null }[];
}

interface Props {
  lessonId: string;
  audioUrl: string;
  sentences: Sentence[];
  partNumber: number;
  correctOption: string | null;
  explanation: string | null;
  startTime: number | null;
  dbLevel?: number; // DB level to save as (defaults to 3)
  onScored: (score: number) => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5];
const MAX_REPLAY = 5;

function normalizeWord(w: string) {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "").trim();
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

interface WordResult {
  ref: string;
  refNorm: string;
  correct: boolean;
  retryValue: string;
}

type SentencePhase = "blank" | "feedback" | "done" | "revealed";

interface SentenceState {
  phase: SentencePhase;
  inputValue: string;
  wordResults: WordResult[];
}

function buildWordResults(refContent: string, userInput: string): WordResult[] {
  const refWords = refContent.trim().split(/\s+/).filter(Boolean);
  const userWords = userInput.trim().split(/\s+/).filter(Boolean);
  return refWords.map((ref, i) => {
    const refNorm = normalizeWord(ref);
    const userNorm = normalizeWord(userWords[i] ?? "");
    const correct = refNorm === userNorm && refNorm !== "";
    return { ref, refNorm, correct, retryValue: correct ? ref : (userWords[i] ?? "") };
  });
}

function recheckWordResults(prev: WordResult[], retryValues: string[]): WordResult[] {
  return prev.map((wr, i) => {
    if (wr.correct) return wr;
    const userNorm = normalizeWord(retryValues[i] ?? "");
    const correct = userNorm === wr.refNorm && userNorm !== "";
    return { ...wr, correct, retryValue: retryValues[i] ?? "" };
  });
}

function countCorrectWords(wordResults: WordResult[]): number {
  return wordResults.filter((w) => w.correct).length;
}

export function Level3Practice({ lessonId, audioUrl, sentences, partNumber, correctOption, explanation, startTime: sessionStart, dbLevel = 3, onScored }: Props) {
  const isPart2 = partNumber === 2;
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [part2AllDone, setPart2AllDone] = useState(false);

  const [sentenceStates, setSentenceStates] = useState<Record<string, SentenceState>>(() => {
    const init: Record<string, SentenceState> = {};
    sentences.forEach((s) => { init[s.id] = { phase: "blank", inputValue: "", wordResults: [] }; });
    return init;
  });

  const retryInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const mainInputRef = useRef<HTMLInputElement>(null);
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

  const activeSentence = sentences[activeIdx];
  const replayCount = replayCounts[activeSentence?.id ?? ""] ?? 0;
  const activeSentenceState = activeSentence ? sentenceStates[activeSentence.id] : null;

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

    if (audio.readyState >= 2) doSeekAndPlay();
    else { audio.addEventListener("canplay", doSeekAndPlay, { once: true }); audio.load(); }
  }, [activeIdx]);

  useEffect(() => {
    if (!activeSentence) return;
    const state = sentenceStates[activeSentence.id];
    if (state?.phase === "blank") {
      const timer = setTimeout(() => mainInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [activeIdx]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !activeSentence) return;
    const t = audio.currentTime;
    setAudioCurrent(t);
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

  function advanceToNext() {
    audioRef.current?.pause();
    setIsPlaying(false);
    retryInputRefs.current = {};
    if (isPart2) {
      const nextIdx = activeIdx + 1;
      if (nextIdx >= sentences.length) setPart2AllDone(true);
      else setActiveIdx(nextIdx);
    } else {
      const nextIdx = activeIdx + 1;
      if (nextIdx >= sentences.length) setShowSubmit(true);
      else setActiveIdx(nextIdx);
    }
  }

  function handleSkip() {
    if (activeSentence && activeSentenceState?.phase !== "done") {
      setSentenceStates((prev) => ({
        ...prev,
        [activeSentence.id]: { ...prev[activeSentence.id], phase: "revealed", wordResults: buildWordResults(activeSentence.content, "") },
      }));
    }
    advanceToNext();
  }

  function updateInput(sentenceId: string, value: string) {
    setSentenceStates((prev) => ({ ...prev, [sentenceId]: { ...prev[sentenceId], inputValue: value } }));
  }

  function submitSentence(sentenceId: string) {
    const s = sentences.find((x) => x.id === sentenceId);
    const state = sentenceStates[sentenceId];
    if (!s || !state) return;
    const results = buildWordResults(s.content, state.inputValue);
    const allCorrect = results.every((w) => w.correct);
    setSentenceStates((prev) => ({
      ...prev,
      [sentenceId]: { ...prev[sentenceId], phase: allCorrect ? "done" : "feedback", wordResults: results },
    }));
    if (allCorrect) setTimeout(() => advanceToNext(), 500);
  }

  function handleMainInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>, sentenceId: string) {
    if (e.key === "Enter") { e.preventDefault(); submitSentence(sentenceId); }
  }

  function recheckSentence(sentenceId: string) {
    const state = sentenceStates[sentenceId];
    if (!state || state.phase !== "feedback") return;
    const retryValues = state.wordResults.map((_, i) =>
      state.wordResults[i].correct ? state.wordResults[i].ref : (retryInputRefs.current[i]?.value ?? state.wordResults[i].retryValue)
    );
    const newResults = recheckWordResults(state.wordResults, retryValues);
    const allCorrect = newResults.every((w) => w.correct);
    const updatedResults = newResults.map((wr, i) => ({ ...wr, retryValue: retryValues[i] ?? wr.retryValue }));
    setSentenceStates((prev) => ({
      ...prev,
      [sentenceId]: { ...prev[sentenceId], phase: allCorrect ? "done" : "feedback", wordResults: updatedResults },
    }));
    if (allCorrect) setTimeout(() => advanceToNext(), 500);
    else {
      const firstWrongIdx = updatedResults.findIndex((w) => !w.correct);
      if (firstWrongIdx !== -1) setTimeout(() => retryInputRefs.current[firstWrongIdx]?.focus(), 50);
    }
  }

  function handleRetryKeyDown(e: React.KeyboardEvent<HTMLInputElement>, sentenceId: string, wordIdx: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const state = sentenceStates[sentenceId];
      if (!state) return;
      const wrongIndices = state.wordResults.map((w, i) => (!w.correct ? i : -1)).filter((i) => i !== -1);
      const currentPos = wrongIndices.indexOf(wordIdx);
      const nextIdx = wrongIndices[currentPos + 1];
      if (nextIdx !== undefined) retryInputRefs.current[nextIdx]?.focus();
      else recheckSentence(sentenceId);
    }
  }

  function showAnswer(sentenceId: string) {
    const s = sentences.find((x) => x.id === sentenceId);
    const state = sentenceStates[sentenceId];
    if (!s || !state) return;
    const results = s.content.trim().split(/\s+/).map((ref) => ({
      ref, refNorm: normalizeWord(ref), correct: false, retryValue: ref,
    }));
    setSentenceStates((prev) => ({ ...prev, [sentenceId]: { ...prev[sentenceId], phase: "revealed", wordResults: results } }));
  }

  async function handleSubmit() {
    let totalWords = 0;
    let correctWords = 0;
    sentences.forEach((s) => {
      const state = sentenceStates[s.id];
      const refWords = s.content.trim().split(/\s+/).filter(Boolean);
      totalWords += refWords.length;
      if (state?.wordResults?.length > 0) correctWords += countCorrectWords(state.wordResults);
    });
    let score = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    if (isPart2 && correctOption) {
      const answerScore = selectedOption === correctOption ? 100 : 0;
      score = Math.round(score * 0.7 + answerScore * 0.3);
    }
    setFinalScore(score);
    setSubmitted(true);
    onScored(score);
    await saveProgress({
      lessonId,
      level: dbLevel,
      score,
      status: score >= 70 ? "completed" : "in_progress",
      userAnswer: JSON.stringify(sentences.map((s) => ({ id: s.id, words: sentenceStates[s.id]?.wordResults?.map((w) => w.retryValue) ?? [] }))),
      timeSpentSeconds: getTimeSpent(sessionStart),
    });
  }

  function renderBlankPlaceholder(sentence: Sentence) {
    const wordCount = sentence.content.trim().split(/\s+/).filter(Boolean).length;
    return (
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {Array.from({ length: wordCount }).map((_, i) => (
          <span key={i} className="text-2xl md:text-3xl font-mono text-[var(--text-muted)] select-none">_</span>
        ))}
      </div>
    );
  }

  function renderFeedback(sentence: Sentence, state: SentenceState, revealed: boolean) {
    const { wordResults } = state;
    if (!wordResults || wordResults.length === 0) return null;
    return (
      <div className="flex flex-wrap justify-center items-end gap-x-2 gap-y-3">
        {wordResults.map((wr, i) => {
          if (wr.correct) return <span key={i} className="text-2xl md:text-3xl font-medium text-emerald-400">{wr.ref}</span>;
          if (revealed) return <span key={i} className="text-2xl md:text-3xl font-medium text-orange-400">{wr.ref}</span>;
          return (
            <span key={i} className="inline-flex flex-col items-center gap-1">
              <input
                key={`retry-${sentence.id}-${i}`}
                ref={(el) => { retryInputRefs.current[i] = el; }}
                type="text"
                defaultValue={wr.retryValue}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                onKeyDown={(e) => handleRetryKeyDown(e, sentence.id, i)}
                className="h-10 px-2 text-lg text-center rounded-xl border-2 border-red-400/60 bg-red-500/10 text-red-300 font-mono outline-none focus:border-red-400 transition-all"
                style={{ width: `${Math.max(4, wr.ref.length + 2)}ch` }}
              />
              <span className="text-xs text-[var(--text-muted)] font-mono">{wr.ref.length} letters</span>
            </span>
          );
        })}
      </div>
    );
  }

  // Score screen
  if (submitted && finalScore !== null) {
    let totalWords = 0; let correctWords = 0;
    sentences.forEach((s) => {
      const state = sentenceStates[s.id];
      const refWords = s.content.trim().split(/\s+/).filter(Boolean);
      totalWords += refWords.length;
      if (state?.wordResults?.length > 0) correctWords += countCorrectWords(state.wordResults);
    });
    return (
      <div className="flex flex-col items-center gap-5 py-16">
        <div className={`text-7xl font-display font-bold tabular-nums ${finalScore >= 70 ? "text-emerald-400" : "text-orange-400"}`}>{finalScore}</div>
        <div className="text-[var(--text-muted)] text-sm">{correctWords}/{totalWords} từ đúng</div>
        {finalScore >= 70 ? (
          <div className="flex items-center gap-2 text-emerald-400 font-medium"><CheckCircle2 size={18} />Đạt — Level 3 hoàn thành!</div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-orange-400 font-medium"><XCircle size={18} />Chưa đạt — cần luyện thêm</div>
            <button onClick={() => window.location.reload()} className="btn-secondary px-8 py-2 rounded-xl text-sm">Thử lại</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="card p-3 mb-5 flex items-center gap-3">
        <audio
          ref={audioRef} src={audioUrl} preload="auto"
          onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}
        />
        <button onClick={togglePlay} className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity">
          {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden cursor-pointer" onClick={handleSeek}>
          <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${audioDuration > 0 ? (audioCurrent / audioDuration) * 100 : 0}%` }} />
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums flex-shrink-0">{fmt(audioCurrent)}</span>
        <div className="flex gap-0.5 flex-shrink-0">
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={`text-xs px-1.5 py-0.5 rounded font-mono transition-colors ${speed === s ? "bg-[var(--accent-primary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {!isPart2 && (
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs text-[var(--text-muted)]">Câu {activeIdx + 1} / {sentences.length}</span>
          <div className="flex gap-1.5">
            {sentences.map((s, i) => {
              const state = sentenceStates[s.id];
              const isDone = state?.phase === "done"; const isRevealed = state?.phase === "revealed";
              const isFeedback = state?.phase === "feedback"; const isActive = i === activeIdx;
              return (
                <div key={s.id} className={`rounded-full transition-all duration-300 ${
                  isDone ? "w-2 h-2 bg-emerald-400" : isRevealed ? "w-2 h-2 bg-[var(--text-muted)]"
                  : isFeedback ? "w-2 h-2 bg-orange-400" : isActive ? "w-4 h-2 bg-[var(--accent-primary)]" : "w-2 h-2 bg-[var(--bg-tertiary)]"
                }`} />
              );
            })}
          </div>
        </div>
      )}

      {isPart2 && part2AllDone && (
        <Part2Result
          sentences={sentences} answerRevealed={answerRevealed} selectedOption={selectedOption}
          correctOption={correctOption} explanation={explanation}
          onSelect={(opt) => { setSelectedOption(opt); setAnswerRevealed(true); }}
        />
      )}

      {!(isPart2 ? part2AllDone : showSubmit) && activeSentence && activeSentenceState && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-10 min-h-[260px]">
          {isPart2 && activeSentence.optionLabel && (
            <div className="text-xs font-bold uppercase tracking-widest mb-5 text-[var(--accent-primary)]">Đáp án {activeSentence.optionLabel}</div>
          )}
          {activeSentence.speaker && !isPart2 && (
            <div className={`text-xs font-bold uppercase tracking-widest mb-5 ${activeSentence.speaker === "W" ? "text-pink-400" : activeSentence.speaker === "M" ? "text-blue-400" : "text-[var(--text-muted)]"}`}>
              {activeSentence.speaker === "W" ? "Woman" : activeSentence.speaker === "M" ? "Man" : activeSentence.speaker}
            </div>
          )}
          <div className="mb-6 min-h-[80px] flex items-center justify-center">
            {activeSentenceState.phase === "blank" && renderBlankPlaceholder(activeSentence)}
            {activeSentenceState.phase === "feedback" && renderFeedback(activeSentence, activeSentenceState, false)}
            {activeSentenceState.phase === "revealed" && renderFeedback(activeSentence, activeSentenceState, true)}
            {activeSentenceState.phase === "done" && <div className="text-2xl md:text-3xl font-medium text-emerald-400">{activeSentence.content}</div>}
          </div>
          {activeSentenceState.phase === "blank" && (
            <div className="w-full max-w-lg">
              <input
                ref={mainInputRef} type="text" value={activeSentenceState.inputValue}
                onChange={(e) => updateInput(activeSentence.id, e.target.value)}
                onKeyDown={(e) => handleMainInputKeyDown(e, activeSentence.id)}
                placeholder="Gõ những gì bạn nghe được..."
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--accent-primary)]/40 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-mono text-base outline-none focus:border-[var(--accent-primary)] transition-colors text-center"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">Nhấn Enter để kiểm tra</p>
            </div>
          )}
          {activeSentenceState.phase === "feedback" && (
            <div className="flex items-center gap-3 mt-4">
              <button onClick={() => recheckSentence(activeSentence.id)} className="btn-primary px-5 py-2 rounded-xl text-sm font-bold">Kiểm tra lại</button>
              <button onClick={() => showAnswer(activeSentence.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border-primary)]">
                <Eye size={13} />Xem đáp án
              </button>
            </div>
          )}
          {activeSentenceState.phase === "revealed" && (
            <button onClick={() => advanceToNext()} className="btn-secondary px-6 py-2 rounded-xl text-sm mt-4">Câu tiếp theo →</button>
          )}
          {activeSentenceState.phase === "done" && <p className="text-xs text-emerald-400 animate-pulse mt-2">Đúng rồi!</p>}
        </div>
      )}

      {showSubmit && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-[var(--text-muted)] text-sm">Bạn đã hoàn thành tất cả các câu!</p>
          <button onClick={handleSubmit} className="btn-primary px-12 py-3 rounded-xl font-display font-bold text-lg">Nộp bài</button>
        </div>
      )}

      {(isPart2 ? (!part2AllDone || answerRevealed) : !showSubmit) && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <button onClick={handleReplay} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
              <RotateCcw size={13} />Replay
            </button>
            <div className="flex gap-1">
              {Array.from({ length: MAX_REPLAY }).map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < replayCount ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-tertiary)]"}`} />
              ))}
            </div>
          </div>
          {isPart2 && answerRevealed ? (
            <button onClick={handleSubmit} className="btn-primary px-6 py-2 rounded-xl font-bold text-sm">Nộp bài</button>
          ) : (
            <button onClick={handleSkip} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
              Skip <SkipForward size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
