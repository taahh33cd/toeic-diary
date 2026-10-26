"use client";

import { useCallback, useEffect, useState } from "react";
import { listDecks, type DeckSummary } from "@/lib/vocab/client";

/** Danh sách bộ thẻ của chính mình, mới sửa trước. */
export function useDecks() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { decks } = await listDecks();
      setDecks(decks);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách bộ thẻ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("decks:changed", refresh);
    return () => window.removeEventListener("decks:changed", refresh);
  }, [refresh]);

  return { decks, loading, error, refresh };
}
