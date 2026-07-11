"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones, BookOpen, GraduationCap, Puzzle, Home, Moon, Sun, Menu, X } from "lucide-react";
import { UserAvatarMenu } from "@/components/layout/UserAvatarMenu";
import { useUIStore } from "@/stores/uiStore";
import { DASH } from "@/lib/skills/dashboard-theme";

const EXTERNAL = [
  { href: "/dictation", label: "Dictation", icon: Home },
  { href: "/reading-practice", label: "Reading", icon: BookOpen },
  { href: "/subskills", label: "Subskills", icon: Puzzle },
  { href: "/grammar", label: "Ngữ pháp", icon: GraduationCap },
  { href: "/practice", label: "Luyện Part", icon: Headphones },
];

export function SkillsHeader({ userEmail, userDisplayName }: { userEmail?: string | null; userDisplayName?: string | null }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUIStore();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: DASH.bg, borderBottom: `1px solid ${DASH.border}` }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: "1.5rem", paddingInline: "clamp(1rem, 4vw, 1.75rem)" }}>
        {/* Wordmark */}
        <Link href="/skills" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: "1.2rem", color: DASH.amber }}>✳</span>
          <span style={{ fontFamily: DASH.display, fontWeight: 800, fontSize: "1.05rem", color: DASH.text, letterSpacing: "0.01em" }}>TOEIC</span>
          <span style={{ fontFamily: DASH.sans, fontSize: "0.72rem", fontWeight: 600, color: DASH.muted, textTransform: "uppercase", letterSpacing: "0.14em", borderLeft: `1px solid ${DASH.border}`, paddingLeft: 9 }}>Luyện đề</span>
        </Link>

        {/* Right group: nav + actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
            {EXTERNAL.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 8, fontFamily: DASH.sans, fontSize: "0.82rem", fontWeight: 500, color: DASH.muted, textDecoration: "none", transition: "color .15s, background .15s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = DASH.text; el.style.background = DASH.panel2; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = DASH.muted; el.style.background = "transparent"; }}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={toggleTheme} aria-label="Đổi giao diện app" style={{ background: "none", border: "none", cursor: "pointer", color: DASH.muted, padding: 6, display: "flex", alignItems: "center" }}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {userEmail && <UserAvatarMenu userEmail={userEmail} userDisplayName={userDisplayName} borderColor={DASH.border} />}
            <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? "Đóng menu" : "Mở menu"} style={{ background: "none", border: "none", cursor: "pointer", color: DASH.text, padding: 6, display: "flex", alignItems: "center" }}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, top: 60, zIndex: 40, background: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)} />
          <nav style={{ position: "fixed", top: 60, left: 0, right: 0, zIndex: 45, background: DASH.panel, borderBottom: `1px solid ${DASH.border}`, padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: 2 }}>
            {EXTERNAL.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 8, fontFamily: DASH.sans, fontSize: "0.9rem", color: DASH.text, textDecoration: "none" }}>
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
