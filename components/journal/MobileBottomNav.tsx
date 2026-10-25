"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavBadges } from "@/hooks/firebase/useNavBadges";
import { CHAPTERS, activeChapter } from "@/lib/journal/chapters";

/**
 * Bottom nav mobile = đúng 5 chương của sổ.
 *
 * Trước đây là 4 tab + modal "Thêm" chứa 4 mục, và 4 trang
 * (progress / achievements / error-log / booking) không có đường vào.
 * Nay mỗi chương một tab, trang con đổi bằng dải tab trong ChapterTabs.
 */
export function MobileBottomNav({ studentCode }: { studentCode?: string | null }) {
  const pathname = usePathname();
  const { taskCount, vocabDueCount, vocabRemind, feeDue } = useNavBadges(studentCode);
  const current = activeChapter(pathname);

  /** Badge của chương = tổng số việc cần làm của các trang bên trong. */
  function badgeOf(chapterId: string): number | null {
    if (chapterId === "plan") return taskCount > 0 ? taskCount : null;
    if (chapterId === "notebook") return vocabDueCount > 0 ? vocabDueCount : null;
    return null;
  }

  function dotOf(chapterId: string): boolean {
    if (chapterId === "notebook") return vocabDueCount === 0 && vocabRemind;
    if (chapterId === "admin") return feeDue;
    return false;
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 border-t z-40 flex"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        boxShadow: "0 -2px 12px rgba(44,30,15,.07)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Điều hướng sổ học tập"
    >
      {CHAPTERS.map((ch) => {
        const active = current?.id === ch.id;
        const badge = badgeOf(ch.id);
        const dot = dotOf(ch.id);
        return (
          <Link
            key={ch.id}
            href={ch.pages[0].href}
            className="flex-1 relative flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors focus-visible:outline-none"
            style={{
              color: active ? "var(--orange)" : "var(--text-secondary)",
              textDecoration: "none",
            }}
            aria-current={active ? "page" : undefined}
          >
            <span style={{ position: "relative", display: "inline-flex" }}>
              <ch.Icon size={21} />
              {badge !== null && (
                <span
                  style={{
                    position: "absolute", top: -4, right: -8,
                    background: "var(--orange, #C4622D)", color: "#fff",
                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                    minWidth: 14, height: 14, borderRadius: 2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {dot && badge === null && (
                <span
                  style={{
                    position: "absolute", top: -2, right: -4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#E53E3E",
                  }}
                />
              )}
            </span>
            <span
              className="hand"
              style={{ fontSize: "0.86rem", fontWeight: active ? 700 : 500, lineHeight: 1.1 }}
            >
              {ch.labelVi}
            </span>
            {active && (
              <span
                className="absolute bottom-0 w-8 h-0.5"
                style={{ background: "var(--orange)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
