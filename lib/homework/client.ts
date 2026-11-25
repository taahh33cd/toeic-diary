"use client";

/**
 * lib/homework/client.ts — các lời gọi phía trình duyệt quanh BTVN.
 */

import { useEffect, useRef } from "react";
import type { DeckSummary } from "@/lib/vocab/client";
import type { Homework, HwItem } from "@/lib/firebase/types";
import type { LibItem } from "./library";

// ─── Kho bài & bộ thẻ: tải một lần mỗi phiên trang ──────────────────────────

let libPromise: Promise<LibItem[]> | null = null;
let deckPromise: Promise<DeckSummary[]> | null = null;

export function loadLibrary(): Promise<LibItem[]> {
  libPromise ??= fetch("/api/admin/hw-library")
    .then(async (r) => {
      if (!r.ok) throw new Error("Không tải được kho bài");
      return ((await r.json()) as { items: LibItem[] }).items;
    })
    .catch((e) => {
      libPromise = null; // lần sau thử lại
      throw e;
    });
  return libPromise;
}

export function loadDecks(): Promise<DeckSummary[]> {
  deckPromise ??= fetch("/api/flashcards/decks", { cache: "no-store" })
    .then(async (r) => {
      const d = (await r.json()) as { decks?: DeckSummary[]; error?: string };
      if (!r.ok) throw new Error(d.error ?? "Không tải được bộ thẻ");
      return (d.decks ?? []).filter((x) => x.cardCount > 0);
    })
    .catch((e) => {
      deckPromise = null;
      throw e;
    });
  return deckPromise;
}

export async function fetchLinkTitle(url: string): Promise<string | null> {
  try {
    const r = await fetch(`/api/admin/link-title?url=${encodeURIComponent(url)}`);
    if (!r.ok) return null;
    return ((await r.json()) as { title?: string | null }).title ?? null;
  } catch {
    return null;
  }
}

// ─── Sau khi lưu BTVN ────────────────────────────────────────────────────────

const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

/**
 * Bộ thẻ chèn vào BTVN phải được "giao" thật (bảng vocab_deck_assignments) để
 * học viên mở được link và giáo viên theo dõi ở tab Bộ thẻ. Lỗi ở đây không làm
 * hỏng BTVN vừa lưu — giao lại được.
 */
export async function assignHomeworkDecks(hw: Homework, codes: string[]): Promise<void> {
  const deckIds = new Set<string>();
  for (const s of SECTIONS) {
    for (const it of (hw[s] as HwItem[] | undefined) ?? []) if (it.deckId) deckIds.add(it.deckId);
  }
  if (deckIds.size === 0 || codes.length === 0) return;
  await Promise.allSettled(
    [...deckIds].flatMap((deckId) =>
      codes.map((studentCode) =>
        fetch("/api/flashcards/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deckId,
            studentCode,
            activity: "study",
            dueDate: hw.endDate || hw.date,
            homeworkId: hw.id,
          }),
        }),
      ),
    ),
  );
}

// ─── Tự đánh dấu xong ────────────────────────────────────────────────────────

/** Nhờ server đối chiếu dữ liệu làm bài. Học viên: bỏ trống `codes`. */
export function requestAutoDone(codes?: string[]): Promise<void> {
  return fetch("/api/homework/auto-done", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(codes?.length ? { codes } : {}),
  })
    .then(() => undefined)
    .catch(() => undefined);
}

/**
 * Gọi đối chiếu một lần khi trang mở (và khi danh sách mã đổi). Kết quả về qua
 * listener RTDB đang có, nên không cần trả gì.
 */
export function useAutoDoneOnMount(enabled: boolean, codes?: string[]) {
  const key = codes?.slice().sort().join(",") ?? "";
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || done.current === key) return;
    if (codes && codes.length === 0) return;
    done.current = key;
    requestAutoDone(codes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);
}
