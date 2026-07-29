import type { CSSProperties } from "react";

/**
 * Cỡ chữ và kích thước co giãn theo bề ngang viewport. Dùng chung cho màn hình
 * glossary và màn hình làm bài để hai bên luôn cùng cỡ trên mọi thiết bị.
 */
export const FS = {
  xs: "clamp(0.75rem, 0.68rem + 0.24vw, 0.9rem)",
  sm: "clamp(0.85rem, 0.77rem + 0.3vw, 1.05rem)",
  md: "clamp(0.98rem, 0.88rem + 0.36vw, 1.2rem)",
  lg: "clamp(1.15rem, 0.98rem + 0.6vw, 1.55rem)",
  xl: "clamp(1.7rem, 1.3rem + 1.4vw, 2.6rem)",
} as const;

/** Khung trang: rộng theo màn hình, chặn ở 1280px để dòng chữ không quá dài. */
export const CONTAINER: CSSProperties = {
  width: "100%",
  maxWidth: 1280,
  margin: "0 auto",
};

/** Padding ngang dùng chung cho các dải ngang (header, directions, chân trang). */
export const PAD_X = "clamp(1rem, 3vw, 2.75rem)";

/** Chiều cao dải header CBT. */
export const STRIP_H = "clamp(52px, 5vw, 68px)";

/** Chiều cao topbar của GrammarShell — để nội dung căng đúng phần còn lại. */
export const TOPBAR_H = 64;

/** Nội dung cao tối thiểu bằng viewport, chân trang nằm sát đáy. */
export const FILL_SCREEN: CSSProperties = {
  minHeight: `calc(100dvh - ${TOPBAR_H}px)`,
  display: "flex",
  flexDirection: "column",
};
