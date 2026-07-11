// Theme "giao diện thi thật" TOEIC (bám chuẩn ETS CBT).
// Màn làm bài KHÓA nền trắng (không theo dark/light của app) để giống thi thật,
// nên dùng hằng số màu tại đây thay vì CSS var của app.

export type Family = "lr" | "sw";

/** Màu theo họ bài thi: Listening/Reading (xanh lá) · Speaking/Writing (navy) */
export const FAMILY: Record<Family, { primary: string; dark: string; accent: string; soft: string }> = {
  lr: { primary: "#0b683f", dark: "#08502f", accent: "#b0bb36", soft: "#eaf5ef" },
  sw: { primary: "#1e419a", dark: "#16306f", accent: "#60a3d8", soft: "#eef3fc" },
};

/** Bảng màu bề mặt bài thi (trắng cố định) */
export const EXAM = {
  bg: "#ffffff",
  panel: "#f4f6f9",
  panelAlt: "#eef1f5",
  border: "#c9ced6",
  ink: "#1a2230",
  inkSoft: "#3a4457",
  muted: "#8a94a6",
  ok: "#1f9d57",
  warn: "#c8871a",
  bad: "#d1435b",
  sans: "Arial, Helvetica, 'Segoe UI', sans-serif",
} as const;

export function familyOf(skillSlug: string): Family {
  return skillSlug === "listening" || skillSlug === "reading" ? "lr" : "sw";
}
