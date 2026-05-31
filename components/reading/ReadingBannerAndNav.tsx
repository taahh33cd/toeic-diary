"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LEFT_TABS = [
  { href: "/reading-practice",          label: "Tổng quan", exact: true },
  { href: "/reading-practice/progress", label: "Tiến độ",   exact: false },
  { href: "/journal",                   label: "Nhật ký",   exact: false },
];

const RIGHT_TABS = [
  { href: "/practice", label: "Dictation" },
  { href: "/grammar",  label: "Ngữ pháp" },
];

type Props = {
  displayName: string;
  streak: number;
  completedCount: number;
  totalPassages: number;
};

export function ReadingBannerAndNav({
  displayName,
  streak,
  completedCount,
  totalPassages,
}: Props) {
  const pathname = usePathname();

  // Hide on the actual practice page: /reading-practice/[type]/[id]
  const afterRoot = pathname.replace(/^\/reading-practice/, "");
  const segments  = afterRoot.split("/").filter(Boolean);
  if (segments.length >= 2) return null;

  const STATS = [
    { label: "Ngày streak",     value: streak,         icon: "🔥" },
    { label: "Bài hoàn thành",  value: completedCount, icon: "✓"  },
    { label: "Tổng bài",        value: totalPassages,  icon: null  },
  ];

  return (
    <div
      style={{
        background: "#6B4C2A",
        color: "#FFFDF6",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "20px 24px 0",
        }}
      >
        {/* Welcome row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Left: greeting */}
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: 0.62,
              }}
            >
              READING PRACTICE · TOEIC PART 7
            </p>
            <h2
              style={{
                fontFamily: "var(--font-reading-display)",
                fontSize: "clamp(1.25rem, 3vw, 1.65rem)",
                fontWeight: 700,
                margin: "0 0 4px",
                lineHeight: 1.25,
              }}
            >
              Xin chào, {displayName}!
            </h2>
            <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.7, lineHeight: 1.5 }}>
              Luyện đọc hiểu mỗi ngày — nền tảng vững chắc cho điểm TOEIC.
            </p>
          </div>

          {/* Right: stats */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {STATS.map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,253,246,0.11)",
                  border: "1px solid rgba(255,253,246,0.18)",
                  borderRadius: 8,
                  padding: "10px 16px",
                  textAlign: "center",
                  minWidth: 78,
                }}
              >
                {icon && (
                  <div style={{ fontSize: "0.95rem", marginBottom: 2, opacity: 0.85 }}>
                    {icon}
                  </div>
                )}
                <div style={{ fontSize: "1.35rem", fontWeight: 700, lineHeight: 1 }}>
                  {value.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.63rem", opacity: 0.68, marginTop: 4, lineHeight: 1.3 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav tabs */}
        <nav style={{ display: "flex", alignItems: "center" }}>
          {LEFT_TABS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.87rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#FFFDF6" : "rgba(255,253,246,0.58)",
                  textDecoration: "none",
                  borderBottom: `2px solid ${active ? "#FFFDF6" : "transparent"}`,
                  transition: "color 0.15s, border-color 0.15s",
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 18,
              background: "rgba(255,253,246,0.28)",
              margin: "0 8px",
            }}
          />

          {RIGHT_TABS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "10px 16px",
                fontSize: "0.87rem",
                fontWeight: 400,
                color: "rgba(255,253,246,0.52)",
                textDecoration: "none",
                borderBottom: "2px solid transparent",
                transition: "color 0.15s",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
