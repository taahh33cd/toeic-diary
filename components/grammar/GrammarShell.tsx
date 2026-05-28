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
} from "lucide-react";

const TOPBAR_H = 64;
const BG = "#0ea5e9";

const NAV_INTERNAL = [
  { href: "/grammar",          label: "Tổng quan", icon: LayoutGrid, exact: true },
  { href: "/grammar/progress", label: "Tiến độ",   icon: BarChart2 },
  { href: "/grammar/review",   label: "Câu sai",   icon: BookX },
];

const NAV_EXTERNAL = [
  { href: "/journal/vocab", label: "Từ vựng",  icon: BookOpen },
  { href: "/journal",       label: "Nhật ký",  icon: NotebookPen },
  { href: "/",              label: "Dictation", icon: Headphones },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

interface GrammarShellProps {
  children: React.ReactNode;
  displayName?: string | null;
}

export function GrammarShell({ children }: GrammarShellProps) {
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
            paddingInline: "1.5rem",
            gap: "2rem",
          }}
        >
          {/* Brand */}
          <Link
            href="/grammar"
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#ffffff",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Ngữ pháp TOEIC
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex"
            style={{ flex: 1, alignItems: "stretch", gap: 0 }}
          >
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
                    color: on ? "#ffffff" : "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    borderBottom: on ? "2px solid #ffffff" : "2px solid transparent",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!on) (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (!on) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)";
                  }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.25)", margin: "auto 0.65rem" }} />

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
                  color: "rgba(255,255,255,0.6)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  borderBottom: "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "transparent";
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#ffffff",
              padding: "6px",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
              borderTop: "1px solid rgba(255,255,255,0.15)",
              padding: "0.5rem 1rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
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
                    color: on ? "#ffffff" : "rgba(255,255,255,0.75)",
                    background: on ? "rgba(255,255,255,0.15)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "0.3rem 0" }} />
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
                  color: "rgba(255,255,255,0.6)",
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
