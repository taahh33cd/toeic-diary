"use client";

import { useCallback, useEffect, useState } from "react";
import { listLibrary, type LibraryDeck } from "@/lib/vocab/client";

/**
 * Thư viện bộ mẫu — tải MỘT lần, lọc theo Part ở phía component.
 *
 * Thư viện tối đa 60 bộ nên không đáng gọi lại server mỗi lần bấm tab Part.
 *
 * Nghe "decks:changed" để sau khi lấy một bộ về, thẻ của nó đổi ngay sang
 * "đã có trong kho" mà không phải tải lại trang.
 *
 * Cùng khuôn với useDecks (khởi tạo mảng rỗng + cờ loading riêng) chứ không
 * dùng null làm trạng thái "đang tải".
 */
export function useLibrary() {
  const [decks, setDecks] = useState<LibraryDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { decks } = await listLibrary();
      setDecks(decks);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được thư viện");
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
