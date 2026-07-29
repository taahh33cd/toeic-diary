"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const PRIMARY = [
  { href: "/journal",           label: "Tổng quan",    exact: true },
  { href: "/journal/scores",    label: "Điểm số" },
  { href: "/journal/missions",  label: "Nhiệm vụ" },
  { href: "/journal/vocab",     label: "Từ vựng" },
] as const;

const OVERFLOW = [
  { href: "/journal/schedule",     label: "Lịch học",  emoji: "📅" },
  { href: "/journal/achievements", label: "Thành tựu", emoji: "🏆" },
  { href: "/journal/settings",     label: "Cài đặt",   emoji: "⚙️" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function active(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const overflowActive = OVERFLOW.some((t) => pathname.startsWith(t.href));

  return (
    <nav
      className="hidden md:flex items-stretch flex-1 min-w-0 px-1"
      aria-label="Journal tabs"
    >
      {PRIMARY.map((tab) => {
        const on = active(tab.href, (tab as { exact?: boolean }).exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={on ? "page" : undefined}
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 .95rem",
              fontSize: ".78rem",
              fontWeight: on ? 600 : 500,
              color: on ? "#FBF7F2" : "rgba(245,239,230,.5)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: on ? "inset 0 -2px 0 #C4622D" : "none",
              transition: "color .15s",
            }}
            onMouseEnter={(e) => {
              if (!on)
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(245,239,230,.82)";
            }}
            onMouseLeave={(e) => {
              if (!on)
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(245,239,230,.5)";
            }}
          >
            {tab.label}
          </Link>
        );
      })}

      {/* Overflow — "···" */}
      <div
        ref={wrapRef}
        style={{ position: "relative", display: "flex", alignItems: "stretch" }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".25rem",
            padding: "0 .85rem",
            fontSize: ".78rem",
            fontWeight: overflowActive ? 600 : 500,
            color: overflowActive
              ? "#FBF7F2"
              : open
              ? "rgba(245,239,230,.82)"
              : "rgba(245,239,230,.5)",
            background: "none",
            border: "none",
            cursor: "pointer",
            boxShadow:
              overflowActive
                ? "inset 0 -2px 0 #C4622D"
                : open
                ? "inset 0 -2px 0 rgba(196,98,45,.45)"
                : "none",
            transition: "color .15s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span style={{ letterSpacing: ".05em" }}>···</span>
          <span style={{ fontSize: ".55rem", opacity: 0.65 }}>▾</span>
        </button>

        {open && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 2px)",
              left: 0,
              background: "#FBF7F2",
              border: "1px solid #DDD0C0",
              boxShadow: "0 4px 16px rgba(44,30,15,.13)",
              minWidth: 158,
              zIndex: 60,
            }}
          >
            {OVERFLOW.map((item) => {
              const on = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".55rem",
                    padding: ".6rem 1rem",
                    fontSize: ".82rem",
                    color: on ? "#C4622D" : "#2C1E0F",
                    fontWeight: on ? 600 : 400,
                    textDecoration: "none",
                    background: on ? "rgba(196,98,45,.06)" : "transparent",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "rgba(196,98,45,.09)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = on
                      ? "rgba(196,98,45,.06)"
                      : "transparent";
                  }}
                >
                  <span aria-hidden="true">{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}

            <div style={{ borderTop: "1px solid #EDE4D6", margin: ".2rem 0" }} />

            <Link
              href="/dictation"
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".45rem",
                padding: ".5rem 1rem",
                fontSize: ".75rem",
                color: "#9A8672",
                textDecoration: "none",
                transition: "background .1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "rgba(196,98,45,.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
            >
              <span aria-hidden="true">🎧</span>
              Chuyển về Dictation
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
