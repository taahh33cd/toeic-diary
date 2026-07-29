"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  IconHome, IconScore, IconTasks, IconVocab,
  IconSchedule, IconFee, IconSettings,
} from "@/components/journal/Icons";
import { useNavBadges } from "@/hooks/firebase/useNavBadges";

type NavItem = { href: string; Icon: (p: { size?: number }) => React.ReactElement; label: string; exact?: boolean };

const ITEMS: NavItem[] = [
  { href: "/journal",          Icon: IconHome,  label: "Trang chủ", exact: true },
  { href: "/journal/scores",   Icon: IconScore, label: "Điểm số" },
  { href: "/journal/missions", Icon: IconTasks, label: "Nhiệm vụ" },
  { href: "/journal/vocab",    Icon: IconVocab, label: "Từ vựng" },
];

const MODAL_ITEMS: NavItem[] = [
  { href: "/journal/schedule",     Icon: IconSchedule, label: "Lịch học" },
  { href: "/journal/fee",          Icon: IconFee,      label: "Học phí" },
  { href: "/journal/settings",     Icon: IconSettings, label: "Cài đặt" },
];

export function MobileBottomNav({ studentCode }: { studentCode?: string | null }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
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

  useEffect(() => { setModalOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const modalItemActive = MODAL_ITEMS.some((i) => pathname.startsWith(i.href));

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 border-t z-40 flex"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
          boxShadow: "0 -2px 12px rgba(44,30,15,.07)",
        }}
        aria-label="Mobile navigation"
      >
        {ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const badge = getBadge(item.href);
          const dot = getDot(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 relative flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors focus-visible:outline-none"
              style={{
                color: active ? "var(--orange)" : "var(--text-secondary)",
                textDecoration: "none",
              }}
              aria-current={active ? "page" : undefined}
            >
              <span style={{ position: "relative", display: "inline-flex" }}>
                <item.Icon size={22} />
                {badge !== null && (
                  <span style={{
                    position: "absolute", top: -4, right: -8,
                    background: "var(--orange, #C4622D)", color: "#fff",
                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                    minWidth: 14, height: 14, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                  }}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {dot && !badge && (
                  <span style={{
                    position: "absolute", top: -2, right: -4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#E53E3E",
                  }} />
                )}
              </span>
              <span style={{ fontSize: "10px", fontWeight: active ? 600 : 400 }}>
                {item.label}
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

        {/* "Thêm ···" button */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] focus-visible:outline-none"
          style={{
            color: modalItemActive ? "var(--orange)" : "var(--text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Xem thêm"
        >
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span
              style={{ fontSize: "1.1rem", lineHeight: 1, letterSpacing: ".05em" }}
              aria-hidden="true"
            >
              ···
            </span>
            {feeDue && (
              <span style={{
                position: "absolute", top: -4, right: -6,
                width: 8, height: 8, borderRadius: "50%",
                background: "#E53E3E",
              }} />
            )}
          </span>
          <span style={{ fontSize: "10px", fontWeight: modalItemActive ? 600 : 400 }}>
            Thêm
          </span>
        </button>
      </nav>

      {/* Modal */}
      {modalOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,.55)" }}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Thêm tùy chọn"
        >
          <div
            style={{
              background: "var(--bg-elevated)",
              width: "calc(100vw - 3rem)",
              maxWidth: 300,
              boxShadow: "var(--shadow-md)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: ".75rem 1rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: ".62rem",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Thêm
              </span>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Đóng"
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: ".85rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* 2×2 grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                background: "var(--border)",
              }}
            >
              {MODAL_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                const dot = getDot(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: ".4rem",
                      padding: "1.1rem .5rem",
                      background: active ? "var(--accent-faint)" : "var(--bg-elevated)",
                      textDecoration: "none",
                      color: active ? "var(--accent-primary)" : "var(--text-muted)",
                    }}
                  >
                    <span style={{ position: "relative", display: "inline-flex" }}>
                      <item.Icon size={26} />
                      {dot && (
                        <span style={{
                          position: "absolute", top: -2, right: -4,
                          width: 9, height: 9, borderRadius: "50%",
                          background: "#E53E3E",
                        }} />
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: ".72rem",
                        fontWeight: active ? 600 : 500,
                        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                        textAlign: "center",
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Dictation link */}
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <Link
                href="/dictation"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  padding: ".65rem 1rem",
                  fontSize: ".78rem",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                }}
              >
                <span aria-hidden="true">🎧</span>
                Chuyển về Dictation
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
