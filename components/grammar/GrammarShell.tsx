"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutGrid,
  BarChart2,
  BookX,
  BookOpen,
  NotebookPen,
  Headphones,
  Puzzle,
  Home,
} from "lucide-react";
import { UserAvatarMenu } from "@/components/layout/UserAvatarMenu";

const TOPBAR_H = 64;
const BG = "#1A4D35";           /* dark tropical green */
const TEXT_ACTIVE   = "#FFD66B"; /* gold — retro contrast */
const TEXT_INACTIVE = "rgba(255,214,107,0.65)";
const TEXT_EXTERNAL = "rgba(255,214,107,0.45)";

const NAV_INTERNAL = [
  { href: "/grammar",          label: "Tổng quan", icon: LayoutGrid, exact: true },
  { href: "/grammar/progress", label: "Tiến độ",   icon: BarChart2 },
  { href: "/grammar/review",   label: "Câu sai",   icon: BookX },
  { href: "/journal",          label: "Nhật ký",   icon: NotebookPen },
];

const NAV_EXTERNAL = [
  { href: "/dictation",        label: "Dictation", icon: Headphones },
  { href: "/reading-practice", label: "Reading",   icon: BookOpen },
  { href: "/subskills",        label: "Subskills", icon: Puzzle },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

interface GrammarShellProps {
  children: React.ReactNode;
  displayName?: string | null;
  userEmail?: string | null;
  userDisplayName?: string | null;
}

export function GrammarShell({ children, displayName, userEmail, userDisplayName }: GrammarShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="theme-grammar" style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Topbar — matches main site Header style */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: BG }}>
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            height: TOPBAR_H,
            display: "flex",
            alignItems: "center",
            paddingInline: "clamp(1rem, 4vw, 1.5rem)",
            gap: "1.5rem",
          }}
        >
          {/* Brand */}
          <Link
            href="/grammar"
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: TEXT_ACTIVE,
              textDecoration: "none",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {displayName ? `${displayName}'s TOEIC Grammar Diary` : "TOEIC Grammar Diary"}
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex"
            style={{ flex: 1, alignItems: "stretch", gap: 0 }}
          >
            {/* Home icon-only */}
            <Link
              href="/home"
              title="Trang chủ"
              aria-label="Trang chủ"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 0.85rem",
                paddingBottom: "1px",
                color: TEXT_INACTIVE,
                textDecoration: "none",
                borderBottom: "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = TEXT_ACTIVE;
                (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = TEXT_ACTIVE;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = TEXT_INACTIVE;
                (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = "transparent";
              }}
            >
              <Home size={15} style={{ flexShrink: 0 }} />
            </Link>
            <div style={{ width: 1, height: 20, background: "rgba(255,239,179,0.2)", margin: "auto 0.25rem" }} />
            {NAV_INTERNAL.map(({ href, label, icon: Icon, exact }) => {
              const on = isActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0 0.85rem",
                    paddingBottom: "1px",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: on ? TEXT_ACTIVE : TEXT_INACTIVE,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    borderBottom: on ? `2px solid ${TEXT_ACTIVE}` : "2px solid transparent",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!on) (e.currentTarget as HTMLAnchorElement).style.color = TEXT_ACTIVE;
                  }}
                  onMouseLeave={(e) => {
                    if (!on) (e.currentTarget as HTMLAnchorElement).style.color = TEXT_INACTIVE;
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: "rgba(255,239,179,0.2)", margin: "auto 0.65rem" }} />

            {NAV_EXTERNAL.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0 0.85rem",
                  paddingBottom: "1px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: TEXT_EXTERNAL,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  borderBottom: "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = TEXT_ACTIVE;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = TEXT_ACTIVE;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = TEXT_EXTERNAL;
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent";
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side: avatar menu (all screens) + hamburger (mobile only) */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {userEmail && (
              <UserAvatarMenu userEmail={userEmail} userDisplayName={userDisplayName} />
            )}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: TEXT_ACTIVE,
                padding: "6px",
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.25)" }}
            onClick={() => setMenuOpen(false)}
          />
          <nav
            style={{
              position: "fixed",
              top: TOPBAR_H,
              left: 0,
              right: 0,
              zIndex: 45,
              background: BG,
              borderTop: "1px solid rgba(255,239,179,0.15)",
              padding: "0.5rem 1rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {/* Home */}
            <Link
              href="/home"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: TEXT_INACTIVE,
                background: "transparent",
                textDecoration: "none",
              }}
            >
              <Home size={15} />
              Trang chủ
            </Link>
            {NAV_INTERNAL.map(({ href, label, icon: Icon, exact }) => {
              const on = isActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    fontWeight: on ? 600 : 500,
                    color: on ? TEXT_ACTIVE : TEXT_INACTIVE,
                    background: on ? "rgba(255,239,179,0.12)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <div style={{ height: 1, background: "rgba(255,239,179,0.15)", margin: "0.3rem 0" }} />
            {NAV_EXTERNAL.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  color: TEXT_EXTERNAL,
                  textDecoration: "none",
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </>
      )}

      {/* Content */}
      <main style={{ minHeight: `calc(100vh - ${TOPBAR_H}px)` }}>
        {children}
      </main>
    </div>
  );
}
