"use client";

import { type JournalTheme, useJournalTheme } from "./ThemeProvider";

const THEMES: {
  id: JournalTheme;
  label: string;
  bg: string;
  header: string;
  accent: string;
  text: string;
}[] = [
  {
    id: "warm",
    label: "Ấm áp",
    bg: "#F5EFE6",
    header: "#3D2B1F",
    accent: "#C4622D",
    text: "#2C1E0F",
  },
  {
    id: "dark",
    label: "Tối",
    bg: "#141010",
    header: "#0E0B09",
    accent: "#E8895C",
    text: "#EDE4D7",
  },
  {
    id: "forest",
    label: "Rừng",
    bg: "#EEF2EC",
    header: "#1A3320",
    accent: "#3A7D44",
    text: "#1A2F1A",
  },
  {
    id: "ocean",
    label: "Biển",
    bg: "#EBF2F8",
    header: "#0D2233",
    accent: "#1B6CA8",
    text: "#0D2233",
  },
];

export function JournalThemePicker() {
  const { theme, setTheme } = useJournalTheme();

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Giao diện Journal
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {THEMES.map((t) => {
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              className="group flex flex-col overflow-hidden border-2 transition-all"
              style={{
                borderColor: active ? "var(--accent-primary)" : "var(--border)",
                borderRadius: "var(--radius-md)",
                outline: active ? "2px solid var(--accent-primary)" : "none",
                outlineOffset: "2px",
              }}
            >
              {/* Mini preview */}
              <div className="h-14 w-full" style={{ background: t.header }} />
              <div className="flex-1 flex flex-col gap-1 p-2" style={{ background: t.bg }}>
                <div
                  className="h-2 w-3/4 rounded-full"
                  style={{ background: t.text, opacity: 0.3 }}
                />
                <div
                  className="h-2 w-1/2 rounded-full"
                  style={{ background: t.accent, opacity: 0.7 }}
                />
              </div>
              <div
                className="px-2 py-1.5 text-xs font-medium text-center"
                style={{
                  background: t.bg,
                  color: t.text,
                  borderTop: `1px solid ${active ? t.accent : "rgba(0,0,0,0.08)"}`,
                }}
              >
                {active ? "✓ " : ""}{t.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
