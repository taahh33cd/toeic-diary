"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = {
  questionWord: string;
  current: "easy" | "medium";
  mediumUnlocked: boolean;
  easyTopScore: number;
};

export default function DifficultyTabs({ questionWord, current, mediumUnlocked, easyTopScore }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function goTo(d: "easy" | "medium") {
    if (d === "easy") {
      router.push(pathname);
    } else if (mediumUnlocked) {
      router.push(`${pathname}?d=medium`);
    }
  }

  const tabBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 18px",
    borderRadius: 20,
    border: "1.5px solid transparent",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s, border-color 0.15s",
    letterSpacing: "0.03em",
  };

  const activeTab: React.CSSProperties = {
    ...tabBase,
    background: "var(--accent, #4f8ef7)",
    color: "#fff",
    borderColor: "var(--accent, #4f8ef7)",
  };

  const inactiveTab: React.CSSProperties = {
    ...tabBase,
    background: "var(--bg-secondary, #f4f6fb)",
    color: "var(--text-secondary, #555)",
    borderColor: "var(--border, #dde3ef)",
  };

  const lockedTab: React.CSSProperties = {
    ...tabBase,
    background: "var(--bg-secondary, #f4f6fb)",
    color: "var(--text-muted, #aaa)",
    borderColor: "var(--border, #dde3ef)",
    cursor: "not-allowed",
    opacity: 0.65,
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {/* Easy tab */}
        <button
          onClick={() => goTo("easy")}
          style={current === "easy" ? activeTab : inactiveTab}
        >
          🟢 Easy
        </button>

        {/* Medium tab */}
        {mediumUnlocked ? (
          <button
            onClick={() => goTo("medium")}
            style={current === "medium" ? activeTab : inactiveTab}
          >
            🟡 Medium
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={lockedTab} disabled title="Hoàn thành Easy ≥80% để mở khoá">
              🔒 Medium
            </button>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #aaa)" }}>
              Cần điểm Easy ≥ 80% (hiện tại: {easyTopScore}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
