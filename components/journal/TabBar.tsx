"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/journal/LanguageToggle";
import { useLocale } from "@/hooks/useLocale";
import {
  IconHome, IconScore, IconJournal, IconVocab,
  IconTasks, IconSchedule, IconFee, IconSettings,
} from "@/components/journal/Icons";
import { useNavBadges } from "@/hooks/firebase/useNavBadges";

type TabItem = {
  href: string;
  Icon: (props: { size?: number }) => React.ReactElement;
  labelEn: string;
  labelVi: string;
  exact?: boolean;
};

const TABS: TabItem[] = [
  { href: "/journal",           Icon: IconHome,     labelEn: "Home",       labelVi: "Tổng quan",   exact: true },
  { href: "/journal/scores",    Icon: IconScore,    labelEn: "Score",      labelVi: "Điểm số" },
  { href: "/journal/submissions", Icon: IconJournal, labelEn: "Submissions", labelVi: "Bài nộp" },
  { href: "/journal/vocab",     Icon: IconVocab,    labelEn: "Vocabulary", labelVi: "Từ vựng" },
  { href: "/journal/missions",  Icon: IconTasks,    labelEn: "Tasks",      labelVi: "Nhiệm vụ" },
  { href: "/journal/schedule",  Icon: IconSchedule, labelEn: "Schedule",   labelVi: "Lịch học" },
  { href: "/journal/fee",       Icon: IconFee,      labelEn: "Fees",       labelVi: "Học phí" },
  { href: "/journal/settings",  Icon: IconSettings, labelEn: "Settings",   labelVi: "Cài đặt" },
];

export function JournalTabBar({ studentCode }: { studentCode?: string | null }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { taskCount, vocabDueCount, vocabRemind, feeDue } = useNavBadges(studentCode);

  function getBadge(href: string): number | null {
    if (href === "/journal/missions") return taskCount > 0 ? taskCount : null;
    if (href === "/journal/vocab") return vocabDueCount > 0 ? vocabDueCount : null;
    return null;
  }

  function getDot(href: string): boolean {
    if (href === "/journal/vocab") return vocabDueCount === 0 && vocabRemind;
    if (href === "/journal/fee") return feeDue;
    return false;
  }

  return (
    <nav
      className="hidden md:block"
      style={{
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 4px rgba(44,30,15,.05)",
        viewTransitionName: "journal-tabbar",
      }}
      aria-label="Journal navigation tabs"
    >
      <div className="flex items-center gap-1 max-w-[1400px] mx-auto px-6 py-2">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
          const label = locale === "en" ? tab.labelEn : tab.labelVi;
          const badge = getBadge(tab.href);
          const dot = getDot(tab.href);
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
              <span style={{ position: "relative", display: "inline-flex" }}>
                <tab.Icon size={16} />
                {badge !== null && (
                  <span style={{
                    position: "absolute", top: -5, right: -8,
                    background: "var(--orange, #C4622D)", color: "#fff",
                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                    minWidth: 13, height: 13, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 2px",
                  }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {dot && !badge && (
                  <span style={{
                    position: "absolute", top: -2, right: -3,
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#E53E3E",
                  }} />
                )}
              </span>
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
