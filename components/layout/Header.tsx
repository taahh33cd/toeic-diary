"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Moon, Sun, LogOut, BarChart2, NotebookPen, Headphones } from "lucide-react";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Close menu on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        avatarRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  // User initial for avatar
  const initial = userDisplayName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? "U";
  const displayName = userDisplayName ?? userEmail?.split("@")[0] ?? "User";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <span>🎧</span>
          </div>
          <div>
            <div className={styles.logoTitle}>{displayName}&apos;s TOEIC Diary</div>
            <div className={styles.logoSub}>TOEIC ETS 2026</div>
          </div>
        </Link>

        {/* Nav links */}
        <nav className={styles.nav}>
          <Link href="/practice" className={styles.navLink}>
            <Headphones size={16} />
            <span>Luyện tập theo Part</span>
          </Link>
          <Link href="/journal/vocab" className={styles.navLink}>
            <BookOpen size={16} />
            <span>Từ vựng</span>
          </Link>
          <Link href="/progress" className={styles.navLink}>
            <BarChart2 size={16} />
            <span>Tiến độ</span>
          </Link>
          <Link href="/journal" className={styles.navLink}>
            <NotebookPen size={16} />
            <span>Nhật ký</span>
          </Link>
        </nav>

        {/* Right side actions */}
        <div className={styles.actions}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon text-[rgba(255,255,255,0.72)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]"
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
  );
}

// ── Inline styles object (avoids CSS Module file dependency) ──
const styles = {
  header: `
    sticky top-0 z-50 w-full
    border-b border-[#2A1F15]
    bg-[#3D2B1F]
  `,
  inner: `
    max-w-[1400px] mx-auto px-4 md:px-6
    h-14 flex items-center justify-between gap-4
  `,
  logo: `
    flex items-center gap-3 no-underline
    hover:opacity-80 transition-opacity
    flex-shrink-0
  `,
  logoIcon: `
    w-8 h-8 rounded-lg bg-[#FF7A3D]
    flex items-center justify-center text-base
  `,
  logoTitle: `
    font-display font-bold text-sm leading-tight text-white
  `,
  logoSub: `
    text-[10px] text-[rgba(255,255,255,0.5)] leading-tight
  `,
  nav: `
    hidden md:flex items-center gap-1
  `,
  navLink: `
    flex items-center gap-1.5 px-3 py-1.5
    text-sm text-[rgba(255,255,255,0.72)]
    rounded-[var(--radius-md)]
    hover:bg-[rgba(255,255,255,0.08)] hover:text-white
    transition-colors
  `,
  actions: `
    flex items-center gap-2
  `,
  avatar: `
    w-8 h-8 rounded-full
    bg-[#FF7A3D]
    text-white text-sm font-semibold
    flex items-center justify-center
    cursor-pointer border-2 border-transparent
    transition-all
  `,
  avatarActive: `
    border-[#FF7A3D] ring-2 ring-[#FF7A3D]/30
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
