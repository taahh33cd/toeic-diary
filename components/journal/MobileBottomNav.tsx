"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const ITEMS = [
  { href: "/journal",          emoji: "🏠", label: "Trang chủ", exact: true },
  { href: "/journal/scores",   emoji: "🎯", label: "Điểm số" },
  { href: "/journal/missions", emoji: "✅", label: "Nhiệm vụ" },
  { href: "/journal/vocab",    emoji: "📖", label: "Từ vựng" },
] as const;

const MODAL_ITEMS = [
  { href: "/journal/error-log",    emoji: "📒", label: "Nhật ký lỗi" },
  { href: "/journal/booking",      emoji: "📅", label: "Lịch học" },
  { href: "/journal/achievements", emoji: "🏆", label: "Thành tựu" },
  { href: "/journal/settings",     emoji: "⚙️", label: "Cài đặt" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

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
          const active = isActive(item.href, (item as { exact?: boolean }).exact);
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
              <span className="text-xl leading-none" aria-hidden="true">
                {item.emoji}
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
          <span
            style={{ fontSize: "1.1rem", lineHeight: 1, letterSpacing: ".05em" }}
            aria-hidden="true"
          >
            ···
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
          style={{ background: "rgba(44,30,15,.55)" }}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Thêm tùy chọn"
        >
          <div
            style={{
              background: "#FBF7F2",
              width: "calc(100vw - 3rem)",
              maxWidth: 300,
              boxShadow: "0 8px 32px rgba(44,30,15,.2)",
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
                borderBottom: "1px solid #EDE4D6",
              }}
            >
              <span
                style={{
                  fontSize: ".62rem",
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#9A8672",
                }}
              >
                Thêm
              </span>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Đóng"
                style={{
                  background: "none",
                  border: "1px solid #DDD0C0",
                  color: "#9A8672",
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
                background: "#DDD0C0",
              }}
            >
              {MODAL_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
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
                      background: active ? "rgba(196,98,45,.07)" : "#FBF7F2",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: "1.5rem", lineHeight: 1 }} aria-hidden="true">
                      {item.emoji}
                    </span>
                    <span
                      style={{
                        fontSize: ".72rem",
                        fontWeight: active ? 600 : 500,
                        color: active ? "#C4622D" : "#5C3D1E",
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
            <div style={{ borderTop: "1px solid #EDE4D6" }}>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  padding: ".65rem 1rem",
                  fontSize: ".78rem",
                  color: "#9A8672",
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
