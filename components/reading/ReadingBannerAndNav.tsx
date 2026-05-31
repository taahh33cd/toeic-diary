"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LEFT_TABS = [
  { href: "/reading-practice",          label: "Tổng quan", exact: true  },
  { href: "/reading-practice/progress", label: "Tiến độ",   exact: false },
  { href: "/journal",                   label: "Nhật ký",   exact: false },
];

const RIGHT_TABS = [
  { href: "/",        label: "Dictation" },
  { href: "/grammar", label: "Ngữ pháp"  },
];

export function ReadingBannerAndNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  // Hide on the actual practice page: /reading-practice/[type]/[id]
  const afterRoot = pathname.replace(/^\/reading-practice/, "");
  const segments  = afterRoot.split("/").filter(Boolean);
  if (segments.length >= 2) return null;

  return (
    <header
      style={{
        background: "#6B4C2A",
        color: "#FFFDF6",
        flexShrink: 0,
        boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Section title */}
        <Link
          href="/reading-practice"
          style={{
            fontFamily: "var(--font-reading-display)",
            fontWeight: 700,
            fontSize: "0.92rem",
            color: "#FFFDF6",
            textDecoration: "none",
            flexShrink: 0,
            letterSpacing: "0.01em",
          }}
        >
          {displayName}&apos;s TOEIC Reading Diary
        </Link>

        {/* Nav tabs */}
        <nav style={{ display: "flex", alignItems: "center", flex: 1 }}>
          {LEFT_TABS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0 14px",
                  height: 56,
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "0.87rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#FFFDF6" : "rgba(255,253,246,0.60)",
                  textDecoration: "none",
                  borderBottom: `2px solid ${active ? "#FAF6E9" : "transparent"}`,
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
              margin: "0 6px",
            }}
          />

          {RIGHT_TABS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "0 14px",
                height: 56,
                display: "inline-flex",
                alignItems: "center",
                fontSize: "0.87rem",
                fontWeight: 400,
                color: "rgba(255,253,246,0.50)",
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
    </header>
  );
}
