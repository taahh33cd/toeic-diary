"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LanguageToggle } from "@/components/journal/LanguageToggle";
import { useLocale } from "@/hooks/useLocale";
import { useNavBadges } from "@/hooks/firebase/useNavBadges";
import { CHAPTERS, activeChapter, pageMatches, type Chapter } from "@/lib/journal/chapters";

/** Badge số của một trang (null = không có). */
function pageBadge(
  href: string,
  b: { taskCount: number; vocabDueCount: number }
): number | null {
  if (href === "/journal/missions") return b.taskCount > 0 ? b.taskCount : null;
  if (href === "/journal/vocab") return b.vocabDueCount > 0 ? b.vocabDueCount : null;
  return null;
}

/** Dấu đỏ nhắc nhẹ của một trang. */
function pageDot(
  href: string,
  b: { vocabDueCount: number; vocabRemind: boolean; feeDue: boolean }
): boolean {
  if (href === "/journal/vocab") return b.vocabDueCount === 0 && b.vocabRemind;
  if (href === "/journal/fee") return b.feeDue;
  return false;
}

function Badge({ count, dot }: { count: number | null; dot: boolean }) {
  if (count !== null) {
    return (
      <span
        className="inline-flex items-center justify-center font-bold"
        style={{
          background: "var(--accent-primary)",
          color: "#fff",
          fontSize: 9,
          lineHeight: 1,
          minWidth: 15,
          height: 15,
          padding: "0 3px",
          borderRadius: 2,
          fontFamily: "var(--font-sans)",
        }}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  }
  if (dot) {
    return (
      <span
        aria-hidden="true"
        style={{ width: 7, height: 7, borderRadius: "50%", background: "#E53E3E" }}
      />
    );
  }
  return null;
}

export function ChapterTabs({ studentCode }: { studentCode?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { locale } = useLocale();
  const badges = useNavBadges(studentCode);

  const current: Chapter | null = activeChapter(pathname);
  const label = (vi: string, en: string) => (locale === "en" ? en : vi);

  /** Badge của chương = tổng badge các trang trong chương. */
  function chapterBadge(ch: Chapter): number | null {
    const total = ch.pages.reduce((sum, p) => sum + (pageBadge(p.href, badges) ?? 0), 0);
    return total > 0 ? total : null;
  }

  function chapterDot(ch: Chapter): boolean {
    return ch.pages.some((p) => pageDot(p.href, badges));
  }

  const subPages = current && current.pages.length > 1 ? current.pages : null;

  return (
    <div
      style={{
        background: "var(--bg-primary)",
        viewTransitionName: "journal-tabbar",
      }}
    >
      {/* ── Hàng tab chương (desktop) ── */}
      <nav
        className="hidden md:block max-w-[1400px] mx-auto px-6 pt-2"
        aria-label="Chương của sổ học tập"
      >
        <div className="paper-tabs">
          {CHAPTERS.map((ch) => {
            const active = current?.id === ch.id;
            const count = chapterBadge(ch);
            const dot = chapterDot(ch);
            return (
              <Link
                key={ch.id}
                href={ch.pages[0].href}
                className="paper-tab"
                aria-current={active ? "page" : undefined}
              >
                <ch.Icon size={15} />
                <span>{label(ch.labelVi, ch.labelEn)}</span>
                <Badge count={count} dot={dot} />
              </Link>
            );
          })}

          <div className="flex-1" />
          <div className="pb-1.5 pl-2">
            <LanguageToggle />
          </div>
        </div>
      </nav>

      {/* ── Dải trang con trong chương (mọi kích thước) ── */}
      {subPages && (
        <nav
          aria-label={`Trang trong chương ${current?.labelVi ?? ""}`}
          style={{
            background: "var(--paper-sheet, var(--bg-elevated))",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
              {subPages.map((p) => {
                const active = pageMatches(p, pathname, tabParam);
                const count = pageBadge(p.href, badges);
                const dot = pageDot(p.href, badges);
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors"
                    style={{
                      color: active ? "var(--accent-primary)" : "var(--text-muted)",
                      fontWeight: active ? 600 : 500,
                      textDecoration: "none",
                      boxShadow: active ? "inset 0 -2px 0 var(--accent-primary)" : undefined,
                    }}
                  >
                    <p.Icon size={15} />
                    <span>{label(p.labelVi, p.labelEn)}</span>
                    <Badge count={count} dot={dot} />
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
