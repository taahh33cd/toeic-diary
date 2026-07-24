"use client";

export type HintMode = "blanks" | "sentence" | "words" | "summary";

interface Hint {
  keys: string[];
  label: string;
}

// Phím tắt audio — giống nhau ở mọi level
const AUDIO_HINTS: Hint[] = [
  { keys: ["Ctrl", "Space"], label: "phát / tạm dừng" },
  { keys: ["Ctrl", "←"], label: "lùi 5 giây" },
  { keys: ["Ctrl", "↑ / ↓"], label: "tốc độ" },
];

const TASK_HINTS: Record<HintMode, Hint[]> = {
  blanks: [
    { keys: ["Enter"], label: "kiểm tra ô đang gõ" },
    { keys: ["Tab"], label: "chuyển ô trống" },
  ],
  sentence: [{ keys: ["Enter"], label: "kiểm tra cả câu" }],
  words: [
    { keys: ["Enter"], label: "xác nhận từ" },
    { keys: ["Tab"], label: "chuyển từ sai" },
  ],
  summary: [],
};

const NOTES: Record<HintMode, string> = {
  blanks: "Gõ sai một lần sẽ mở thêm một chữ gợi ý",
  sentence: "",
  words: "",
  summary: 'Bấm "Nhận AI Feedback" để gửi bài',
};

const MOBILE_HINTS: Record<HintMode, string> = {
  blanks:
    "Chạm vào ô trống để gõ · nhấn Enter (hoặc ✓ / Go) trên bàn phím ảo để kiểm tra · chạm ô trống kế tiếp để chuyển · chạm Replay để nghe lại.",
  sentence:
    "Gõ cả câu rồi nhấn Enter (hoặc ✓ / Go) trên bàn phím ảo để kiểm tra · chạm Replay để nghe lại · chạm nút tốc độ để nghe chậm hơn.",
  words:
    "Chạm vào từ sai để gõ lại · nhấn Enter trên bàn phím ảo để xác nhận · chạm Replay để nghe lại.",
  summary:
    'Viết tóm tắt bằng tiếng Anh · chạm nút phát để nghe lại · bấm "Nhận AI Feedback" để gửi.',
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] font-mono text-[11px] font-semibold text-[var(--text-secondary)] shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Thanh gợi ý thao tác bàn phím, đặt ngay dưới khu vực nhập đáp án.
 * Desktop: các chip phím tắt. Mobile: hướng dẫn cảm ứng tương ứng.
 */
export function KeyboardHints({ mode }: { mode: HintMode }) {
  const hints = [...TASK_HINTS[mode], ...AUDIO_HINTS];
  const note = NOTES[mode];

  return (
    <>
      <div className="hidden md:flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-6 select-none">
        {hints.map((hint, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[var(--text-muted)] mr-1.5">·</span>}
            <span className="flex items-center gap-0.5">
              {hint.keys.map((k, j) => (
                <span key={j} className="flex items-center gap-0.5">
                  {j > 0 && <span className="text-[10px] text-[var(--text-muted)]">+</span>}
                  <Kbd>{k}</Kbd>
                </span>
              ))}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{hint.label}</span>
          </span>
        ))}
        {note && (
          <span className="text-xs text-[var(--text-muted)] italic basis-full text-center">
            {note}
          </span>
        )}
      </div>

      <p className="md:hidden text-xs text-[var(--text-muted)] text-center leading-relaxed mt-4 select-none">
        👆 {MOBILE_HINTS[mode]}
      </p>
    </>
  );
}
