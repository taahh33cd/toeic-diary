// ─────────────────────────────────────
// IPA audio layer
//
// Primary: pre-generated Google TTS mp3 in /audio/ipa/<slug>.mp3 (words listed
// in audio-manifest.json). Fallback: Web Speech API reads the *example word* —
// never the raw IPA symbol (TTS can't pronounce "/ʃ/").
// ─────────────────────────────────────

import manifest from "./audio-manifest.json";

const HAVE_MP3 = new Set(manifest as string[]);

function slug(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

let currentAudio: HTMLAudioElement | null = null;

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

/** Stop any ongoing audio + speech. */
export function stopSpeech(): void {
  speechApi()?.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/** Speak via Web Speech (fallback when no mp3 exists / audio fails). */
function speakWord(word: string, rate: number): Promise<void> {
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

/**
 * Play a single word in US English. Prefers the pre-generated mp3; on any
 * failure (missing file, load/play error) falls back to Web Speech.
 * Cancels any in-flight playback first. Must be triggered by a user gesture
 * on mobile (autoplay policy).
 */
export function playWord(word: string, rate = 0.9): Promise<void> {
  stopSpeech();

  const s = slug(word);
  if (HAVE_MP3.has(s) && typeof Audio !== "undefined") {
    return new Promise<void>((resolve) => {
      const audio = new Audio(`/audio/ipa/${s}.mp3`);
      currentAudio = audio;
      audio.onended = () => { if (currentAudio === audio) currentAudio = null; resolve(); };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        speakWord(word, rate).then(resolve); // fallback
      };
      audio.play().catch(() => {
        if (currentAudio === audio) currentAudio = null;
        speakWord(word, rate).then(resolve);
      });
    });
  }

  return speakWord(word, rate);
}

/** Play the phoneme by reading its example word (IPA symbols aren't TTS-readable). */
export function playPhoneme(exampleWord: string): Promise<void> {
  return playWord(exampleWord);
}
