// Shared type definitions for import pipeline scripts

export interface BlankDef {
  position: number;  // 0-based word index in sentence
  answer: string;    // correct word (original casing)
  hint: string;      // "w____" format — first char + underscores
}

export interface SentenceDef {
  orderIndex: number;
  speaker: string | null;     // "W" | "M" | "M1" | "M2" | "Narrator" | null
  content: string;
  startTime: number;          // seconds — 0 until forced-alignment is available
  endTime: number;            // seconds — 0 until forced-alignment is available
  optionLabel: string | null; // "A"/"B"/"C"/"D" for Part 1 & 2 options, null otherwise
  blanks: BlankDef[];
}

export interface LessonDef {
  title: string;              // "Question 7" | "Questions 32–34"
  questionStart: number;
  questionEnd: number;
  part: 1 | 2 | 3 | 4;
  transcriptFull: string;     // full spoken text
  sentences: SentenceDef[];
  correctOption: string | null; // "A"/"B"/"C" for Part 2, null otherwise
  explanation: string;          // AI explanation for Part 2, empty string otherwise
  // Audio — filled by upload-audio.ts
  audioFiles: string[];       // source MP3 filenames in the audio/ dir
  audioUrl: string;           // Supabase Storage public URL (empty until uploaded)
  audioDuration: number;      // seconds (0 until uploaded)
}

export interface ParsedTest {
  testName: string;   // "ETS 2026 Test 1"
  testSlug: string;   // "ets-2026-test-1"
  orderIndex: number; // 1, 2, 3 …
  examCode: string;   // "E26"
  testCode: string;   // "T01"
  lessons: LessonDef[];
}
