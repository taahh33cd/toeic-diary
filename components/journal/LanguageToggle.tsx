"use client";

import { useLocale } from "@/hooks/useLocale";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const isEn = locale === "en";

  return (
    <button
      onClick={() => setLocale(isEn ? "vi" : "en")}
      aria-label={isEn ? "Chuyển sang Tiếng Việt" : "Switch to English"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <span aria-hidden="true">{isEn ? "🇻🇳" : "🇬🇧"}</span>
      <span>{isEn ? "VI" : "EN"}</span>
    </button>
  );
}
