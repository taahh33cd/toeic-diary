"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type JournalTheme =
  | "warm" | "dark" | "forest" | "ocean"
  | "rose" | "lavender" | "butter" | "mint"
  | "peach" | "sakura" | "honey" | "mauve" | "wheat"
  | "sky" | "periwinkle" | "seafoam" | "slate" | "violet";

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

export const VALID_THEMES = new Set<string>([
  "warm","dark","forest","ocean",
  "rose","lavender","butter","mint",
  "peach","sakura","honey","mauve","wheat",
  "sky","periwinkle","seafoam","slate","violet",
]);

function readLocalCache(): JournalTheme | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && VALID_THEMES.has(v)) return v as JournalTheme;
  return null;
}

async function persistTheme(theme: JournalTheme) {
  // Optimistic local cache — always fast
  localStorage.setItem(STORAGE_KEY, theme);
  // Persist to account — fire-and-forget
  await fetch("/api/journal/theme", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
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

  // ── Pastel Ấm ─────────────────────────────────────────────────────────────

  peach: {
    "--bg-primary":           "#FEF0E8",
    "--bg-secondary":         "#FDE3D4",
    "--bg-elevated":          "#FEF8F4",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3D1A00",
    "--text-secondary":       "#7A3C10",
    "--text-muted":           "#B07050",
    "--accent-primary":       "#D4622A",
    "--accent-primary-hover": "#B04A18",
    "--border":               "#F0D0B8",
    "--border-focus":         "#D4622A",
    "--shadow-sm":            "0 1px 3px rgba(61,26,0,.08)",
    "--shadow-md":            "0 4px 12px rgba(61,26,0,.10)",
    "--orange":               "#D4622A",
    "--orange2":              "#F07840",
    "--accent-faint":         "rgba(212,98,42,.07)",
    "--journal-ink":          "#7A3010",
    "--ink2":                 "#8A4020",
    "--journal-header-bg":    "#7A3010",
    "--journal-header-border":"#5A2008",
  },

  sakura: {
    "--bg-primary":           "#FDF3F5",
    "--bg-secondary":         "#FAE6EB",
    "--bg-elevated":          "#FEF8F9",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3A1020",
    "--text-secondary":       "#7A2840",
    "--text-muted":           "#B07888",
    "--accent-primary":       "#C44870",
    "--accent-primary-hover": "#A03058",
    "--border":               "#F0C8D4",
    "--border-focus":         "#C44870",
    "--shadow-sm":            "0 1px 3px rgba(58,16,32,.08)",
    "--shadow-md":            "0 4px 12px rgba(58,16,32,.10)",
    "--orange":               "#C44870",
    "--orange2":              "#E06088",
    "--accent-faint":         "rgba(196,72,112,.07)",
    "--journal-ink":          "#6B2040",
    "--ink2":                 "#7E2A50",
    "--journal-header-bg":    "#6B2040",
    "--journal-header-border":"#501830",
  },

  honey: {
    "--bg-primary":           "#FEF6E0",
    "--bg-secondary":         "#FDF0C8",
    "--bg-elevated":          "#FEFBF0",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3A2800",
    "--text-secondary":       "#7A5400",
    "--text-muted":           "#B08A28",
    "--accent-primary":       "#B87A00",
    "--accent-primary-hover": "#946200",
    "--border":               "#EED890",
    "--border-focus":         "#B87A00",
    "--shadow-sm":            "0 1px 3px rgba(58,40,0,.08)",
    "--shadow-md":            "0 4px 12px rgba(58,40,0,.10)",
    "--orange":               "#B87A00",
    "--orange2":              "#D49A10",
    "--accent-faint":         "rgba(184,122,0,.07)",
    "--journal-ink":          "#5A3A00",
    "--ink2":                 "#6A4A00",
    "--journal-header-bg":    "#5A3A00",
    "--journal-header-border":"#402800",
  },

  mauve: {
    "--bg-primary":           "#F6EEF6",
    "--bg-secondary":         "#EEE0EE",
    "--bg-elevated":          "#FAF5FA",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3A1C38",
    "--text-secondary":       "#7A4278",
    "--text-muted":           "#A870A4",
    "--accent-primary":       "#A05A9C",
    "--accent-primary-hover": "#804480",
    "--border":               "#DEC8DE",
    "--border-focus":         "#A05A9C",
    "--shadow-sm":            "0 1px 3px rgba(58,28,56,.08)",
    "--shadow-md":            "0 4px 12px rgba(58,28,56,.10)",
    "--orange":               "#A05A9C",
    "--orange2":              "#C070BC",
    "--accent-faint":         "rgba(160,90,156,.07)",
    "--journal-ink":          "#5A2A56",
    "--ink2":                 "#6A3466",
    "--journal-header-bg":    "#5A2A56",
    "--journal-header-border":"#421840",
  },

  wheat: {
    "--bg-primary":           "#F8F2E8",
    "--bg-secondary":         "#F0E6D4",
    "--bg-elevated":          "#FBF8F2",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#3A2C18",
    "--text-secondary":       "#705830",
    "--text-muted":           "#A08858",
    "--accent-primary":       "#8A6A3A",
    "--accent-primary-hover": "#6E5228",
    "--border":               "#DDD0B8",
    "--border-focus":         "#8A6A3A",
    "--shadow-sm":            "0 1px 3px rgba(58,44,24,.08)",
    "--shadow-md":            "0 4px 12px rgba(58,44,24,.10)",
    "--orange":               "#8A6A3A",
    "--orange2":              "#A88050",
    "--accent-faint":         "rgba(138,106,58,.07)",
    "--journal-ink":          "#5A4228",
    "--ink2":                 "#6A5038",
    "--journal-header-bg":    "#5A4228",
    "--journal-header-border":"#402E18",
  },

  // ── Pastel Lạnh ────────────────────────────────────────────────────────────

  sky: {
    "--bg-primary":           "#EDF6FE",
    "--bg-secondary":         "#D8ECFD",
    "--bg-elevated":          "#F5FAFF",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#0A2840",
    "--text-secondary":       "#1E5880",
    "--text-muted":           "#5090B8",
    "--accent-primary":       "#2A7CC4",
    "--accent-primary-hover": "#1A60A8",
    "--border":               "#B8D8F0",
    "--border-focus":         "#2A7CC4",
    "--shadow-sm":            "0 1px 3px rgba(10,40,64,.08)",
    "--shadow-md":            "0 4px 12px rgba(10,40,64,.10)",
    "--orange":               "#2A7CC4",
    "--orange2":              "#4098DC",
    "--accent-faint":         "rgba(42,124,196,.07)",
    "--journal-ink":          "#0A3860",
    "--ink2":                 "#104870",
    "--journal-header-bg":    "#0A3860",
    "--journal-header-border":"#062848",
  },

  periwinkle: {
    "--bg-primary":           "#EEEFFE",
    "--bg-secondary":         "#DDE0FD",
    "--bg-elevated":          "#F5F6FF",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#1A1A4A",
    "--text-secondary":       "#3A3A80",
    "--text-muted":           "#7070B8",
    "--accent-primary":       "#5462CC",
    "--accent-primary-hover": "#3E4AB0",
    "--border":               "#C8CCEE",
    "--border-focus":         "#5462CC",
    "--shadow-sm":            "0 1px 3px rgba(26,26,74,.08)",
    "--shadow-md":            "0 4px 12px rgba(26,26,74,.10)",
    "--orange":               "#5462CC",
    "--orange2":              "#707AE4",
    "--accent-faint":         "rgba(84,98,204,.07)",
    "--journal-ink":          "#2A2A6A",
    "--ink2":                 "#383878",
    "--journal-header-bg":    "#2A2A6A",
    "--journal-header-border":"#1A1A52",
  },

  seafoam: {
    "--bg-primary":           "#EAFAF6",
    "--bg-secondary":         "#D4F4EC",
    "--bg-elevated":          "#F3FCFA",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#0A2E28",
    "--text-secondary":       "#1E6454",
    "--text-muted":           "#509C88",
    "--accent-primary":       "#1E9A7A",
    "--accent-primary-hover": "#147C62",
    "--border":               "#B0DDD4",
    "--border-focus":         "#1E9A7A",
    "--shadow-sm":            "0 1px 3px rgba(10,46,40,.08)",
    "--shadow-md":            "0 4px 12px rgba(10,46,40,.10)",
    "--orange":               "#1E9A7A",
    "--orange2":              "#30B890",
    "--accent-faint":         "rgba(30,154,122,.07)",
    "--journal-ink":          "#0A4838",
    "--ink2":                 "#105848",
    "--journal-header-bg":    "#0A4838",
    "--journal-header-border":"#063428",
  },

  slate: {
    "--bg-primary":           "#EEF3F8",
    "--bg-secondary":         "#DCE8F0",
    "--bg-elevated":          "#F5F8FB",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#0A2030",
    "--text-secondary":       "#2A4A60",
    "--text-muted":           "#608098",
    "--accent-primary":       "#3A6A8A",
    "--accent-primary-hover": "#2A5270",
    "--border":               "#B8CEDC",
    "--border-focus":         "#3A6A8A",
    "--shadow-sm":            "0 1px 3px rgba(10,32,48,.08)",
    "--shadow-md":            "0 4px 12px rgba(10,32,48,.10)",
    "--orange":               "#3A6A8A",
    "--orange2":              "#5088A8",
    "--accent-faint":         "rgba(58,106,138,.07)",
    "--journal-ink":          "#1A3A50",
    "--ink2":                 "#224860",
    "--journal-header-bg":    "#1A3A50",
    "--journal-header-border":"#102838",
  },

  violet: {
    "--bg-primary":           "#F2EFFE",
    "--bg-secondary":         "#E4DEFE",
    "--bg-elevated":          "#F8F6FF",
    "--bg-card":              "#FFFFFF",
    "--text-primary":         "#200A40",
    "--text-secondary":       "#4A1A80",
    "--text-muted":           "#8050B8",
    "--accent-primary":       "#7A3AC4",
    "--accent-primary-hover": "#6028A8",
    "--border":               "#D0C0EC",
    "--border-focus":         "#7A3AC4",
    "--shadow-sm":            "0 1px 3px rgba(32,10,64,.08)",
    "--shadow-md":            "0 4px 12px rgba(32,10,64,.10)",
    "--orange":               "#7A3AC4",
    "--orange2":              "#9858DC",
    "--accent-faint":         "rgba(122,58,196,.07)",
    "--journal-ink":          "#40188A",
    "--ink2":                 "#4E229A",
    "--journal-header-bg":    "#40188A",
    "--journal-header-border":"#2E1068",
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
  initialTheme,
}: {
  children: React.ReactNode;
  className?: string;
  initialTheme?: string;
}) {
  // Server provides the DB value; fall back to local cache, then "warm"
  const serverTheme = (initialTheme && VALID_THEMES.has(initialTheme))
    ? initialTheme as JournalTheme
    : null;

  const [theme, setThemeState] = useState<JournalTheme>(serverTheme ?? "warm");

  useEffect(() => {
    if (serverTheme) {
      // Server has a value — sync local cache silently
      localStorage.setItem(STORAGE_KEY, serverTheme);
    } else {
      // DB not set yet — check if user had a preference in localStorage
      // and migrate it to the DB
      const cached = readLocalCache();
      if (cached && cached !== "warm") {
        setThemeState(cached);
        persistTheme(cached); // migrate to DB
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(t: JournalTheme) {
    setThemeState(t);
    persistTheme(t);
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
