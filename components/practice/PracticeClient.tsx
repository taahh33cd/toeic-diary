"use client";

import { useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { Level1Practice } from "./Level1Practice";
import { Level2Practice } from "./Level2Practice";
import { Level3Practice } from "./Level3Practice";
import { Level4Practice } from "./Level4Practice";
import { Trophy } from "lucide-react";
import { usePracticeStore } from "@/stores/practiceStore";

interface Blank {
  id: string;
  position: number;
  answer: string;
  hint: string | null;
}

interface Sentence {
  id: string;
  orderIndex: number;
  content: string;
  startTime: number;
  endTime: number;
  speaker: string | null;
  blanks: Blank[];
}

interface LessonData {
  id: string;
  title: string;
  questionStart: number | null;
  questionEnd: number | null;
  transcriptFull: string;
  audioUrl: string;
  audioDuration: number;
  partNumber: number;
  correctOption: string | null;
  explanation: string | null;
  sentences: Sentence[];
}

interface LevelProgress {
  status: string;
  score: number;
  bestScore: number;
  attempts: number;
}

interface Props {
  lesson: LessonData;
  userId: string;
  progressByLevel: Record<number, LevelProgress>;
}

// Part 1 & 2: Level 1 (2 blanks, DB) + Level 2 (full dictation)
// Part 3 & 4: Level 1 + Level 2 (4-5 blanks, generated) + Level 3 (full dictation) + Level 4 (AI Summary)
const LEVEL_INFO_12 = [
  { level: 1, label: "Level 1", desc: "Fill-in-blank", icon: "✏️" },
  { level: 2, label: "Level 2", desc: "Full dictation", icon: "📝" },
] as const;

const LEVEL_INFO_34 = [
  { level: 1, label: "Level 1", desc: "Fill-in-blank", icon: "✏️" },
  { level: 2, label: "Level 2", desc: "More blanks", icon: "✏️✏️" },
  { level: 3, label: "Level 3", desc: "Full dictation", icon: "📝" },
  { level: 4, label: "Level 4", desc: "AI Summary", icon: "🤖" },
] as const;

type ActiveLevel = 1 | 2 | 3 | 4;

export function PracticeClient({ lesson, userId, progressByLevel }: Props) {
  const isPart12 = lesson.partNumber === 1 || lesson.partNumber === 2;
  const LEVEL_INFO = isPart12 ? LEVEL_INFO_12 : LEVEL_INFO_34;

  const [activeLevel, setActiveLevel] = useState<ActiveLevel>(1);
  const [sessionScores, setSessionScores] = useState<Record<number, number>>({});
  const { startSession, startTime } = usePracticeStore();

  function handleSelectLevel(level: ActiveLevel) {
    setActiveLevel(level);
    startSession(lesson.id, level);
  }

  function handleScored(level: number, score: number) {
    setSessionScores((prev) => ({ ...prev, [level]: score }));
  }

  function getProgress(level: number): LevelProgress | undefined {
    const db = progressByLevel[level];
    const sessionScore = sessionScores[level];
    if (sessionScore !== undefined) {
      return {
        status: sessionScore >= 70 ? "completed" : "in_progress",
        score: sessionScore,
        bestScore: Math.max(db?.bestScore ?? 0, sessionScore),
        attempts: (db?.attempts ?? 0) + 1,
      };
    }
    return db;
  }

  return (
    <div>
      {/* Level tabs */}
      <div className={`grid gap-2 mb-6 ${isPart12 ? "grid-cols-2" : "grid-cols-4"}`}>
        {LEVEL_INFO.map(({ level, label, desc, icon }) => {
          const prog = getProgress(level);
          const isActive = activeLevel === level;
          const done = prog?.status === "completed" && prog.bestScore >= 70;

          return (
            <button
              key={level}
              onClick={() => handleSelectLevel(level as ActiveLevel)}
              className={`relative p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                  : done
                  ? "border-[var(--accent-green)] bg-[var(--accent-green)]/5 hover:bg-[var(--accent-green)]/10"
                  : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/50 cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">{icon}</span>
                {done && <Trophy size={11} className="text-[var(--accent-green)]" />}
              </div>
              <div className={`text-xs font-bold ${isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}>
                {label}
              </div>
              <div className="text-xs text-[var(--text-muted)] hidden sm:block">{desc}</div>
              {prog && (
                <div className={`text-xs font-mono mt-1 ${done ? "text-[var(--accent-green)]" : "text-orange-400"}`}>
                  {prog.bestScore}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* AudioPlayer only for Level 4 (AI Summary) — other levels have built-in audio bars */}
      {activeLevel === 4 && <AudioPlayer audioUrl={lesson.audioUrl} />}

      {activeLevel === 1 && (
        <Level1Practice
          lessonId={lesson.id}
          audioUrl={lesson.audioUrl}
          sentences={lesson.sentences}
          partNumber={lesson.partNumber}
          correctOption={lesson.correctOption ?? null}
          explanation={lesson.explanation ?? null}
          startTime={startTime}
          onScored={(s) => handleScored(1, s)}
        />
      )}

      {activeLevel === 2 && isPart12 && (
        <Level3Practice
          lessonId={lesson.id}
          audioUrl={lesson.audioUrl}
          sentences={lesson.sentences}
          partNumber={lesson.partNumber}
          correctOption={lesson.correctOption ?? null}
          explanation={lesson.explanation ?? null}
          startTime={startTime}
          dbLevel={2}
          onScored={(s) => handleScored(2, s)}
        />
      )}

      {activeLevel === 2 && !isPart12 && (
        <Level2Practice
          lessonId={lesson.id}
          audioUrl={lesson.audioUrl}
          sentences={lesson.sentences}
          startTime={startTime}
          onScored={(s) => handleScored(2, s)}
        />
      )}

      {activeLevel === 3 && (
        <Level3Practice
          lessonId={lesson.id}
          audioUrl={lesson.audioUrl}
          sentences={lesson.sentences}
          partNumber={lesson.partNumber}
          correctOption={lesson.correctOption ?? null}
          explanation={lesson.explanation ?? null}
          startTime={startTime}
          onScored={(s) => handleScored(3, s)}
        />
      )}

      {activeLevel === 4 && (
        <Level4Practice
          lessonId={lesson.id}
          sentences={lesson.sentences}
          transcriptFull={lesson.transcriptFull}
          startTime={startTime}
          onScored={(s) => handleScored(4, s)}
        />
      )}
    </div>
  );
}
