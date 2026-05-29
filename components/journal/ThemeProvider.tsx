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

export function JournalThemeWrapper({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [theme, setThemeState] = useState<JournalTheme>("warm");

  useEffect(() => {
    setThemeState(readStored());
  }, []);

  function setTheme(t: JournalTheme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={className}
        style={style}
        data-journal-theme={theme === "warm" ? undefined : theme}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
