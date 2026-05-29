"use client";

import { type JournalTheme, useJournalTheme } from "./ThemeProvider";

type ThemeSpec = {
  id: JournalTheme;
  label: string;
  bg: string;
  header: string;
  accent: string;
  text: string;
};

const BASE_THEMES: ThemeSpec[] = [
  { id: "warm",     label: "Ấm áp",    bg: "#F5EFE6", header: "#3D2B1F", accent: "#C4622D", text: "#2C1E0F" },
  { id: "dark",     label: "Tối",      bg: "#141010", header: "#0E0B09", accent: "#E8895C", text: "#EDE4D7" },
  { id: "forest",   label: "Rừng",     bg: "#EEF2EC", header: "#1A3320", accent: "#3A7D44", text: "#1A2F1A" },
  { id: "ocean",    label: "Biển",     bg: "#EBF2F8", header: "#0D2233", accent: "#1B6CA8", text: "#0D2233" },
];

const PASTEL_THEMES: ThemeSpec[] = [
  { id: "rose",     label: "Hồng",     bg: "#FDF0F3", header: "#6B2035", accent: "#C2364F", text: "#3D1520" },
  { id: "lavender", label: "Lavender", bg: "#F3EFFE", header: "#3A2060", accent: "#7B4FC9", text: "#2A1A4A" },
  { id: "butter",   label: "Bơ",       bg: "#FDF8E3", header: "#5A3A00", accent: "#C47C00", text: "#3A2A00" },
  { id: "mint",     label: "Mint",     bg: "#EDFAF6", header: "#0D4535", accent: "#1A8C6A", text: "#0D3028" },
];

function ThemeCard({ t, active, onClick }: { t: ThemeSpec; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={t.label}
      className="flex flex-col overflow-hidden border-2 transition-all"
      style={{
        borderColor: active ? t.accent : "rgba(0,0,0,0.1)",
        borderRadius: "var(--radius-md, 10px)",
        outline: active ? `2px solid ${t.accent}` : "none",
        outlineOffset: "2px",
        cursor: "pointer",
        background: "none",
        padding: 0,
      }}
    >
      {/* Header strip */}
      <div className="h-10 w-full" style={{ background: t.header }} />
      {/* Body preview */}
      <div className="flex-1 flex flex-col gap-1 px-2 py-1.5" style={{ background: t.bg }}>
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: t.text, opacity: 0.25 }} />
        <div className="h-1.5 w-1/2 rounded-full" style={{ background: t.accent, opacity: 0.6 }} />
      </div>
      {/* Label */}
      <div
        className="px-1.5 py-1 text-[11px] font-medium text-center"
        style={{
          background: t.bg,
          color: t.text,
          borderTop: `1px solid ${active ? t.accent : "rgba(0,0,0,0.07)"}`,
        }}
      >
        {active ? "✓ " : ""}{t.label}
      </div>
    </button>
  );
}

export function JournalThemePicker() {
  const { theme, setTheme } = useJournalTheme();

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Giao diện Journal
      </h2>

      {/* Base themes */}
      <div>
        <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Cơ bản
        </p>
        <div className="grid grid-cols-4 gap-2">
          {BASE_THEMES.map((t) => (
            <ThemeCard key={t.id} t={t} active={theme === t.id} onClick={() => setTheme(t.id)} />
          ))}
        </div>
      </div>

      {/* Pastel themes */}
      <div>
        <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Pastel
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PASTEL_THEMES.map((t) => (
            <ThemeCard key={t.id} t={t} active={theme === t.id} onClick={() => setTheme(t.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
