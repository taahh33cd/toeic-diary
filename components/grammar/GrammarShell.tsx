"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const TOPBAR_H = 56;

const NAV_INTERNAL = [
  { href: "/grammar", label: "Tổng quan", exact: true },
  { href: "/grammar/progress", label: "Tiến độ" },
  { href: "/grammar/review", label: "Câu sai" },
];

const NAV_EXTERNAL = [
  { href: "/journal/vocab", label: "Từ vựng" },
  { href: "/journal", label: "Nhật ký" },
  { href: "/", label: "Dictation" },
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
      {/* Topbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: TOPBAR_H,
          background: "var(--grammar-topbar-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--grammar-topbar-border)",
          display: "flex",
          alignItems: "center",
          paddingInline: "1.5rem",
          gap: "1.5rem",
        }}
      >
        {/* Brand */}
        <Link
          href="/grammar"
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "var(--accent-primary)",
            textDecoration: "none",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Ngữ pháp
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex"
          style={{ flex: 1, alignItems: "center", gap: "2px" }}
        >
          {NAV_INTERNAL.map(({ href, label, exact }) => {
            const on = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0.38rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.82rem",
                  fontWeight: on ? 600 : 400,
                  color: on ? "var(--accent-primary)" : "var(--text-secondary)",
                  background: on ? "var(--accent-primary-bg)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.12s",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 16,
              background: "var(--border)",
              margin: "0 0.65rem",
              flexShrink: 0,
            }}
          />

          {NAV_EXTERNAL.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "0.38rem 0.85rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.12s",
                whiteSpace: "nowrap",
              }}
            >
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
            color: "var(--text-secondary)",
            padding: "6px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile dropdown */}
      {menuOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setMenuOpen(false)}
          />
          <nav
            style={{
              position: "fixed",
              top: TOPBAR_H,
              left: 0,
              right: 0,
              zIndex: 45,
              background: "rgba(250,249,250,0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--grammar-topbar-border)",
              padding: "0.5rem 1rem 0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {NAV_INTERNAL.map(({ href, label, exact }) => {
              const on = isActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: on ? 600 : 400,
                    color: on ? "var(--accent-primary)" : "var(--text-secondary)",
                    background: on ? "var(--accent-primary-bg)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  {label}
                </Link>
              );
            })}
            <div style={{ height: 1, background: "var(--border)", margin: "0.3rem 0" }} />
            {NAV_EXTERNAL.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "0.65rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                }}
              >
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
