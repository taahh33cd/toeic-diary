"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/journal",               label: "Trang chủ", emoji: "🏠", exact: true },
  { href: "/journal/scores",        label: "Điểm số",   emoji: "🎯" },
  { href: "/journal/vocab",         label: "Từ vựng",   emoji: "📖" },
  { href: "/journal/missions",      label: "Nhiệm vụ",  emoji: "✅" },
  { href: "/journal/booking",       label: "Lịch học",  emoji: "📅" },
  { href: "/journal/achievements",  label: "Thành tựu", emoji: "🏆" },
  { href: "/journal/settings",      label: "Cài đặt",   emoji: "⚙️" },
];

/** Desktop horizontal tab bar — hidden on mobile (mobile uses bottom nav). */
export function JournalTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:flex border-b"
      style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      aria-label="Journal navigation tabs"
    >
      <div className="max-w-5xl mx-auto w-full px-4 flex">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
              style={
                active
                  ? {
                      borderColor: "var(--accent-primary)",
                      color: "var(--accent-primary)",
                    }
                  : {
                      borderColor: "transparent",
                      color: "var(--text-secondary)",
                    }
              }
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{tab.emoji}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
