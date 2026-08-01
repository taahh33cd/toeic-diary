import Link from "next/link";
import { FAMILY, EXAM, type Family } from "@/lib/skills/exam-theme";

export type NavButton = {
  label: string;
  icon?: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "ghost" | "primary";
  disabled?: boolean;
};

/** Chiều cao Header của app (class h-16) — dùng để khoá khung thi vừa đúng viewport */
const HEADER_H = 64;

export function ExamShell({
  family,
  testName,
  questionLabel,
  timer,
  exitHref,
  children,
  nav,
  navLeft,
  fullBleed,
}: {
  family: Family;
  testName: string;
  questionLabel?: string;
  timer?: string;
  exitHref: string;
  children: React.ReactNode;
  nav?: NavButton[];
  /** Nội dung phụ đặt bên trái thanh nav dưới (ví dụ: chấm điều hướng câu hỏi) */
  navLeft?: React.ReactNode;
  /** Khung tràn viền, cao bằng viewport; phần body tự lo scroll bên trong */
  fullBleed?: boolean;
}) {
  const fam = FAMILY[family];

  return (
    <div
      style={
        fullBleed
          ? {
              height: `calc(100dvh - ${HEADER_H}px)`,
              display: "flex",
              flexDirection: "column",
              fontFamily: EXAM.sans,
            }
          : {
              maxWidth: 860,
              margin: "0 auto",
              padding: "clamp(1rem, 3vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)",
              fontFamily: EXAM.sans,
            }
      }
    >
      <div
        style={{
          border: fullBleed ? "none" : `1px solid ${EXAM.border}`,
          borderRadius: fullBleed ? 0 : 12,
          overflow: "hidden",
          background: EXAM.bg,
          color: EXAM.ink,
          boxShadow: fullBleed ? "none" : "0 18px 40px -24px rgba(20,40,90,.4)",
          ...(fullBleed ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : null),
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 16px",
            color: "#fff",
            background: `linear-gradient(180deg, ${fam.primary}, ${fam.dark})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: "1.05rem", minWidth: 0 }}>
            <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>✳</span>
            <span>TOEIC</span>
            <span style={{ fontWeight: 600, opacity: 0.85, fontSize: "0.82rem", borderLeft: "1px solid rgba(255,255,255,.35)", paddingLeft: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {testName}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.9rem", flexShrink: 0 }}>
            {questionLabel && <span style={{ opacity: 0.9, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{questionLabel}</span>}
            {timer && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 7, padding: "4px 10px", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                ⏱ {timer}
              </span>
            )}
          </div>
        </div>

        {/* Body (white-locked) */}
        <div
          style={
            fullBleed
              ? { flex: 1, minHeight: 0, overflow: "hidden", background: EXAM.bg }
              : { padding: "18px 20px 12px", background: EXAM.bg }
          }
        >
          {children}
        </div>

        {/* Bottom nav */}
        {((nav && nav.length > 0) || navLeft) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: EXAM.panelAlt, borderTop: `1px solid ${EXAM.border}`, flexWrap: "wrap", flexShrink: 0 }}>
            {fullBleed && (
              <Link href={exitHref} style={{ fontSize: "0.82rem", color: EXAM.muted, textDecoration: "none", fontFamily: EXAM.sans, whiteSpace: "nowrap" }}>
                ← Thoát
              </Link>
            )}
            {navLeft}
            {nav?.map((b, i) => {
              const isPrimary = b.variant === "primary";
              const isGhost = b.variant === "ghost";
              const style: React.CSSProperties = {
                fontFamily: EXAM.sans,
                fontSize: "0.86rem",
                fontWeight: 700,
                borderRadius: 7,
                padding: isPrimary ? "9px 24px" : "9px 15px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: b.disabled ? "not-allowed" : "pointer",
                opacity: b.disabled ? 0.5 : 1,
                marginLeft: isPrimary ? "auto" : undefined,
                border: isGhost ? "1px solid transparent" : `1px solid ${isPrimary ? fam.primary : "#b9c2cf"}`,
                background: isPrimary ? fam.primary : isGhost ? "transparent" : "#fff",
                color: isPrimary ? "#fff" : isGhost ? "#5a6475" : "#3a4457",
                textDecoration: "none",
              };
              const content = <>{b.icon ? <span>{b.icon}</span> : null}{b.label}</>;
              if (b.href) return <Link key={i} href={b.href} style={style}>{content}</Link>;
              return (
                <button key={i} onClick={b.onClick} disabled={b.disabled} style={style} type="button">
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Exit link under the exam card */}
      {!fullBleed && (
        <div style={{ textAlign: "center", marginTop: "0.9rem" }}>
          <Link href={exitHref} style={{ fontSize: "0.86rem", color: EXAM.muted, textDecoration: "none", fontFamily: EXAM.sans }}>
            ← Thoát bài thi
          </Link>
        </div>
      )}
    </div>
  );
}

/** Heading kiểu ETS: xanh gạch chân */
export function ExamDirHeading({ family, children }: { family: Family; children: React.ReactNode }) {
  const fam = FAMILY[family];
  return (
    <p style={{ color: fam.primary, fontWeight: 800, fontSize: "1.1rem", borderBottom: `2px solid ${fam.soft === "#eaf5ef" ? "#cfe4d7" : "#d5deec"}`, paddingBottom: 6, margin: "0 0 14px" }}>
      {children}
    </p>
  );
}
