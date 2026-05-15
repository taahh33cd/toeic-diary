"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/journal",              label: "🏠 Tổng quan",    exact: true },
  { href: "/journal/scores",       label: "🎯 Điểm số" },
  { href: "/journal/error-log",    label: "📒 Nhật ký lỗi" },
  { href: "/journal/vocab",        label: "📖 Từ vựng" },
  { href: "/journal/missions",     label: "✅ Nhiệm vụ" },
  { href: "/journal/booking",      label: "📅 Lịch học" },
  { href: "/journal/achievements", label: "🏆 Thành tựu" },
  { href: "/journal/settings",     label: "⚙️ Cài đặt" },
];

/** Desktop horizontal tab bar — matches STUDENT.html .tabs / .tab exactly */
export function JournalTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:block"
      style={{
        background: "var(--bg-elevated)",     /* --paper: #FBF7F2 */
        borderBottom: "2px solid var(--border)", /* #DDD0C0 */
        boxShadow: "0 1px 4px rgba(44,30,15,.06)",
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      } as React.CSSProperties}
      aria-label="Journal navigation tabs"
    >
      <div
        className="flex"
        style={{ maxWidth: "1060px", margin: "0 auto", padding: "0 1.8rem" }}
      >
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              style={{
                padding: ".85rem 1.2rem",
                fontSize: ".8rem",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--orange,#C4622D)" : "var(--text-muted,#9A8672)",
                borderBottom: active
                  ? "2px solid var(--orange,#C4622D)"
                  : "2px solid transparent",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                textDecoration: "none",
                transition: "all .15s",
                display: "block",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink,#2C1E0F)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted,#9A8672)";
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
