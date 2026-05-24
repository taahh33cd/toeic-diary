"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCcw, Play, Pause } from "lucide-react";
import { saveProgress } from "@/app/actions/saveProgress";
import { getTimeSpent } from "@/stores/practiceStore";
import { Part2Result } from "./Part2Result";
import { type VocabItem } from "./TranscriptVocabModal";
import { PostSubmitView } from "./PostSubmitView";

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
  dbLevel?: number;
  nextLessonUrl?: string | null;
  transcriptFull: string;
  precomputedVocab?: VocabItem[] | null;
  onScored: (score: number) => void;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5];
const MAX_REPLAY = 5;
const AUDIO_OFFSET = 0.2;

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
  hintCount: number;
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
    return { ref, refNorm, correct, retryValue: correct ? ref : (userWords[i] ?? ""), hintCount: 0 };
  });
}

function countCorrectWords(wordResults: WordResult[]): number {
  return wordResults.filter((w) => w.correct).length;
}

export function Level3Practice({ lessonId, audioUrl, sentences, partNumber, correctOption, explanation, startTime: sessionStart, dbLevel = 3, nextLessonUrl, transcriptFull, precomputedVocab, onScored }: Props) {
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

  const [vocabItems, setVocabItems] = useState<VocabItem[] | null>(precomputedVocab ?? null);

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

    const seekTo = activeSentence.startTime > 0 ? Math.max(0, activeSentence.startTime - AUDIO_OFFSET) : 0;
    const doSeekAndPlay = () => {
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
    else {
      const firstWrong = results.findIndex((w) => !w.correct);
      if (firstWrong !== -1) setTimeout(() => retryInputRefs.current[firstWrong]?.focus(), 80);
    }
  }

  function handleMainInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>, sentenceId: string) {
    if (e.key === "Enter") { e.preventDefault(); submitSentence(sentenceId); }
  }

  // Per-word Enter: check current word immediately, update state, move to next wrong
  function handleRetryKeyDown(e: React.KeyboardEvent<HTMLInputElement>, sentenceId: string, wordIdx: number) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const state = sentenceStates[sentenceId];
    if (!state) return;
    const wr = state.wordResults[wordIdx];
    if (!wr || wr.correct) return;

    const currentValue = retryInputRefs.current[wordIdx]?.value ?? "";
    const isCorrect = normalizeWord(currentValue) === wr.refNorm && normalizeWord(currentValue) !== "";

    if (isCorrect && wr.hintCount < wr.refNorm.length) {
      // Only credit as correct when hints have NOT fully revealed the word
      const newResults = state.wordResults.map((w, i) =>
        i === wordIdx ? { ...w, correct: true, retryValue: currentValue } : w
      );
      const allCorrect = newResults.every((w) => w.correct);
      setSentenceStates((prev) => ({
        ...prev,
        [sentenceId]: { ...prev[sentenceId], phase: allCorrect ? "done" : "feedback", wordResults: newResults },
      }));
      if (allCorrect) {
        setTimeout(() => advanceToNext(), 500);
      } else {
        const wrongAfter = newResults.findIndex((w, i) => !w.correct && i > wordIdx);
        const wrongAny = newResults.findIndex((w, i) => !w.correct);
        const focusIdx = wrongAfter !== -1 ? wrongAfter : wrongAny;
        if (focusIdx !== -1) setTimeout(() => retryInputRefs.current[focusIdx]?.focus(), 50);
      }
    } else if (isCorrect && wr.hintCount >= wr.refNorm.length) {
      // Full reveal — user copied the hint; advance without crediting
      const wrongAfter = state.wordResults.findIndex((w, i) => !w.correct && i > wordIdx);
      const wrongAny = state.wordResults.findIndex((w, i) => !w.correct && i !== wordIdx);
      const focusIdx = wrongAfter !== -1 ? wrongAfter : wrongAny;
      if (focusIdx !== -1) setTimeout(() => retryInputRefs.current[focusIdx]?.focus(), 50);
      // If no other wrong word, user must use "Xem đáp án" or the sentence stays in feedback
    } else {
      // Wrong: reveal one more hint letter
      const newHintCount = wr.hintCount + 1;
      const fullyRevealed = newHintCount >= wr.refNorm.length;
      const newResults = state.wordResults.map((w, i) =>
        i === wordIdx ? { ...w, hintCount: newHintCount, retryValue: "" } : w
      );
      setSentenceStates((prev) => ({
        ...prev,
        [sentenceId]: { ...prev[sentenceId], wordResults: newResults },
      }));
      if (!fullyRevealed) {
        // Stay on current word: re-focus after re-render (key change clears input)
        setTimeout(() => retryInputRefs.current[wordIdx]?.focus(), 50);
      }
    }
  }

  function showAnswer(sentenceId: string) {
    const s = sentences.find((x) => x.id === sentenceId);
    if (!s) return;
    const results = s.content.trim().split(/\s+/).map((ref) => ({
      ref, refNorm: normalizeWord(ref), correct: false, retryValue: ref, hintCount: 0,
    }));
    setSentenceStates((prev) => ({ ...prev, [sentenceId]: { ...prev[sentenceId], phase: "revealed", wordResults: results } }));
  }

  async function fetchVocab() {
    try {
      const res = await fetch("/api/ai/extract-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptFull }),
      });
      const data = await res.json();
      setVocabItems(data.items ?? []);
    } catch {
      setVocabItems([]);
    }
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
    void saveProgress({
      lessonId,
      level: dbLevel,
      score,
      status: score >= 70 ? "completed" : "in_progress",
      userAnswer: JSON.stringify(sentences.map((s) => ({ id: s.id, words: sentenceStates[s.id]?.wordResults?.map((w) => w.retryValue) ?? [] }))),
      timeSpentSeconds: getTimeSpent(sessionStart),
    });
    if (!precomputedVocab) void fetchVocab();
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
      <div className="flex flex-wrap justify-center items-end gap-x-2 gap-y-4">
        {wordResults.map((wr, i) => {
          if (wr.correct) {
            return <span key={i} className="text-2xl md:text-3xl font-medium text-emerald-400">{wr.ref}</span>;
          }
          if (revealed) {
            return <span key={i} className="text-2xl md:text-3xl font-medium text-orange-400">{wr.ref}</span>;
          }

          const hintStr = wr.hintCount > 0
            ? wr.refNorm.slice(0, wr.hintCount) + "*".repeat(Math.max(0, wr.refNorm.length - wr.hintCount))
            : null;

          return (
            <span key={i} className="inline-flex flex-col items-center gap-1 pb-1">
              <span className="rounded-t bg-red-50/60 px-2 pb-1">
                <input
                  key={`retry-${sentence.id}-${i}-${wr.hintCount}`}
                  ref={(el) => { retryInputRefs.current[i] = el; }}
                  type="text"
                  defaultValue=""
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  onKeyDown={(e) => handleRetryKeyDown(e, sentence.id, i)}
                  className="bg-transparent border-b-2 border-red-400/60 text-2xl md:text-3xl text-center text-red-400 font-medium outline-none focus:border-red-500 transition-all"
                  style={{ width: `${Math.max(4, wr.ref.length)}ch` }}
                />
              </span>
              {hintStr ? (
                <span className={`text-xs font-mono tracking-wider ${wr.hintCount >= wr.refNorm.length ? "text-emerald-400" : "text-amber-400"}`}>
                  {hintStr}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)] font-mono">{wr.ref.length} letters</span>
              )}
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
      <PostSubmitView
        score={finalScore}
        levelLabel={`Level ${dbLevel}`}
        detail={`${correctWords}/${totalWords} từ đúng`}
        audioUrl={audioUrl}
        transcriptFull={transcriptFull}
        vocabItems={vocabItems}
        nextLessonUrl={nextLessonUrl}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex flex-col pb-32">
      <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-6 mb-6 shadow-sm">
        <audio
          ref={audioRef} src={audioUrl} preload="auto"
          onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)}
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
                  : isFeedback ? "w-2 h-2 bg-orange-400" : isActive ? "w-4 h-2 bg-[var(--practice-accent)]" : "w-2 h-2 bg-[var(--bg-secondary)]"
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
            <div className="w-full max-w-xl">
              <div className="bg-[var(--bg-elevated)] rounded-xl border-2 border-[var(--border)] focus-within:border-[var(--practice-accent)] transition-colors shadow-sm">
                <input
                  ref={mainInputRef} type="text" value={activeSentenceState.inputValue}
                  onChange={(e) => updateInput(activeSentence.id, e.target.value)}
                  onKeyDown={(e) => handleMainInputKeyDown(e, activeSentence.id)}
                  placeholder="Gõ những gì bạn nghe được..."
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  className="w-full px-5 py-4 bg-transparent text-[var(--text-primary)] text-lg outline-none text-center"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-3 text-center select-none">
                ⌨ Gõ toàn bộ câu · Enter để kiểm tra · Replay để nghe lại
              </p>
            </div>
          )}
          {activeSentenceState.phase === "feedback" && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <p className="text-xs text-[var(--text-muted)] select-none">
                ⌨ Gõ lại từng từ sai · Enter để xác nhận · Replay để nghe lại
              </p>
              <button
                onClick={() => showAnswer(activeSentence.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
              >
                Xem đáp án
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

      {/* Floating bottom action bar */}
      {!submitted && !showSubmit && !(isPart2 && part2AllDone && !answerRevealed) && (
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
          {isPart2 && answerRevealed ? (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 bg-[var(--practice-accent)] text-white rounded-full text-sm font-bold shadow-xl shadow-[var(--practice-accent)]/20 hover:opacity-90 active:scale-95 transition-all"
            >
              Nộp bài
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
