"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type JournalTheme = "warm" | "dark" | "forest" | "ocean" | "rose" | "lavender" | "butter" | "mint";

interface ThemeContextValue {
  theme: JournalTheme;
  setTheme: (t: JournalTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "warm",
  setTheme: () => {},
});

export function useJournalTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "journal-theme";

const VALID_THEMES = new Set<string>(["warm","dark","forest","ocean","rose","lavender","butter","mint"]);

function readStored(): JournalTheme {
  if (typeof window === "undefined") return "warm";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && VALID_THEMES.has(v)) return v as JournalTheme;
  return "warm";
}

type Vars = Record<string, string>;

const THEME_VARS: Record<JournalTheme, Vars> = {
  warm: {
    "--bg-primary":           "#F5EFE6",
    "--bg-secondary":         "#EDE4D7",
    "--bg-elevated":          "#FBF7F2",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#2C1E0F",
    "--text-secondary":       "#6B4F3A",
    "--text-muted":           "#A08060",
    "--accent-primary":       "#C4622D",
    "--accent-primary-hover": "#A84E22",
    "--border":               "#D9C8B4",
    "--border-focus":         "#C4622D",
    "--shadow-sm":            "0 1px 3px rgba(44,30,15,.08)",
    "--shadow-md":            "0 4px 12px rgba(44,30,15,.10)",
    "--orange":               "#C4622D",
    "--orange2":              "#E8885C",
    "--accent-faint":         "rgba(196,98,45,.07)",
    "--journal-ink":          "#3D2B1F",
    "--ink2":                 "#4A3020",
    "--journal-header-bg":    "#3D2B1F",
    "--journal-header-border":"#2A1F15",
  },
  dark: {
    "--bg-primary":           "#141010",
    "--bg-secondary":         "#1C1614",
    "--bg-elevated":          "#231E1C",
    "--bg-card":              "#2A2320",
    "--text-primary":         "#EDE4D7",
    "--text-secondary":       "#A8927A",
    "--text-muted":           "#6B5040",
    "--accent-primary":       "#E8895C",
    "--accent-primary-hover": "#FF7A3D",
    "--border":               "#332820",
    "--border-focus":         "#E8895C",
    "--shadow-sm":            "0 1px 3px rgba(0,0,0,.4)",
    "--shadow-md":            "0 4px 12px rgba(0,0,0,.5)",
    "--orange":               "#E8895C",
    "--orange2":              "#FF9A6C",
    "--accent-faint":         "rgba(232,137,92,.09)",
    "--journal-ink":          "#1C1614",
    "--ink2":                 "#231E1C",
    "--journal-header-bg":    "#0E0B09",
    "--journal-header-border":"#1C1614",
  },
  forest: {
    "--bg-primary":           "#EEF2EC",
    "--bg-secondary":         "#E1E9DF",
    "--bg-elevated":          "#F5F8F4",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#1A2F1A",
    "--text-secondary":       "#456045",
    "--text-muted":           "#7A9B7A",
    "--accent-primary":       "#3A7D44",
    "--accent-primary-hover": "#2D6235",
    "--border":               "#C4D4C0",
    "--border-focus":         "#3A7D44",
    "--shadow-sm":            "0 1px 3px rgba(26,47,26,.08)",
    "--shadow-md":            "0 4px 12px rgba(26,47,26,.10)",
    "--orange":               "#3A7D44",
    "--orange2":              "#4D9A57",
    "--accent-faint":         "rgba(58,125,68,.07)",
    "--journal-ink":          "#1A3320",
    "--ink2":                 "#243A24",
    "--journal-header-bg":    "#1A3320",
    "--journal-header-border":"#122616",
  },
  ocean: {
    "--bg-primary":           "#EBF2F8",
    "--bg-secondary":         "#DCE9F4",
    "--bg-elevated":          "#F4F9FD",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#0D2233",
    "--text-secondary":       "#2E5A7A",
    "--text-muted":           "#6A9AB8",
    "--accent-primary":       "#1B6CA8",
    "--accent-primary-hover": "#145490",
    "--border":               "#B8D4E8",
    "--border-focus":         "#1B6CA8",
    "--shadow-sm":            "0 1px 3px rgba(13,34,51,.08)",
    "--shadow-md":            "0 4px 12px rgba(13,34,51,.10)",
    "--orange":               "#1B6CA8",
    "--orange2":              "#2B84CA",
    "--accent-faint":         "rgba(27,108,168,.07)",
    "--journal-ink":          "#0D2233",
    "--ink2":                 "#142D40",
    "--journal-header-bg":    "#0D2233",
    "--journal-header-border":"#091827",
  },

  // ── Pastel themes ──────────────────────────────────────────────────────────

  rose: {
    "--bg-primary":           "#FDF0F3",
    "--bg-secondary":         "#FAE3E9",
    "--bg-elevated":          "#FEF7F9",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3D1520",
    "--text-secondary":       "#7A3040",
    "--text-muted":           "#B07888",
    "--accent-primary":       "#C2364F",
    "--accent-primary-hover": "#A02A40",
    "--border":               "#F0C8D0",
    "--border-focus":         "#C2364F",
    "--shadow-sm":            "0 1px 3px rgba(61,21,32,.08)",
    "--shadow-md":            "0 4px 12px rgba(61,21,32,.10)",
    "--orange":               "#C2364F",
    "--orange2":              "#E05570",
    "--accent-faint":         "rgba(194,54,79,.07)",
    "--journal-ink":          "#6B2035",
    "--ink2":                 "#7E2A42",
    "--journal-header-bg":    "#6B2035",
    "--journal-header-border":"#501828",
  },

  lavender: {
    "--bg-primary":           "#F3EFFE",
    "--bg-secondary":         "#E8E0FB",
    "--bg-elevated":          "#F9F7FF",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#2A1A4A",
    "--text-secondary":       "#5A3A80",
    "--text-muted":           "#9070B0",
    "--accent-primary":       "#7B4FC9",
    "--accent-primary-hover": "#6238AA",
    "--border":               "#D4C8F0",
    "--border-focus":         "#7B4FC9",
    "--shadow-sm":            "0 1px 3px rgba(42,26,74,.08)",
    "--shadow-md":            "0 4px 12px rgba(42,26,74,.10)",
    "--orange":               "#7B4FC9",
    "--orange2":              "#9968E0",
    "--accent-faint":         "rgba(123,79,201,.07)",
    "--journal-ink":          "#3A2060",
    "--ink2":                 "#4A2870",
    "--journal-header-bg":    "#3A2060",
    "--journal-header-border":"#2A1648",
  },

  butter: {
    "--bg-primary":           "#FDF8E3",
    "--bg-secondary":         "#FAF0CC",
    "--bg-elevated":          "#FEFCF2",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3A2A00",
    "--text-secondary":       "#7A5800",
    "--text-muted":           "#B08A30",
    "--accent-primary":       "#C47C00",
    "--accent-primary-hover": "#A06200",
    "--border":               "#ECD898",
    "--border-focus":         "#C47C00",
    "--shadow-sm":            "0 1px 3px rgba(58,42,0,.08)",
    "--shadow-md":            "0 4px 12px rgba(58,42,0,.10)",
    "--orange":               "#C47C00",
    "--orange2":              "#E09A10",
    "--accent-faint":         "rgba(196,124,0,.07)",
    "--journal-ink":          "#5A3A00",
    "--ink2":                 "#6A4800",
    "--journal-header-bg":    "#5A3A00",
    "--journal-header-border":"#402800",
  },

  mint: {
    "--bg-primary":           "#EDFAF6",
    "--bg-secondary":         "#D8F4EC",
    "--bg-elevated":          "#F5FDFB",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#0D3028",
    "--text-secondary":       "#2A6A56",
    "--text-muted":           "#5A9A88",
    "--accent-primary":       "#1A8C6A",
    "--accent-primary-hover": "#137055",
    "--border":               "#B0DDD0",
    "--border-focus":         "#1A8C6A",
    "--shadow-sm":            "0 1px 3px rgba(13,48,40,.08)",
    "--shadow-md":            "0 4px 12px rgba(13,48,40,.10)",
    "--orange":               "#1A8C6A",
    "--orange2":              "#28AA82",
    "--accent-faint":         "rgba(26,140,106,.07)",
    "--journal-ink":          "#0D4535",
    "--ink2":                 "#155545",
    "--journal-header-bg":    "#0D4535",
    "--journal-header-border":"#083328",
  },
};

export function JournalThemeWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [theme, setThemeState] = useState<JournalTheme>("warm");

  useEffect(() => {
    setThemeState(readStored());
  }, []);

  function setTheme(t: JournalTheme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  const vars = THEME_VARS[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={className}
        style={{
          background: vars["--bg-primary"],
          color: vars["--text-primary"],
          ...(vars as React.CSSProperties),
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
