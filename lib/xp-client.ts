/**
 * lib/xp-client.ts — fire-and-forget XP awards from client components.
 *
 * Use after a successful Firebase write (vocab review, mission tick,
 * homework submit, test score input). Server validates the source.
 */

import type { XpSource } from "@/lib/xp";

export interface XpAwardResult {
  totalXp: number;
  level: number;
  levelUp: boolean;
  streak: number;
  streakBonus: { source: XpSource; xp: number } | null;
}

export async function awardXp(
  source: Extract<
    XpSource,
    | "vocab_review"
    | "vocab_master"
    | "mission_task"
    | "mission_day"
    | "homework_submit"
    | "test_score"
    | "daily_login"
  >,
  metadata?: Record<string, unknown>
): Promise<XpAwardResult | null> {
  try {
    const res = await fetch("/api/xp/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, metadata }),
    });
    if (!res.ok) return null;
    return (await res.json()) as XpAwardResult;
  } catch {
    return null;
  }
}
