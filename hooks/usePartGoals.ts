"use client";

import { useCallback, useEffect, useState } from "react";
import type { MonthProgress, PartGoalDTO } from "@/lib/part-goals/core";

export interface PartGoalMonth {
  goal: PartGoalDTO;
  progress: MonthProgress;
}

/**
 * Mục tiêu part theo tháng + tiến độ (tính ở server từ mọi nguồn bài làm).
 * `code` chỉ truyền khi GV xem HV khác; HV để trống = của chính mình.
 */
export function usePartGoals(code?: string | null, enabled = true) {
  const [months, setMonths] = useState<PartGoalMonth[]>([]);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/part-goals${code ? `?code=${encodeURIComponent(code)}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { months: PartGoalMonth[]; celebrate: string | null };
      setMonths(data.months ?? []);
      if (data.celebrate) setCelebrate(data.celebrate);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [code, enabled]);

  useEffect(() => { reload(); }, [reload]);

  return { months, celebrate, dismissCelebrate: () => setCelebrate(null), loading, error, reload };
}
