"use client";

import { useState } from "react";
import { type JournalTheme, useJournalTheme } from "./ThemeProvider";

// ── Theme metadata for preview cards ──────────────────────────────────────────

type ThemeMeta = {
  id: JournalTheme;
  label: string;
  bg: string;
  header: string;
  accent: string;
  text: string;
};

const GROUPS: Array<{ label: string; themes: ThemeMeta[] }> = [
  {
    label: "Cơ bản",
    themes: [
      { id: "warm",       label: "Ấm áp",      bg: "#F5EFE6", header: "#3D2B1F", accent: "#C4622D", text: "#2C1E0F" },
      { id: "dark",       label: "Tối",         bg: "#1C1614", header: "#0E0B09", accent: "#E8895C", text: "#EDE4D7" },
      { id: "forest",     label: "Rừng",        bg: "#EEF2EC", header: "#1A3320", accent: "#3A7D44", text: "#1A2F1A" },
      { id: "ocean",      label: "Biển",        bg: "#EBF2F8", header: "#0D2233", accent: "#1B6CA8", text: "#0D2233" },
    ],
  },
  {
    label: "Pastel Ấm",
    themes: [
      { id: "rose",       label: "Hồng",        bg: "#FDF0F3", header: "#6B2035", accent: "#C2364F", text: "#3D1520" },
      { id: "sakura",     label: "Sakura",      bg: "#FDF3F5", header: "#6B2040", accent: "#C44870", text: "#3A1020" },
      { id: "peach",      label: "Đào",         bg: "#FEF0E8", header: "#7A3010", accent: "#D4622A", text: "#3D1A00" },
      { id: "honey",      label: "Mật ong",     bg: "#FEF6E0", header: "#5A3A00", accent: "#B87A00", text: "#3A2800" },
      { id: "butter",     label: "Bơ",          bg: "#FDF8E3", header: "#5A3A00", accent: "#C47C00", text: "#3A2A00" },
      { id: "wheat",      label: "Lúa mì",      bg: "#F8F2E8", header: "#5A4228", accent: "#8A6A3A", text: "#3A2C18" },
      { id: "mauve",      label: "Hoa cà",      bg: "#F6EEF6", header: "#5A2A56", accent: "#A05A9C", text: "#3A1C38" },
    ],
  },
  {
    label: "Pastel Lạnh",
    themes: [
      { id: "lavender",   label: "Lavender",    bg: "#F3EFFE", header: "#3A2060", accent: "#7B4FC9", text: "#2A1A4A" },
      { id: "violet",     label: "Tím",         bg: "#F2EFFE", header: "#40188A", accent: "#7A3AC4", text: "#200A40" },
      { id: "periwinkle", label: "Periwinkle",  bg: "#EEEFFE", header: "#2A2A6A", accent: "#5462CC", text: "#1A1A4A" },
      { id: "sky",        label: "Bầu trời",    bg: "#EDF6FE", header: "#0A3860", accent: "#2A7CC4", text: "#0A2840" },
      { id: "seafoam",    label: "Bọt biển",    bg: "#EAFAF6", header: "#0A4838", accent: "#1E9A7A", text: "#0A2E28" },
      { id: "slate",      label: "Đá xanh",     bg: "#EEF3F8", header: "#1A3A50", accent: "#3A6A8A", text: "#0A2030" },
      { id: "mint",       label: "Mint",        bg: "#EDFAF6", header: "#0D4535", accent: "#1A8C6A", text: "#0D3028" },
    ],
  },
];

const ALL_THEMES = GROUPS.flatMap((g) => g.themes);

// ── Sub-components ─────────────────────────────────────────────────────────────

function ThemeCard({
  t,
  active,
  onClick,
}: {
  t: ThemeMeta;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={t.label}
      className="flex flex-col overflow-hidden transition-all focus:outline-none"
      style={{
        borderRadius: 10,
        border: `2px solid ${active ? t.accent : "rgba(0,0,0,0.09)"}`,
        outline: active ? `3px solid ${t.accent}` : "none",
        outlineOffset: 2,
        cursor: "pointer",
        background: "none",
        padding: 0,
        position: "relative",
      }}
    >
      {/* Header strip */}
      <div style={{ height: 28, background: t.header, width: "100%" }} />

      {/* Body preview */}
      <div style={{ flex: 1, background: t.bg, padding: "5px 6px 4px", display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ height: 4, borderRadius: 99, background: t.text, opacity: 0.2, width: "75%" }} />
        <div style={{ height: 4, borderRadius: 99, background: t.accent, opacity: 0.55, width: "50%" }} />
      </div>

      {/* Label */}
      <div
        style={{
          background: t.bg,
          color: t.text,
          fontSize: 10,
          fontWeight: 600,
          textAlign: "center",
          padding: "3px 4px 4px",
          borderTop: `1px solid ${active ? t.accent : "rgba(0,0,0,0.07)"}`,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {active ? "✓ " : ""}{t.label}
      </div>
    </button>
  );
}

// ── Main modal component ───────────────────────────────────────────────────────

export function ThemePickerModal() {
  const { theme, setTheme } = useJournalTheme();
  const [open, setOpen] = useState(false);

  const currentMeta = ALL_THEMES.find((t) => t.id === theme);

  return (
    <>
      {/* ── Trigger row in settings ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Giao diện Journal
        </h2>

        {/* Current theme preview + open button */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          {/* Mini preview */}
          {currentMeta && (
            <div
              className="flex-shrink-0 overflow-hidden"
              style={{ width: 40, height: 32, borderRadius: 6, border: `1px solid ${currentMeta.accent}` }}
            >
              <div style={{ height: 12, background: currentMeta.header }} />
              <div style={{ height: 20, background: currentMeta.bg }} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {currentMeta?.label ?? theme}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {GROUPS.find((g) => g.themes.some((t) => t.id === theme))?.label ?? ""}
            </div>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex-shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "var(--accent-primary)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Đổi
          </button>
        </div>
      </div>

      {/* ── Modal overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full sm:max-w-lg flex flex-col"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "16px 16px 0 0",
              maxHeight: "85dvh",
              overflow: "hidden",
            }}
            // On desktop, round all corners
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="text-base font-semibold">Chọn giao diện</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-lg leading-none"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {GROUPS.map((group) => (
                <div key={group.label}>
                  <p
                    className="text-[11px] uppercase tracking-widest font-semibold mb-2.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {group.label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.themes.map((t) => (
                      <ThemeCard
                        key={t.id}
                        t={t}
                        active={theme === t.id}
                        onClick={() => setTheme(t.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom spacer for mobile */}
              <div className="h-2" />
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--accent-primary)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
