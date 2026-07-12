"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Số đơn Khoá 0 đang chờ xác nhận (status = "submitted").
 * Poll 45s + refetch khi tab được focus và khi trang purchases bắn event
 * "purchases:changed" (duyệt/từ chối) để badge nav cập nhật ngay.
 */
export function usePendingPurchases(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/purchases/count", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 45_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("purchases:changed", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("purchases:changed", refresh);
    };
  }, [refresh]);

  return count;
}
