"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/journal",          emoji: "🏠", label: "Trang chủ", exact: true },
  { href: "/journal/scores",   emoji: "🎯", label: "Điểm số" },
  { href: "/journal/vocab",    emoji: "📖", label: "Từ vựng" },
  { href: "/journal/missions", emoji: "✅", label: "Nhiệm vụ" },
  { href: "/journal/booking",  emoji: "📅", label: "Lịch học" },
];

/** Mobile-only bottom navigation bar (max 5 items, active state, 44px touch targets). */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 border-t z-40 flex safe-bottom"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "0 -2px 12px rgba(44,30,15,0.06)",
      }}
      aria-label="Mobile navigation"
    >
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 relative flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium min-h-[56px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)]"
            style={{
              color: active ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
            aria-current={active ? "page" : undefined}
          >
            <span
              className="text-xl leading-none"
              style={{ filter: active ? "none" : "grayscale(0.3)" }}
              aria-hidden="true"
            >
              {item.emoji}
            </span>
            <span
              className="transition-all"
              style={{
                fontWeight: active ? 600 : 400,
              }}
            >
              {item.label}
            </span>
            {active && (
              <span
                className="absolute bottom-0 w-8 h-0.5 rounded-full"
                style={{ background: "var(--accent-primary)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
