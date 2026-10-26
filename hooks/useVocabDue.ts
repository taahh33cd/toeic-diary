"use client";

import { useCallback, useEffect, useState } from "react";

export interface VocabDueStats {
  dueCount: number;
  total: number;
  mastered: number;
  /** Server tính: hết từ đến hạn nhưng đã 3 ngày không ôn → nhắc nhẹ */
  remind: boolean;
  /** ISO string, null nếu chưa ôn lần nào */
  lastReview: string | null;
}

const RONG: VocabDueStats = { dueCount: 0, total: 0, mastered: 0, remind: false, lastReview: null };

/**
 * Số từ đến hạn ôn, đọc từ Postgres qua /api/flashcards/due.
 *
 * Thay cách cũ là tải cả kho từ RTDB về rồi tự tính ở mỗi nơi — chính chỗ làm
 * badge nav lệch với trang vocab. Giờ chỉ một nguồn.
 *
 * Postgres không realtime như RTDB nên refetch khi tab được focus, và nghe
 * event "vocab:reviewed" do màn luyện bắn ra để badge đổi ngay sau khi ôn.
 * Không poll theo giờ: số này chỉ đổi khi chính học viên vừa ôn.
 */
export function useVocabDue(enabled = true): { stats: VocabDueStats; loading: boolean; refresh: () => void } {
  const [stats, setStats] = useState<VocabDueStats>(RONG);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/flashcards/due", { cache: "no-store" });
      if (res.ok) setStats((await res.json()) as VocabDueStats);
    } catch {
      /* mạng rớt — giữ số cũ, không nhảy về 0 */
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("vocab:reviewed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("vocab:reviewed", refresh);
    };
  }, [enabled, refresh]);

  return { stats, loading, refresh };
}
