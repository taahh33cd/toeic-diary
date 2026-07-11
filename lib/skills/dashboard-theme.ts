// Theme "control-room" cho landing /skills — CAM KẾT tông tối (không theo dark/light app),
// để khác biệt hẳn với các khu còn lại của web.

export const DASH = {
  bg: "#0b1220",
  panel: "#141d2f",
  panel2: "#1b2740",
  border: "#25324d",
  borderSoft: "#1c2740",
  text: "#e7ecf7",
  muted: "#8695b3",
  faint: "#5b6b8c",
  amber: "#ffb020",
  sans: "var(--font-be-vietnam), 'Be Vietnam Pro', system-ui, sans-serif",
  display: "var(--font-syne), 'Syne', system-ui, sans-serif",
  mono: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
} as const;

/** Accent riêng từng kỹ năng (đủ tương phản trên nền tối) */
export const SKILL_ACCENT: Record<string, string> = {
  listening: "#2fbf7a",
  reading: "#12b3a6",
  speaking: "#5b8cff",
  writing: "#8b7bff",
};
