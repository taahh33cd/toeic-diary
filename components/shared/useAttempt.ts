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
  /** Vị trí phát audio của chế độ thi thật — chỉ có trong bản sao cục bộ */
  progress?: ExamProgress;
}

/** Chế độ thi thật đang ở đâu: phần nghe tới đoạn nào, hay đã sang Reading. */
export interface ExamProgress {
  stage: "listening" | "reading";
  playIndex: number;
}

/** Khớp RunConfig của cả full test lẫn luyện part — hook không cần biết chi tiết. */
export interface AttemptConfig {
  mode: "real" | "practice";
  parts: PartNumber[];
  minutes: number;
  autoSubmit: boolean;
  instantFeedback: boolean;
}

/**
 * Bản sao cục bộ — dùng khi mất mạng lúc đang làm, DB vẫn là nguồn chính.
 * attemptId null = chưa tạo được lượt trên server (mất mạng ngay lúc bắt đầu):
 * khi đó bản sao là nơi duy nhất giữ bài, kèm config để tạo lượt sau.
 */
interface LocalMirror {
  attemptId: string | null;
  testSlug?: string;
  config?: AttemptConfig;
  answers: Record<number, string>;
  marked: number[];
  secondsLeft?: number | null;
  progress?: ExamProgress;
  savedAt: number;
}

type SaveBody = {
  answers: Record<number, string>;
  marked: number[];
  secondsLeft: number | null;
};

const SAVE_DEBOUNCE_MS = 4000;
/** Chưa có lượt trên server thì thử tạo lại, không dồn dập hơn mức này */
const RECREATE_EVERY_MS = 15000;

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
  const config = useRef<AttemptConfig | null>(null);
  const lastCreateTry = useRef(0);
  const pending = useRef<SaveBody | null>(null);

  /** Lượt đang làm dở trên server, kèm đáp án mới hơn từ bản sao cục bộ nếu có. */
  const fetchInProgress = useCallback(async (): Promise<AttemptRow | null> => {
    const mirror = readMirror(mirrorKey);
    // Bài chỉ có trên máy này (mất mạng lúc bắt đầu), hoặc server không trả lời.
    const fromMirror = (): AttemptRow | null =>
      mirror && mirror.testSlug === testSlug && mirror.config
        ? {
            id: mirror.attemptId ?? "",
            testSlug,
            config: mirror.config,
            answers: Object.fromEntries(Object.entries(mirror.answers)),
            marked: mirror.marked,
            secondsLeft: mirror.secondsLeft ?? null,
            updatedAt: new Date(mirror.savedAt).toISOString(),
            progress: mirror.progress,
          }
        : null;
    try {
      const r = await fetch(
        `${basePath}?testSlug=${encodeURIComponent(testSlug)}&status=in_progress`,
      );
      if (!r.ok) return fromMirror();
      const { attempt } = (await r.json()) as { attempt: AttemptRow | null };
      if (!attempt) return mirror?.attemptId === null ? fromMirror() : null;

      if (mirror?.attemptId !== attempt.id) return attempt;
      // Vị trí audio chỉ máy này biết, lấy luôn. Đáp án/đồng hồ thì lấy bản mới hơn.
      const withProgress = { ...attempt, progress: mirror.progress };
      if (mirror.savedAt > Date.parse(attempt.updatedAt)) {
        return {
          ...withProgress,
          answers: Object.fromEntries(Object.entries(mirror.answers)),
          marked: mirror.marked,
          secondsLeft: mirror.secondsLeft !== undefined ? mirror.secondsLeft : attempt.secondsLeft,
        };
      }
      return withProgress;
    } catch {
      return fromMirror();
    }
  }, [basePath, mirrorKey, testSlug]);

  const start = useCallback(
    async (cfg: AttemptConfig, restart: boolean): Promise<AttemptRow | null> => {
      config.current = cfg;
      lastCreateTry.current = Date.now();
      try {
        const r = await fetch(basePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...identity, testSlug, config: cfg, restart }),
        });
        if (!r.ok) {
          setSaveState("error");
          return null;
        }
        const { attempt } = (await r.json()) as { attempt: AttemptRow };
        setAttemptId(attempt.id);
        setSaveState("idle");
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

  const flush = useCallback(async (idOverride?: string) => {
    const id = idOverride ?? attemptId;
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

  /**
   * Gọi mỗi khi đáp án/đồng hồ đổi; ghi localStorage ngay, đẩy lên server sau
   * debounce. `now` = gửi ngay bằng keepalive (lúc ẩn tab / sắp đóng trang).
   */
  const save = useCallback(
    (
      answers: Record<number, string>,
      marked: number[],
      secondsLeft: number | null,
      opts?: { progress?: ExamProgress; now?: boolean },
    ) => {
      writeMirror(mirrorKey, {
        attemptId, testSlug, config: config.current ?? undefined,
        answers, marked, secondsLeft, progress: opts?.progress, savedAt: Date.now(),
      });
      pending.current = { answers, marked, secondsLeft };
      if (timer.current) clearTimeout(timer.current);
      if (!attemptId) {
        // Chưa có lượt trên server: bài đã nằm trong localStorage, thỉnh thoảng
        // thử tạo lượt lại; được thì đẩy luôn bản mới nhất lên.
        const cfg = config.current;
        if (!cfg || Date.now() - lastCreateTry.current < RECREATE_EVERY_MS) return;
        lastCreateTry.current = Date.now();
        fetch(basePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...identity, testSlug, config: cfg, restart: false }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((res: { attempt: AttemptRow } | null) => {
            if (!res) return;
            setAttemptId(res.attempt.id);
            void flush(res.attempt.id); // đẩy ngay bản đang chờ lên lượt vừa tạo
          })
          .catch(() => {});
        return;
      }
      if (opts?.now) {
        const body = pending.current;
        pending.current = null;
        fetch(`${basePath}/${attemptId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
        }).catch(() => {});
        return;
      }
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [attemptId, basePath, mirrorKey, flush, identity, testSlug],
  );

  /**
   * Nộp bài. Trả true khi server đã chốt lượt làm. Thất bại thì giữ nguyên bản
   * sao cục bộ để còn nộp lại. Chưa tạo được lượt (mất mạng lúc bắt đầu) thì
   * tạo lượt trước rồi mới nộp.
   */
  const submit = useCallback(
    async (answers: Record<number, string>, marked: number[], config?: AttemptConfig): Promise<boolean> => {
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
      let id = attemptId;
      try {
        if (!id && config) {
          const r = await fetch(basePath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...identity, testSlug, config, restart: false }),
          });
          if (r.ok) {
            id = ((await r.json()) as { attempt: AttemptRow }).attempt.id;
            setAttemptId(id);
          }
        }
        if (!id) return false;
        const r = await fetch(`${basePath}/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, marked }),
        });
        // 409 = lượt này đã được nộp (vd lần bấm trước đã tới server) — coi như xong.
        const ok = r.ok || r.status === 409;
        if (ok) clearMirror(mirrorKey);
        return ok;
      } catch {
        return false;
      }
    },
    [attemptId, basePath, mirrorKey, identity, testSlug],
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
