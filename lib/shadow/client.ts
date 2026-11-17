/**
 * lib/shadow/client.ts — gọi API tiến độ Shadow từ trình duyệt.
 * Lỗi mạng / chưa đăng nhập → trả null, Shadow vẫn chạy bình thường (chỉ không lưu).
 */

export interface ShadowState {
  doneSentenceIds: string[];
  lessonDone: boolean;
  todayCount: number;
  streakGoal: number;
}

export interface ShadowSaveResult extends ShadowState {
  counted: boolean;
  newlyLessonDone: boolean;
  xp: { streak: number } | null;
}

export async function fetchShadowState(lessonId: string): Promise<ShadowState | null> {
  try {
    const res = await fetch(`/api/shadow/progress?lessonId=${encodeURIComponent(lessonId)}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as ShadowState) : null;
  } catch {
    return null;
  }
}

export async function saveShadowSentence(body: {
  lessonId: string;
  sentenceId: string;
  starIds: string[];
}): Promise<ShadowSaveResult | null> {
  try {
    const res = await fetch("/api/shadow/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as ShadowSaveResult) : null;
  } catch {
    return null;
  }
}

/** Sự kiện đo lường, bắn rồi quên. */
export function trackShadow(
  type: "shadow_open" | "shadow_record",
  lessonId: string,
  sentenceId?: string,
  metadata?: Record<string, unknown>
) {
  fetch("/api/shadow/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, lessonId, sentenceId, metadata }),
    keepalive: true,
  }).catch(() => {});
}
