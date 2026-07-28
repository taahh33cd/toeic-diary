"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunConfig } from "./SetupPanel";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface AttemptRow {
  id: string;
  testSlug: string;
  config: RunConfig;
  answers: Record<string, string>;
  marked: number[];
  secondsLeft: number | null;
  updatedAt: string;
}

/** Bản sao cục bộ — chỉ dùng khi mất mạng lúc đang làm, DB vẫn là nguồn chính. */
interface LocalMirror {
  attemptId: string;
  answers: Record<number, string>;
  marked: number[];
  savedAt: number;
}

const MIRROR_KEY = "fulltest:mirror";
const SAVE_DEBOUNCE_MS = 4000;

function readMirror(): LocalMirror | null {
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    return raw ? (JSON.parse(raw) as LocalMirror) : null;
  } catch {
    return null;
  }
}

function writeMirror(m: LocalMirror) {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(m));
  } catch {
    // hết quota thì thôi, không chặn người làm bài
  }
}

export function clearMirror() {
  try {
    localStorage.removeItem(MIRROR_KEY);
  } catch {
    // không sao
  }
}

/**
 * Quản lý một lượt làm bài trên server: tạo/khôi phục, auto-save có debounce,
 * và nộp bài. Mọi lỗi mạng đều không chặn UI — bài vẫn ghi vào localStorage.
 */
export function useAttempt(examSlug: string, testSlug: string) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ answers: Record<number, string>; marked: number[]; secondsLeft: number | null } | null>(null);

  /** Lượt đang làm dở trên server, kèm đáp án mới hơn từ bản sao cục bộ nếu có. */
  const fetchInProgress = useCallback(async (): Promise<AttemptRow | null> => {
    try {
      const r = await fetch(
        `/api/full-tests/attempts?testSlug=${encodeURIComponent(testSlug)}&status=in_progress`,
      );
      if (!r.ok) return null;
      const { attempt } = (await r.json()) as { attempt: AttemptRow | null };
      if (!attempt) return null;

      const mirror = readMirror();
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
  }, [testSlug]);

  const start = useCallback(
    async (config: RunConfig, restart: boolean): Promise<AttemptRow | null> => {
      try {
        const r = await fetch("/api/full-tests/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examSlug, testSlug, config, restart }),
        });
        if (!r.ok) return null;
        const { attempt } = (await r.json()) as { attempt: AttemptRow };
        setAttemptId(attempt.id);
        if (restart) clearMirror();
        return attempt;
      } catch {
        return null;
      }
    },
    [examSlug, testSlug],
  );

  const flush = useCallback(async () => {
    const id = attemptId;
    const body = pending.current;
    if (!id || !body) return;
    pending.current = null;
    setSaveState("saving");
    try {
      const r = await fetch(`/api/full-tests/attempts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSaveState(r.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }, [attemptId]);

  /** Gọi mỗi khi đáp án đổi; ghi localStorage ngay, đẩy lên server sau debounce. */
  const save = useCallback(
    (answers: Record<number, string>, marked: number[], secondsLeft: number | null) => {
      if (!attemptId) return;
      writeMirror({ attemptId, answers, marked, savedAt: Date.now() });
      pending.current = { answers, marked, secondsLeft };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
    },
    [attemptId, flush],
  );

  const submit = useCallback(
    async (answers: Record<number, string>, marked: number[]) => {
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
      if (!attemptId) return null;
      try {
        const r = await fetch(`/api/full-tests/attempts/${attemptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, marked }),
        });
        clearMirror();
        if (!r.ok) return null;
        return (await r.json()) as { attempt: AttemptRow; result: unknown };
      } catch {
        return null;
      }
    },
    [attemptId],
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
      fetch(`/api/full-tests/attempts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    }
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [attemptId]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { attemptId, setAttemptId, saveState, fetchInProgress, start, save, submit };
}
