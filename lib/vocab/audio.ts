/**
 * Phát âm một từ. Thứ tự ưu tiên: audioUrl từ từ điển (miễn phí) → Google TTS
 * qua /api/tts (hay nhất, đã hạ 0.85× tốc độ) → Web Speech của trình duyệt.
 *
 * Tách ra từ app/(student)/journal/vocab/page.tsx để màn luyện và màn soạn bộ
 * dùng chung một đường, không ai tự viết lại rồi lệch hành vi.
 */
export async function playWord(word: string, audioUrl?: string): Promise<void> {
  if (audioUrl) {
    try {
      await new Audio(audioUrl).play();
      return;
    } catch {
      /* file lỗi hoặc bị chặn — rơi xuống TTS */
    }
  }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: word }),
    });
    if (res.ok) {
      const { audioContent } = (await res.json()) as { audioContent?: string };
      if (audioContent) {
        await new Audio(`data:audio/mp3;base64,${audioContent}`).play();
        return;
      }
    }
  } catch {
    /* TTS chưa cấu hình hoặc lỗi mạng */
  }

  playWebSpeech(word);
}

export function playWebSpeech(word: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}
