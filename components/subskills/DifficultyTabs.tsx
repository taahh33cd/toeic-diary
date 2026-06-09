"use client";

import { useRouter, usePathname } from "next/navigation";

type Props = {
  questionWord: string;
  current: "easy" | "medium" | "hard";
  mediumUnlocked: boolean;
  hardUnlocked: boolean;
  easyTopScore: number;
  mediumTopScore: number;
};

export default function DifficultyTabs({
  questionWord,
  current,
  mediumUnlocked,
  hardUnlocked,
  easyTopScore,
  mediumTopScore,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function goTo(d: "easy" | "medium" | "hard") {
    if (d === "easy") {
      router.push(pathname);
    } else if (d === "medium" && mediumUnlocked) {
      router.push(`${pathname}?d=medium`);
    } else if (d === "hard" && hardUnlocked) {
      router.push(`${pathname}?d=hard`);
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
              Cần Easy ≥ 80% (hiện: {easyTopScore}%)
            </span>
          </div>
        )}

        {/* Hard tab */}
        {hardUnlocked ? (
          <button
            onClick={() => goTo("hard")}
            style={current === "hard" ? activeTab : inactiveTab}
          >
            🔴 Hard
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={lockedTab} disabled title="Hoàn thành Medium ≥80% để mở khoá">
              🔒 Hard
            </button>
            {mediumUnlocked && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #aaa)" }}>
                Cần Medium ≥ 80% (hiện: {mediumTopScore}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
