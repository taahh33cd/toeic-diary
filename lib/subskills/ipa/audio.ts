// ─────────────────────────────────────
// IPA audio layer
//
// Placeholder engine: Web Speech API (speechSynthesis) reads the *example word*
// of a phoneme — never the raw IPA symbol (TTS can't pronounce "/ʃ/").
//
// Phase 6 swap: `playWord` will first try a static mp3 in /audio/ipa/,
// falling back to Web Speech. The calling UI stays unchanged.
// ─────────────────────────────────────

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceResolved = false;

function speechApi(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

/** Whether Web Speech synthesis is usable in this browser. */
export function speechAvailable(): boolean {
  return speechApi() !== null && typeof window !== "undefined" && "SpeechSynthesisUtterance" in window;
}

/** Pick a US English voice once and cache it. Voices load async on some browsers. */
function pickVoice(api: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (voiceResolved) return cachedVoice;
  const voices = api.getVoices();
  if (voices.length === 0) return null; // not loaded yet — will retry next call
  cachedVoice =
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
  voiceResolved = true;
  return cachedVoice;
}

/** Stop any ongoing speech. */
export function stopSpeech(): void {
  speechApi()?.cancel();
}

/**
 * Speak a single word/phrase in US English.
 * Cancels any in-flight utterance first (rapid clicks stay responsive).
 * Resolves when speech ends (or immediately if unavailable).
 * Must be triggered by a user gesture on mobile (autoplay policy).
 */
export function playWord(word: string, rate = 0.9): Promise<void> {
  const api = speechApi();
  if (!api) return Promise.resolve();

  api.cancel();

  return new Promise<void>((resolve) => {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = "en-US";
    utter.rate = rate;
    const voice = pickVoice(api);
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    api.speak(utter);
  });
}

/** Play the phoneme by reading its example word (IPA symbols aren't TTS-readable). */
export function playPhoneme(exampleWord: string): Promise<void> {
  return playWord(exampleWord);
}
