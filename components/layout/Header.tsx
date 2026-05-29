"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, Moon, Sun, LogOut, BarChart2, NotebookPen, Headphones, GraduationCap, Menu, X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  userEmail?: string | null;
  userDisplayName?: string | null;
}

export function Header({ userEmail, userDisplayName }: HeaderProps) {
  const { theme, toggleTheme } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile nav on route change
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  // Close menu on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (menuOpen) { setMenuOpen(false); avatarRef.current?.focus(); }
        if (mobileNavOpen) setMobileNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen, mobileNavOpen]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // User initial for avatar
  const initial = userDisplayName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? "U";
  const displayName = userDisplayName ?? userEmail?.split("@")[0] ?? "User";

  const NAV_LINKS = [
    { href: "/practice",      icon: <Headphones size={16} />,    label: "Luyện tập theo Part" },
    { href: "/journal/vocab", icon: <BookOpen size={16} />,      label: "Từ vựng" },
    { href: "/progress",      icon: <BarChart2 size={16} />,     label: "Tiến độ" },
    { href: "/grammar",       icon: <GraduationCap size={16} />, label: "Ngữ pháp" },
    { href: "/journal",       icon: <NotebookPen size={16} />,   label: "Nhật ký" },
  ];

  return (
    <>
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <span>🎧</span>
          </div>
          <div className="min-w-0">
            <div className={styles.logoTitle}>{displayName}&apos;s TOEIC Diary</div>
            <div className={styles.logoSub}>TOEIC ETS 2026</div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className={styles.nav}>
          {NAV_LINKS.map(({ href, icon, label }) => (
            <Link key={href} href={href} className={styles.navLink}>
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className={styles.actions}>
          {/* Mobile hamburger */}
          <button
            className="md:hidden btn btn-ghost btn-icon text-white hover:bg-white/10"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label={mobileNavOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon text-white hover:text-white hover:bg-white/10"
            aria-label={theme === "dark" ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User menu */}
          {userEmail && (
            <div ref={menuRef} className={styles.userMenu}>
              <button
                ref={avatarRef}
                onClick={() => setMenuOpen((v) => !v)}
                className={cn(styles.avatar, menuOpen && styles.avatarActive)}
                aria-label="Menu tài khoản"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {initial}
              </button>

              {menuOpen && (
                <div className={styles.dropdown} role="menu" aria-label="Tài khoản">
                  <div className={styles.dropdownHeader} role="presentation">
                    <div className={styles.dropdownName}>{displayName}</div>
                    <div className={styles.dropdownEmail}>{userEmail}</div>
                  </div>
                  <div className={styles.dropdownDivider} role="separator" />
                  <Link
                    href="/practice"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Headphones size={15} aria-hidden="true" />
                    Luyện tập theo Part
                  </Link>
                  <Link
                    href="/progress"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BarChart2 size={15} aria-hidden="true" />
                    Tiến độ học tập
                  </Link>
                  <Link
                    href="/journal/vocab"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <BookOpen size={15} aria-hidden="true" />
                    Từ vựng đã lưu
                  </Link>
                  <Link
                    href="/grammar"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <GraduationCap size={15} aria-hidden="true" />
                    Luyện ngữ pháp
                  </Link>
                  <Link
                    href="/journal"
                    className={styles.dropdownItem}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <NotebookPen size={15} aria-hidden="true" />
                    Nhật ký học tập
                  </Link>
                  <div className={styles.dropdownDivider} role="separator" />
                  <button
                    onClick={handleSignOut}
                    className={cn(styles.dropdownItem, styles.dropdownLogout)}
                    role="menuitem"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile nav overlay */}
    {mobileNavOpen && (
      <div
        className="md:hidden fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
    )}

    {/* Mobile nav drawer */}
    <nav
      className="md:hidden fixed left-0 right-0 z-50 transition-transform duration-200"
      style={{
        top: 64,
        background: "#0ea5e9",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        transform: mobileNavOpen ? "translateY(0)" : "translateY(calc(-100% - 64px))",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}
      aria-label="Mobile navigation"
      aria-hidden={!mobileNavOpen}
    >
      <div className="px-4 py-3 flex flex-col gap-1">
        {NAV_LINKS.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white transition-colors"
              style={{
                background: active ? "rgba(255,255,255,0.2)" : "transparent",
                textDecoration: "none",
              }}
            >
              {icon}
              {label}
            </Link>
          );
        })}

        {userEmail && (
          <>
            <div className="h-px bg-white/20 my-1" />
            <button
              onClick={() => { setMobileNavOpen(false); handleSignOut(); }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/80 w-full text-left"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </>
        )}
      </div>
    </nav>
    </>
  );
}

// ── Inline styles object (avoids CSS Module file dependency) ──
const styles = {
  header: `
    sticky top-0 z-50 w-full
    bg-[#0ea5e9]
  `,
  inner: `
    max-w-[1400px] mx-auto px-4 md:px-6
    h-16 flex items-center justify-between gap-4
  `,
  logo: `
    flex items-center gap-3 no-underline
    hover:opacity-90 transition-opacity
    flex-shrink-0
  `,
  logoIcon: `
    hidden
  `,
  logoTitle: `
    font-display font-bold text-base leading-tight text-white
  `,
  logoSub: `
    hidden
  `,
  nav: `
    hidden md:flex items-center gap-6
  `,
  navLink: `
    flex items-center gap-1.5 px-0 pb-1
    text-sm text-white font-medium
    border-b-2 border-transparent
    hover:border-white
    transition-colors
  `,
  actions: `
    flex items-center gap-2
  `,
  avatar: `
    w-8 h-8 rounded-full
    bg-white/20 border border-white/40
    text-white text-sm font-semibold
    flex items-center justify-center
    cursor-pointer
    transition-all
  `,
  avatarActive: `
    ring-2 ring-white/50
  `,
  userMenu: `
    relative
  `,
  dropdown: `
    absolute right-0 top-full mt-2 w-52
    bg-[var(--bg-elevated)] border border-[var(--border)]
    rounded-[var(--radius-lg)] shadow-lg
    animate-slide-down overflow-hidden z-50
  `,
  dropdownHeader: `
    px-4 py-3
  `,
  dropdownName: `
    text-sm font-semibold text-[var(--text-primary)]
  `,
  dropdownEmail: `
    text-xs text-[var(--text-muted)] mt-0.5 truncate
  `,
  dropdownDivider: `
    h-px bg-[var(--border)] mx-2
  `,
  dropdownItem: `
    flex items-center gap-2.5
    w-full px-4 py-2.5 text-sm
    text-[var(--text-secondary)]
    hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]
    transition-colors cursor-pointer text-left
  `,
  dropdownLogout: `
    text-[var(--accent-red)] hover:bg-red-50 dark:hover:bg-red-950/20
    hover:text-[var(--accent-red)]
  `,
} as const;
