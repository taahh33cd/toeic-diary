"use client";

import { useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { Level1Practice } from "./Level1Practice";
import { Level2Practice } from "./Level2Practice";
import { Level3Practice } from "./Level3Practice";
import { Level4Practice } from "./Level4Practice";
import { PenLine, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { usePracticeStore } from "@/stores/practiceStore";
import type { VocabItem } from "./TranscriptVocabModal";

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
  nextLessonUrl?: string | null;
  keyVocab: VocabItem[] | null;
}

// Part 1 & 2: Level 1 (2 blanks, DB) + Level 2 (full dictation)
// Part 3 & 4: Level 1 + Level 2 (4-5 blanks, generated) + Level 3 (full dictation) + Level 4 (AI Summary)
const LEVEL_INFO_12 = [
  { level: 1, label: "Level 1", desc: "Fill-in-blank",  longDesc: "Focus on key technical vocabulary and grammar structures." },
  { level: 2, label: "Level 2", desc: "Full dictation", longDesc: "Transcribe every word to master nuances of natural speech." },
] as const;

const LEVEL_INFO_34 = [
  { level: 1, label: "Level 1", desc: "Fill-in-blank" },
  { level: 2, label: "Level 2", desc: "More blanks" },
  { level: 3, label: "Level 3", desc: "Full dictation" },
  { level: 4, label: "Level 4", desc: "AI Summary" },
] as const;

function LevelIcon({ level, active }: { level: number; active: boolean }) {
  const color = active ? "#006591" : "#3e4850";
  const size = 22;
  if (level === 1) return <PenLine size={size} color={color} />;
  if (level === 2) return <PenLine size={size} color={color} strokeWidth={2.5} />;
  if (level === 3) return <FileText size={size} color={color} />;
  return <Sparkles size={size} color={color} />;
}

type ActiveLevel = 1 | 2 | 3 | 4;

export function PracticeClient({ lesson, userId, progressByLevel, nextLessonUrl, keyVocab }: Props) {
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
      {/* Level selector — Part 1/2: bento 2-col, Part 3/4: compact 4-col */}
      {isPart12 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {(LEVEL_INFO_12 as readonly { level: number; label: string; desc: string; longDesc: string }[]).map(({ level, label, desc, longDesc }) => {
            const prog = getProgress(level);
            const isActive = activeLevel === level;
            const done = prog?.status === "completed" && prog.bestScore >= 70;
            return (
              <button
                key={level}
                onClick={() => handleSelectLevel(level as ActiveLevel)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: 24,
                  borderRadius: 12,
                  border: isActive ? "2px solid #006591" : "1px solid #bec8d2",
                  background: isActive ? "#eff4ff" : "#ffffff",
                  boxShadow: isActive ? "0 0 0 4px rgba(0,101,145,0.05)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                {/* Icon badge */}
                <div style={{
                  background: isActive ? "rgba(14,165,233,0.15)" : "#e5eeff",
                  padding: 12,
                  borderRadius: 8,
                  flexShrink: 0,
                }}>
                  <LevelIcon level={level} active={isActive} />
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: isActive ? "#006591" : "#3e4850", marginBottom: 4 }}>
                    {label}
                  </p>
                  <h3 style={{ fontSize: 24, fontWeight: 600, lineHeight: "32px", color: "#0b1c30", marginBottom: 4 }}>
                    {desc}
                  </h3>
                  <p style={{ fontSize: 14, color: "#3e4850", lineHeight: "20px" }}>{longDesc}</p>
                  {prog && (
                    <p style={{ fontSize: 12, fontWeight: 700, color: done ? "#16a34a" : "#d97706", marginTop: 8, fontFamily: "monospace" }}>
                      Best: {prog.bestScore}
                    </p>
                  )}
                </div>
                {/* Check icon */}
                {(isActive || done) && (
                  <div style={{ position: "absolute", top: 16, right: 16, color: done ? "#16a34a" : "#006591" }}>
                    <CheckCircle2 size={20} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {(LEVEL_INFO_34 as readonly { level: number; label: string; desc: string }[]).map(({ level, label, desc }) => {
            const prog = getProgress(level);
            const isActive = activeLevel === level;
            const done = prog?.status === "completed" && prog.bestScore >= 70;
            return (
              <button
                key={level}
                onClick={() => handleSelectLevel(level as ActiveLevel)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                  padding: 16,
                  borderRadius: 12,
                  border: isActive ? "2px solid #006591" : "1px solid #bec8d2",
                  background: isActive ? "rgba(14,165,233,0.08)" : "#f8f9ff",
                  boxShadow: isActive ? "0 0 0 2px rgba(0,101,145,0.12)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                }}
                className="hover:bg-[var(--bg-secondary)]"
              >
                <div style={{ marginBottom: 16 }}>
                  <LevelIcon level={level} active={isActive} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#006591" : "#3e4850", marginBottom: 2 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#006591" : "#0b1c30" }}>
                    {desc}
                  </p>
                  {done && (
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginTop: 4, fontFamily: "monospace" }}>
                      ✓ {prog!.bestScore}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

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
          nextLessonUrl={nextLessonUrl}
          transcriptFull={lesson.transcriptFull}
          keyVocab={keyVocab}
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
          nextLessonUrl={nextLessonUrl}
          transcriptFull={lesson.transcriptFull}
          keyVocab={keyVocab}
          onScored={(s) => handleScored(2, s)}
        />
      )}

      {activeLevel === 2 && !isPart12 && (
        <Level2Practice
          lessonId={lesson.id}
          audioUrl={lesson.audioUrl}
          sentences={lesson.sentences}
          startTime={startTime}
          transcriptFull={lesson.transcriptFull}
          keyVocab={keyVocab}
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
          transcriptFull={lesson.transcriptFull}
          keyVocab={keyVocab}
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
