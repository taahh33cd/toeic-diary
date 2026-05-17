"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/journal/LanguageToggle";
import { useLocale } from "@/hooks/useLocale";

const TABS = [
  { href: "/journal",              iconEn: "🏠", labelEn: "Home",       labelVi: "Tổng quan",   exact: true },
  { href: "/journal/scores",       iconEn: "🎯", labelEn: "Score",      labelVi: "Điểm số" },
  { href: "/journal/error-log",    iconEn: "📓", labelEn: "Journal",    labelVi: "Nhật ký lỗi" },
  { href: "/journal/vocab",        iconEn: "📖", labelEn: "Vocabulary", labelVi: "Từ vựng" },
  { href: "/journal/missions",     iconEn: "✅", labelEn: "Tasks",      labelVi: "Nhiệm vụ" },
  { href: "/journal/booking",      iconEn: "📅", labelEn: "Schedule",   labelVi: "Lịch học" },
  { href: "/journal/settings",     iconEn: "⚙️", labelEn: "Settings",   labelVi: "Cài đặt" },
];

export function JournalTabBar() {
  const pathname = usePathname();
  const { locale } = useLocale();

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
          const label = locale === "en" ? tab.labelEn : tab.labelVi;
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
              <span aria-hidden="true">{tab.iconEn}</span>
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language toggle */}
        <LanguageToggle />
      </div>
    </nav>
  );
}
