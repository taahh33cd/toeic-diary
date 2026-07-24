"use client";

import { useEffect, useRef } from "react";

interface AudioShortcutHandlers {
  onTogglePlay: () => void;
  onRewind: () => void;
  onSpeedStep: (dir: 1 | -1) => void;
}

/**
 * Phím tắt điều khiển audio cho các bài dictation.
 *
 * Luôn đi kèm Ctrl/⌘ vì con trỏ đang nằm trong ô nhập đáp án — Enter, Tab và
 * Space đã có nghĩa riêng ở đó.
 *   Ctrl+Space → phát / tạm dừng
 *   Ctrl+←     → lùi 5 giây
 *   Ctrl+↑ ↓   → tăng / giảm tốc độ
 */
export function useAudioShortcuts(handlers: AudioShortcutHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;

      if (e.code === "Space") {
        e.preventDefault();
        ref.current.onTogglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        ref.current.onRewind();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        ref.current.onSpeedStep(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        ref.current.onSpeedStep(-1);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
