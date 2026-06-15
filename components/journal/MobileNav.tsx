"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/home",             label: "Home",      emoji: "🏠" },
  { href: "/dictation",        label: "Dictation", emoji: "🎧" },
  { href: "/grammar",          label: "Grammar",   emoji: "🎓" },
  { href: "/reading-practice", label: "Reading",   emoji: "📖" },
  { href: "/subskills",        label: "Subskills", emoji: "🧩" },
];

export function JournalMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng menu" : "Mở menu điều hướng"}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.85)",
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          borderRadius: 8,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          aria-label="Điều hướng chính"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "var(--journal-header-bg, #3D2B1F)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            minWidth: 180,
            overflow: "hidden",
            zIndex: 60,
          }}
        >
          {NAV.map(({ href, label, emoji }, idx) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  color: active
                    ? "var(--accent-primary, #FF7A3D)"
                    : "rgba(255,255,255,0.82)",
                  background: active
                    ? "rgba(255,122,61,0.12)"
                    : "transparent",
                  borderBottom:
                    idx < NAV.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{emoji}</span>
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
