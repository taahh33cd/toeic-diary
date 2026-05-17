"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type Locale = "vi" | "en";

const LOCALE_KEY = "journal_locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Inline translation helper: t("Tiếng Việt", "English") */
  t: (vi: string, en: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "vi",
  setLocale: () => {},
  t: (vi) => vi,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY) as Locale | null;
      if (saved === "en" || saved === "vi") setLocaleState(saved);
    } catch {}
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {}
  }

  function t(vi: string, en: string) {
    return locale === "en" ? en : vi;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
