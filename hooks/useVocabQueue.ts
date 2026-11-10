"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { dayHangDoi, demHangDoi, theoDoiHangDoi } from "@/lib/vocab/offline-queue";

/**
 * Số kết quả đang chờ gửi, và tự thử gửi lại khi có mạng.
 *
 * Đọc qua useSyncExternalStore vì hàng đợi nằm ở localStorage — đọc thẳng
 * trong thân component sẽ lệch giữa server và client rồi vỡ hydrate.
 */
export function useVocabQueue(): { cho: number; day: () => void } {
  const cho = useSyncExternalStore(
    theoDoiHangDoi,
    demHangDoi,
    () => 0 // Server không có localStorage; coi như không có gì chờ
  );

  const day = useCallback(() => {
    void dayHangDoi();
  }, []);

  useEffect(() => {
    // Thử ngay khi vào trang: có thể lần trước đóng máy giữa chừng
    void dayHangDoi();
    const khiOnline = () => void dayHangDoi();
    window.addEventListener("online", khiOnline);
    return () => window.removeEventListener("online", khiOnline);
  }, []);

  return { cho, day };
}
