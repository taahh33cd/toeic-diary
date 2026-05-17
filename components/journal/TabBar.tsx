"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/journal",              icon: "🏠", label: "Home",       exact: true },
  { href: "/journal/scores",       icon: "🎯", label: "Score" },
  { href: "/journal/error-log",    icon: "📓", label: "Journal" },
  { href: "/journal/vocab",        icon: "📖", label: "Vocabulary" },
  { href: "/journal/missions",     icon: "✅", label: "Tasks" },
  { href: "/journal/booking",      icon: "📅", label: "Schedule" },
  { href: "/journal/settings",     icon: "⚙️", label: "Settings" },
];

export function JournalTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:block"
      style={{
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(44,30,15,.05)",
      }}
      aria-label="Journal navigation tabs"
    >
      <div className="flex items-center gap-1 max-w-5xl mx-auto px-4 py-2">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap"
              style={{
                background: active ? "var(--bg-primary)" : "transparent",
                color: active ? "var(--orange, #C4622D)" : "var(--text-muted, #9A8672)",
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
              }}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
