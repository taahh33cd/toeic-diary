"use client";

import { useCallback, useEffect, useState } from "react";
import { listWords, type WordRow } from "@/lib/vocab/client";

/**
 * Toàn bộ kho từ của mình, đọc từ Postgres.
 *
 * Thay useVocab (RTDB) ở trang vocab. Nghe hai event để khỏi phải tải lại
 * trang: "vocab:reviewed" khi vừa ôn, "vocab:changed" khi thêm/xoá từ.
 */
export function useVocabWords(enabled = true) {
  const [words, setWords] = useState<WordRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const { words } = await listWords();
      setWords(words);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được kho từ");
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
    window.addEventListener("vocab:reviewed", refresh);
    window.addEventListener("vocab:changed", refresh);
    return () => {
      window.removeEventListener("vocab:reviewed", refresh);
      window.removeEventListener("vocab:changed", refresh);
    };
  }, [enabled, refresh]);

  return { words, loading, error, refresh };
}
