"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// Chỉ lấy type (1..7) — file types.ts không nạp JSON đề nên client bundle không phình.
import type { PartNumber } from "@/lib/full-tests/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface AttemptRow {
  id: string;
  testSlug: string;
  config: AttemptConfig;
  answers: Record<string, string>;
  marked: number[];
  secondsLeft: number | null;
  updatedAt: string;
}

/** Khớp RunConfig của cả full test lẫn luyện part — hook không cần biết chi tiết. */
export interface AttemptConfig {
  mode: "real" | "practice";
  parts: PartNumber[];
  minutes: number;
  autoSubmit: boolean;
  instantFeedback: boolean;
}

/** Bản sao cục bộ — chỉ dùng khi mất mạng lúc đang làm, DB vẫn là nguồn chính. */
interface LocalMirror {
  attemptId: string;
  answers: Record<number, string>;
  marked: number[];
  savedAt: number;
}

const SAVE_DEBOUNCE_MS = 4000;

function readMirror(key: string): LocalMirror | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LocalMirror) : null;
  } catch {
    return null;
  }
}

function writeMirror(key: string, m: LocalMirror) {
  try {
    localStorage.setItem(key, JSON.stringify(m));
  } catch {
    // hết quota thì thôi, không chặn người làm bài
  }
}

function clearMirror(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // không sao
  }
}

/**
 * Quản lý một lượt làm bài trên server: tạo/khôi phục, auto-save có debounce,
 * và nộp bài. Mọi lỗi mạng đều không chặn UI — bài vẫn ghi vào localStorage.
 *
 * `identity` được gộp vào body lúc tạo lượt mới (vd { examSlug } cho full test,
 * { skill, part } cho luyện part). Truyền object đã memo hoá để deps ổn định.
 */
export function useAttempt({
  basePath,
  mirrorKey,
  testSlug,
  identity,
}: {
  /** Route lượt làm, vd "/api/full-tests/attempts" */
  basePath: string;
  /** Khoá localStorage riêng cho từng luồng, để hai luồng không ghi đè bản sao của nhau */
  mirrorKey: string;
  testSlug: string;
  identity: Record<string, string | number>;
}) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ answers: Record<number, string>; marked: number[]; secondsLeft: number | null } | null>(null);

  /** Lượt đang làm dở trên server, kèm đáp án mới hơn từ bản sao cục bộ nếu có. */
  const fetchInProgress = useCallback(async (): Promise<AttemptRow | null> => {
    try {
      const r = await fetch(
        `${basePath}?testSlug=${encodeURIComponent(testSlug)}&status=in_progress`,
      );
      if (!r.ok) return null;
      const { attempt } = (await r.json()) as { attempt: AttemptRow | null };
      if (!attempt) return null;

      const mirror = readMirror(mirrorKey);
      if (mirror?.attemptId === attempt.id && mirror.savedAt > Date.parse(attempt.updatedAt)) {
        return {
          ...attempt,
          answers: Object.fromEntries(Object.entries(mirror.answers)),
          marked: mirror.marked,
        };
      }
      return attempt;
    } catch {
      return null;
    }
  }, [basePath, mirrorKey, testSlug]);

  const start = useCallback(
    async (config: AttemptConfig, restart: boolean): Promise<AttemptRow | null> => {
      try {
        const r = await fetch(basePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...identity, testSlug, config, restart }),
        });
        if (!r.ok) {
          setSaveState("error");
          return null;
        }
        const { attempt } = (await r.json()) as { attempt: AttemptRow };
        setAttemptId(attempt.id);
        if (restart) clearMirror(mirrorKey);
        return attempt;
      } catch {
        // Không tạo được lượt ⇒ không có gì để auto-save. Báo ngay thay vì im lặng.
        setSaveState("error");
        return null;
      }
    },
    [basePath, mirrorKey, testSlug, identity],
  );

  const flush = useCallback(async () => {
    const id = attemptId;
    const body = pending.current;
    if (!id || !body) return;
    pending.current = null;
    setSaveState("saving");
    try {
      const r = await fetch(`${basePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSaveState(r.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }, [attemptId, basePath]);

  /** Gọi mỗi khi đáp án đổi; ghi localStorage ngay, đẩy lên server sau debounce. */
  const save = useCallback(
    (answers: Record<number, string>, marked: number[], secondsLeft: number | null) => {
      if (!attemptId) return;
      writeMirror(mirrorKey, { attemptId, answers, marked, savedAt: Date.now() });
      pending.current = { answers, marked, secondsLeft };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [attemptId, mirrorKey, flush],
  );

  const submit = useCallback(
    async (answers: Record<number, string>, marked: number[]) => {
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
      if (!attemptId) return null;
      try {
        const r = await fetch(`${basePath}/${attemptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, marked }),
        });
        clearMirror(mirrorKey);
        if (!r.ok) return null;
        return (await r.json()) as { attempt: AttemptRow; result: unknown };
      } catch {
        return null;
      }
    },
    [attemptId, basePath, mirrorKey],
  );

  // Đóng tab / chuyển tab giữa chừng thì đẩy nốt lần lưu đang chờ.
  // keepalive cho phép request sống qua lúc trang bị huỷ (sendBeacon chỉ POST
  // được nên không dùng cho route PATCH này).
  useEffect(() => {
    function onHide() {
      const id = attemptId;
      const body = pending.current;
      if (!id || !body || document.visibilityState !== "hidden") return;
      pending.current = null;
      fetch(`${basePath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [attemptId, basePath]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { attemptId, setAttemptId, saveState, fetchInProgress, start, save, submit };
}
