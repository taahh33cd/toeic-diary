"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type JournalTheme = "warm" | "dark" | "forest" | "ocean";

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

function readStored(): JournalTheme {
  if (typeof window === "undefined") return "warm";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "dark" || v === "forest" || v === "ocean") return v;
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
    "--accent-faint":         "rgba(196,98,45,.07)",
    "--journal-ink":          "#3D2B1F",
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
    "--accent-faint":         "rgba(232,137,92,.09)",
    "--journal-ink":          "#1C1614",
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
    "--accent-faint":         "rgba(58,125,68,.07)",
    "--journal-ink":          "#1A3320",
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
    "--accent-faint":         "rgba(27,108,168,.07)",
    "--journal-ink":          "#0D2233",
    "--journal-header-bg":    "#0D2233",
    "--journal-header-border":"#091827",
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
