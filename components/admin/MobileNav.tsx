"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAll } from "@/hooks/firebase/useFirebaseAuthBridge";
import { useRouter } from "next/navigation";

const FOCUSABLE_SELECTORS =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

const NAV = [
  { href: "/admin",            emoji: "📊", label: "Dashboard",  exact: true },
  { href: "/admin/students",   emoji: "👥", label: "Học viên" },
  { href: "/admin/homework",   emoji: "📝", label: "Bài tập" },
  { href: "/admin/progress",   emoji: "📈", label: "Tiến độ" },
  { href: "/admin/classes",    emoji: "🏫", label: "Lớp học" },
  { href: "/admin/scores",     emoji: "🎯", label: "Điểm số" },
  { href: "/admin/bookings",   emoji: "📅", label: "Lịch hẹn" },
  { href: "/admin/slots",      emoji: "⏰", label: "Khung giờ" },
  { href: "/admin/attendance", emoji: "✅", label: "Điểm danh" },
];

/**
 * Mobile-only: sticky top bar with hamburger + slide-out drawer overlay.
 * Rendered inside admin layout for md:hidden.
 */
export function MobileNav({ role = "teacher" }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Focus management + Escape key + Tab trap
  useEffect(() => {
    if (!open) return;

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOutAll();
    router.push("/auth/login");
  }

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{
          background: "var(--sidebar-bg, #1E2235)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <span className="text-white font-semibold text-sm">
          ⚙️ {role === "admin" ? "Admin" : "Teacher"} Panel
        </span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Mở menu điều hướng"
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          aria-haspopup="dialog"
        >
          <span className="text-white text-xl leading-none" aria-hidden="true">☰</span>
        </button>
      </header>

      {/* ── Backdrop ────────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer ──────────────────────────────────────────── */}
      <div
        id="admin-mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${role === "admin" ? "Admin" : "Teacher"} navigation menu`}
        className="md:hidden fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 280,
          background: "var(--sidebar-bg, #1E2235)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
          <span className="text-white font-semibold text-sm">
            ⚙️ {role === "admin" ? "Admin" : "Teacher"} Panel
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Đóng menu"
          >
            <span className="text-white text-lg leading-none" aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5" aria-label="Admin navigation">
          {NAV.filter((item) => !("adminOnly" in item) || role === "admin").map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/admin";
            const isDash = item.exact && pathname === "/admin";

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={
                  active || isDash
                    ? {
                        background: "var(--sidebar-active-bg, rgba(176,125,26,0.25))",
                        color: "#FFFFFF",
                      }
                    : { color: "var(--sidebar-text, #A8B0CC)" }
                }
                aria-current={active ? "page" : undefined}
              >
                <span className="text-base w-5 text-center" aria-hidden="true">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{ color: "var(--sidebar-text, #A8B0CC)" }}
          >
            <span className="text-base w-5 text-center" aria-hidden="true">🎧</span>
            Dictation
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-red-500/10 hover:text-red-400 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{ color: "var(--sidebar-text, #A8B0CC)" }}
          >
            <span className="text-base w-5 text-center" aria-hidden="true">🚪</span>
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
