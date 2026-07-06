// ─────────────────────────────────────
// IPA exercise types
//
// All five kinds reduce to a single-correct multiple-choice item; `kind`
// only controls presentation (play audio? show a word? options are words vs
// IPA symbols vs bucket labels).
// ─────────────────────────────────────

export type IpaItemKind =
  | "audiochoice"   // hear a word → choose which word it was (minimal pairs)
  | "soundid"       // see a word → choose which sound it contains
  | "oddoneout"     // 4 words → pick the one with a different sound
  | "sort"          // see a word → choose the right bucket (/s/ /z/ /ɪz/ …)
  | "transcription"; // see a word → choose its correct IPA transcription

export type IpaItem = {
  kind: IpaItemKind;
  prompt?: string;   // optional instruction/context line for this item
  audio?: string;    // word for TTS to speak (audiochoice; also drives replay)
  display?: string;  // text shown to the user (soundid / sort / transcription)
  options: string[]; // 2–4 choices
  correct: number;   // index into options
  explanation: string; // shown as instant feedback
};

export type IpaExercise = {
  title: string;
  instruction: string;
  items: IpaItem[];
};

export type IpaSection = "vowels" | "diphthongs" | "consonants";
export type IpaDifficulty = "easy" | "medium" | "hard";

export type IpaSet = {
  section: IpaSection;
  difficulty: IpaDifficulty;
  label: string;
  passThreshold: number;
  exercises: IpaExercise[];
};
