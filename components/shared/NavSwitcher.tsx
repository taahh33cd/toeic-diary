"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  exact?: boolean;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home",             label: "Home",      emoji: "🏠", exact: true },
  { href: "/",                 label: "Dictation", emoji: "🎧", exact: true },
  { href: "/grammar",          label: "Grammar",   emoji: "🎓" },
  { href: "/reading-practice", label: "Reading",   emoji: "📖" },
  { href: "/admin",            label: "Quản lý",   emoji: "⚙️", roles: ["teacher", "admin"] },
];

interface NavSwitcherProps {
  role?: string;
  /** Orientation: "horizontal" (default) or "vertical" for sidebar use */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function NavSwitcher({
  role = "student",
  orientation = "horizontal",
  className = "",
}: NavSwitcherProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  if (orientation === "vertical") {
    return (
      <nav className={`flex flex-col gap-1 ${className}`} aria-label="Main navigation">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--sidebar-active-bg,rgba(196,98,45,0.15))] text-[var(--accent-primary)]"
                  : "text-[var(--sidebar-text,var(--text-secondary))] hover:bg-[var(--sidebar-active-bg,rgba(0,0,0,0.05))] hover:text-[var(--text-primary)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base leading-none" aria-hidden="true">{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      className={`flex items-center gap-1 ${className}`}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-2 py-1.5 md:px-3 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--orange-faint,rgba(196,98,45,0.1))] text-[var(--accent-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span aria-hidden="true">{item.emoji}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
