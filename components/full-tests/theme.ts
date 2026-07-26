// Palette màn full test. Light bám theo lib/skills/exam-theme (khu thi sẵn có)
// để đồng bộ; dark là bảng navy theo ảnh tham khảo. ExamShell cũ khoá nền trắng
// nên không dùng lại được ở đây — layout 3 khung full-width và có toggle sáng/tối.
import { EXAM, FAMILY } from "@/lib/skills/exam-theme";

export type Skin = "light" | "dark";

export interface Palette {
  bg: string;
  panel: string;
  panelAlt: string;
  card: string;
  border: string;
  borderSoft: string;
  ink: string;
  inkSoft: string;
  muted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  onPrimary: string;
  ok: string;
  warn: string;
  bad: string;
  marked: string;
  highlight: string;
  sans: string;
}

export const PALETTE: Record<Skin, Palette> = {
  light: {
    bg: "#f4f6f9",
    panel: "#ffffff",
    panelAlt: EXAM.panelAlt,
    card: "#ffffff",
    border: EXAM.border,
    borderSoft: "#e2e6ec",
    ink: EXAM.ink,
    inkSoft: EXAM.inkSoft,
    muted: EXAM.muted,
    primary: FAMILY.lr.primary,
    primaryDark: FAMILY.lr.dark,
    primarySoft: FAMILY.lr.soft,
    onPrimary: "#ffffff",
    ok: EXAM.ok,
    warn: EXAM.warn,
    bad: EXAM.bad,
    marked: "#c8871a",
    highlight: "#fff2a8",
    sans: EXAM.sans,
  },
  dark: {
    bg: "#0f172b",
    panel: "#16203a",
    panelAlt: "#1b2745",
    card: "#1b2745",
    border: "#2c3a5e",
    borderSoft: "#243352",
    ink: "#e8edf7",
    inkSoft: "#c3cde0",
    muted: "#8794ae",
    primary: "#2f9e6b",
    primaryDark: "#22754f",
    primarySoft: "#1d3a30",
    onPrimary: "#ffffff",
    ok: "#41c17e",
    warn: "#e0a544",
    bad: "#ef6b80",
    marked: "#e0a544",
    highlight: "#5d5326",
    sans: EXAM.sans,
  },
};
