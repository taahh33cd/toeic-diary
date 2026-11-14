"use client";

import { useCallback, useEffect, useState } from "react";
import { ReviewPanel } from "@/components/full-tests/ReviewPanel";
import type { RunConfig } from "@/components/full-tests/SetupPanel";
import type { Skin } from "@/components/full-tests/theme";
import type { FullTest } from "@/lib/full-tests/types";

// Cùng khoá sáng/tối với màn làm bài để giao diện quen tay.
const SKIN_KEY = "fulltest:skin";

/** Màn chấm chi tiết một lượt của học viên, ở chế độ chỉ xem cho giáo viên. */
export function StaffAttemptReview({
  test, config, answers, marked, backHref, backLabel,
}: {
  test: FullTest;
  config: RunConfig;
  answers: Record<number, string>;
  marked: number[];
  backHref: string;
  backLabel: string;
}) {
  const [skin, setSkin] = useState<Skin>("light");

  /* eslint-disable react-hooks/set-state-in-effect */
  // Đọc localStorage trong hàm khởi tạo state sẽ lệch hydration, nên nhận sau khi mount.
  useEffect(() => {
    try {
      const s = localStorage.getItem(SKIN_KEY);
      if (s === "dark" || s === "light") setSkin(s);
    } catch { /* trình duyệt chặn storage — giữ sáng */ }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleSkin = useCallback(() => {
    setSkin((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try { localStorage.setItem(SKIN_KEY, next); } catch { /* bỏ qua */ }
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
      canSaveVocab={false}
      readOnly
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
