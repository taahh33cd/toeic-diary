"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BookMarked,
  ChevronLeft,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { TOPICS } from "@/lib/grammar/topics";

const TOPBAR_H = 52;
const SIDEBAR_W = 240;

const NAV_TOP = [
  { href: "/grammar", label: "Tổng quan", icon: LayoutGrid, exact: true },
  { href: "/grammar/review", label: "Ngân hàng câu sai", icon: BookMarked },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

interface SidebarProps {
  pathname: string;
  onClose?: () => void;
  mobile?: boolean;
}

function SidebarContent({ pathname, onClose }: SidebarProps) {
  const activeTopic = TOPICS.find((t) =>
    pathname.startsWith(`/grammar/${t.slug}`)
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        paddingBottom: "1.5rem",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "1.25rem 1.1rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <BookOpen
            size={15}
            style={{ color: "rgba(74,158,255,0.8)", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#E8F0FE",
              letterSpacing: "-0.01em",
            }}
          >
            Ngữ pháp TOEIC
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(180,205,240,0.4)",
              padding: "2px",
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav style={{ padding: "0.6rem 0" }}>
        {NAV_TOP.map(({ href, label, icon: Icon, exact }) => {
          const on = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.55rem 1.1rem",
                fontSize: "0.8rem",
                fontWeight: on ? 600 : 400,
                color: on
                  ? "var(--grammar-sidebar-active-text)"
                  : "var(--grammar-sidebar-text)",
                textDecoration: "none",
                background: on
                  ? "var(--grammar-sidebar-active-bg)"
                  : "transparent",
                borderLeft: on
                  ? "2px solid #4A9EFF"
                  : "2px solid transparent",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (!on)
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--grammar-sidebar-text-hover)";
              }}
              onMouseLeave={(e) => {
                if (!on)
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--grammar-sidebar-text)";
              }}
            >
              <Icon size={14} style={{ flexShrink: 0, opacity: on ? 1 : 0.7 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Topics */}
      <div style={{ padding: "0.5rem 0" }}>
        <div
          style={{
            padding: "0.8rem 1.1rem 0.4rem",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(180,205,240,0.25)",
          }}
        >
          Chủ đề
        </div>

        {TOPICS.map((topic) => {
          const on = activeTopic?.slug === topic.slug;
          return (
            <Link
              key={topic.slug}
              href={`/grammar#${topic.slug}`}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.42rem 1.1rem",
                fontSize: "0.78rem",
                fontWeight: on ? 600 : 400,
                color: on
                  ? "var(--grammar-sidebar-active-text)"
                  : "var(--grammar-sidebar-text)",
                textDecoration: "none",
                background: on
                  ? "var(--grammar-sidebar-active-bg)"
                  : "transparent",
                borderLeft: on
                  ? `2px solid ${topic.color}`
                  : "2px solid transparent",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (!on)
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--grammar-sidebar-text-hover)";
              }}
              onMouseLeave={(e) => {
                if (!on)
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--grammar-sidebar-text)";
              }}
            >
              {/* Colored dot indicator instead of emoji */}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: on ? topic.color : "rgba(180,205,240,0.2)",
                  flexShrink: 0,
                  transition: "background 0.12s",
                }}
              />
              {topic.name}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          padding: "0.8rem 1.1rem 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.72rem",
            color: "rgba(180,205,240,0.3)",
            textDecoration: "none",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(180,205,240,0.6)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(180,205,240,0.3)")
          }
        >
          <ChevronLeft size={11} />
          Về trang chính
        </Link>
      </div>
    </div>
  );
}

interface GrammarShellProps {
  children: React.ReactNode;
  displayName?: string | null;
}

export function GrammarShell({ children }: GrammarShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const activeTopic = TOPICS.find((t) =>
    pathname.startsWith(`/grammar/${t.slug}`)
  );

  return (
    <div
      className="theme-grammar"
      style={{ minHeight: "100vh", background: "var(--bg-primary)" }}
    >
      {/* ── Topbar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: TOPBAR_H,
          background: "var(--grammar-sidebar-topbar-bg)",
          borderBottom: "1px solid var(--grammar-sidebar-border)",
          display: "flex",
          alignItems: "center",
          paddingInline: "1rem",
          gap: "0.75rem",
        }}
      >
        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(180,205,240,0.6)",
            padding: "6px",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>

        {/* Brand (desktop: pushed right of sidebar; mobile: centered) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#E8F0FE",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Ngữ pháp TOEIC
          </span>

          {/* Breadcrumb when inside a topic */}
          {activeTopic && (
            <>
              <span style={{ color: "rgba(180,205,240,0.25)", fontSize: "0.8rem" }}>
                /
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "rgba(180,205,240,0.6)",
                  whiteSpace: "nowrap",
                  maxWidth: 180,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {activeTopic.name}
              </span>
            </>
          )}
        </div>

        {/* Right side: back to main */}
        <Link
          href="/"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.72rem",
            color: "rgba(180,205,240,0.35)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "color 0.12s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(180,205,240,0.7)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(180,205,240,0.35)")
          }
        >
          <ChevronLeft size={12} />
          <span className="hidden sm:inline">Trang chính</span>
        </Link>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div style={{ display: "flex", minHeight: `calc(100vh - ${TOPBAR_H}px)` }}>

        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            width: SIDEBAR_W,
            flexShrink: 0,
            background: "var(--grammar-sidebar-bg)",
            borderRight: "1px solid var(--grammar-sidebar-border)",
            position: "sticky",
            top: TOPBAR_H,
            height: `calc(100vh - ${TOPBAR_H}px)`,
            overflowY: "auto",
          }}
        >
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "rgba(0,0,0,0.55)",
              }}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: SIDEBAR_W,
                zIndex: 45,
                background: "var(--grammar-sidebar-bg)",
                borderRight: "1px solid var(--grammar-sidebar-border)",
                overflowY: "auto",
                animation: "slideRight 0.22s ease-out both",
              }}
            >
              {/* Mobile topbar inside sidebar */}
              <div
                style={{
                  height: TOPBAR_H,
                  background: "var(--grammar-sidebar-topbar-bg)",
                  borderBottom: "1px solid var(--grammar-sidebar-border)",
                  display: "flex",
                  alignItems: "center",
                  paddingInline: "1.1rem",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#E8F0FE" }}>
                  Ngữ pháp TOEIC
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(180,205,240,0.5)",
                    padding: "4px",
                    display: "flex",
                  }}
                  aria-label="Đóng menu"
                >
                  <X size={16} />
                </button>
              </div>
              <SidebarContent pathname={pathname} onClose={() => setSidebarOpen(false)} />
            </aside>
          </>
        )}

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
