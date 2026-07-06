// ─────────────────────────────────────
// Interactive Phonemic Chart data — General American (GA)
//
// GA differences vs British RP:
//  - 5 diphthongs only (no centering ɪə eə ʊə)
//  - r-colored vowel ɝ (bird); rhotic /r/
// Each phoneme: symbol + one example word + the letters carrying the sound.
// ─────────────────────────────────────

export type Phoneme = {
  id: string;        // stable key, e.g. "i-long", "th-voiceless"
  symbol: string;    // IPA symbol shown in cell
  word: string;      // example word (also what TTS reads)
  highlight: string; // letters in `word` that carry the sound (bolded in UI)
};

export type PhonemeGroupKey = "vowels" | "diphthongs" | "consonants";

export type PhonemeGroup = {
  key: PhonemeGroupKey;
  label: string;
  phonemes: Phoneme[];
};

export const IPA_CHART: PhonemeGroup[] = [
  {
    key: "vowels",
    label: "Monophthongs — Nguyên âm đơn",
    phonemes: [
      { id: "i-long", symbol: "iː", word: "sheep", highlight: "ee" },
      { id: "i-short", symbol: "ɪ", word: "ship", highlight: "i" },
      { id: "e", symbol: "e", word: "bed", highlight: "e" },
      { id: "ae", symbol: "æ", word: "cat", highlight: "a" },
      { id: "a-long", symbol: "ɑː", word: "father", highlight: "a" },
      { id: "aw", symbol: "ɔː", word: "thought", highlight: "ough" },
      { id: "u-short", symbol: "ʊ", word: "book", highlight: "oo" },
      { id: "u-long", symbol: "uː", word: "boot", highlight: "oo" },
      { id: "uh", symbol: "ʌ", word: "cup", highlight: "u" },
      { id: "schwa", symbol: "ə", word: "about", highlight: "a" },
      { id: "er", symbol: "ɝ", word: "bird", highlight: "ir" },
    ],
  },
  {
    key: "diphthongs",
    label: "Diphthongs — Nguyên âm đôi",
    phonemes: [
      { id: "ei", symbol: "eɪ", word: "face", highlight: "a" },
      { id: "ai", symbol: "aɪ", word: "price", highlight: "i" },
      { id: "oi", symbol: "ɔɪ", word: "choice", highlight: "oi" },
      { id: "ou", symbol: "oʊ", word: "goat", highlight: "oa" },
      { id: "au", symbol: "aʊ", word: "mouth", highlight: "ou" },
    ],
  },
  {
    key: "consonants",
    label: "Consonants — Phụ âm",
    phonemes: [
      { id: "p", symbol: "p", word: "pen", highlight: "p" },
      { id: "b", symbol: "b", word: "bad", highlight: "b" },
      { id: "t", symbol: "t", word: "tea", highlight: "t" },
      { id: "d", symbol: "d", word: "did", highlight: "d" },
      { id: "k", symbol: "k", word: "cat", highlight: "c" },
      { id: "g", symbol: "g", word: "got", highlight: "g" },
      { id: "ch", symbol: "tʃ", word: "chair", highlight: "ch" },
      { id: "j", symbol: "dʒ", word: "jump", highlight: "j" },
      { id: "f", symbol: "f", word: "four", highlight: "f" },
      { id: "v", symbol: "v", word: "van", highlight: "v" },
      { id: "th-voiceless", symbol: "θ", word: "think", highlight: "th" },
      { id: "th-voiced", symbol: "ð", word: "this", highlight: "th" },
      { id: "s", symbol: "s", word: "see", highlight: "s" },
      { id: "z", symbol: "z", word: "zoo", highlight: "z" },
      { id: "sh", symbol: "ʃ", word: "she", highlight: "sh" },
      { id: "zh", symbol: "ʒ", word: "vision", highlight: "si" },
      { id: "m", symbol: "m", word: "man", highlight: "m" },
      { id: "n", symbol: "n", word: "no", highlight: "n" },
      { id: "ng", symbol: "ŋ", word: "sing", highlight: "ng" },
      { id: "h", symbol: "h", word: "hat", highlight: "h" },
      { id: "l", symbol: "l", word: "leg", highlight: "l" },
      { id: "r", symbol: "r", word: "red", highlight: "r" },
      { id: "w", symbol: "w", word: "wet", highlight: "w" },
      { id: "y", symbol: "j", word: "yes", highlight: "y" },
    ],
  },
];
