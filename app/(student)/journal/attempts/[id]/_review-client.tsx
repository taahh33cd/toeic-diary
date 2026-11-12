"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewPanel } from "@/components/full-tests/ReviewPanel";
import type { RunConfig } from "@/components/full-tests/SetupPanel";
import type { Skin } from "@/components/full-tests/theme";
import type { FullTest } from "@/lib/full-tests/types";

// Cùng khoá sáng/tối với lúc làm bài — học viên chỉnh một lần là áp cho cả
// màn làm bài và màn xem lại.
const SKIN_KEY = "fulltest:skin";

/**
 * Màn chấm chi tiết của một lượt đã nộp, dựng lại từ data đề + đáp án đã lưu.
 * Dùng đúng ReviewPanel của khu làm bài nên nghe lại audio, transcript, lọc
 * câu sai... giống y lúc vừa nộp; chỉ khác "Làm lại đề này" là rời sổ sang
 * khu Luyện đề.
 */
export function AttemptReviewClient({
  test, config, answers, marked, canSaveVocab, testHref,
}: {
  test: FullTest;
  config: RunConfig;
  answers: Record<number, string>;
  marked: number[];
  canSaveVocab: boolean;
  /** Đề này ở khu Luyện đề — nơi "Làm lại đề này" dẫn tới */
  testHref: string;
}) {
  const router = useRouter();
  const [skin, setSkin] = useState<Skin>("light");

  /* eslint-disable react-hooks/set-state-in-effect */
  // Đọc localStorage trong hàm khởi tạo state sẽ lệch hydration (server luôn
  // ra "light"), nên nhận sau khi mount.
  useEffect(() => {
    const s = localStorage.getItem(SKIN_KEY);
    if (s === "dark" || s === "light") setSkin(s);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleSkin = useCallback(() => {
    setSkin((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(SKIN_KEY, next);
      return next;
    });
  }, []);

  return (
    <ReviewPanel
      test={test}
      config={config}
      answers={answers}
      marked={marked}
      skin={skin}
      onToggleSkin={toggleSkin}
      onRetry={() => router.push(testHref)}
      canSaveVocab={canSaveVocab}
      backHref="/journal/scores"
      backLabel="Kết quả"
    />
  );
}
