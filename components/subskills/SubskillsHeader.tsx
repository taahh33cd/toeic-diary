"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutGrid,
  BarChart2,
  NotebookPen,
  Headphones,
  GraduationCap,
  BookOpen,
  Home,
} from "lucide-react";

const TOPBAR_H    = 64;
const BG          = "#1E5F8E";
const TEXT_ACTIVE   = "#fff";
const TEXT_INACTIVE = "rgba(255,255,255,0.65)";
const TEXT_EXTERNAL = "rgba(255,255,255,0.42)";

const NAV_INTERNAL = [
  { href: "/subskills",          label: "Tổng quan", icon: LayoutGrid,  exact: true  },
  { href: "/subskills/progress", label: "Tiến độ",   icon: BarChart2,   exact: false },
  { href: "/journal",            label: "Nhật ký",   icon: NotebookPen, exact: false },
];

const NAV_EXTERNAL = [
  { href: "/dictation",         label: "Dictation", icon: Headphones    },
  { href: "/grammar",           label: "Ngữ pháp",  icon: GraduationCap },
  { href: "/reading-practice",  label: "Reading",   icon: BookOpen      },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href.startsWith("/subskills")) return pathname.startsWith(href);
  return pathname === href;
}

export function SubskillsHeader({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: BG,
        boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
      }}
    >
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
          href="/subskills"
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
          {displayName ? `${displayName}'s TOEIC Subskills` : "TOEIC Subskills"}
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
              height: TOPBAR_H,
              color: TEXT_INACTIVE,
              textDecoration: "none",
              borderBottom: "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.color = TEXT_ACTIVE;
              el.style.borderBottomColor = TEXT_ACTIVE;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.color = TEXT_INACTIVE;
              el.style.borderBottomColor = "transparent";
            }}
          >
            <Home size={15} style={{ flexShrink: 0 }} />
          </Link>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.22)", margin: "auto 0.25rem" }} />

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
                  height: TOPBAR_H,
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
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.22)", margin: "auto 0.65rem" }} />

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
                height: TOPBAR_H,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: TEXT_EXTERNAL,
                textDecoration: "none",
                whiteSpace: "nowrap",
                borderBottom: "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = TEXT_ACTIVE;
                el.style.borderBottomColor = TEXT_ACTIVE;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = TEXT_EXTERNAL;
                el.style.borderBottomColor = "transparent";
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
            color: TEXT_ACTIVE,
            padding: "6px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay + drawer */}
      {menuOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(0,0,0,0.25)",
            }}
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
            <Link
              href="/home"
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.65rem 0.85rem",
                borderRadius: 6,
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
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    fontWeight: on ? 600 : 500,
                    color: on ? TEXT_ACTIVE : TEXT_INACTIVE,
                    background: on ? "rgba(255,255,255,0.12)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <div style={{ height: 1, background: "rgba(255,255,255,0.18)", margin: "0.3rem 0" }} />
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
                  borderRadius: 6,
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
    </header>
  );
}
