"use client";

import Link from "next/link";
import { X, Menu, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";

const NAV = [
  { label: "Home",       href: "/home",               auth: false },
  { label: "Dictation",  href: "/dictation",          auth: true  },
  { label: "Grammar",    href: "/grammar",             auth: true  },
  { label: "Reading",    href: "/reading-practice",    auth: true  },
  { label: "Luyện đề",  href: "/practice",            auth: true  },
  { label: "Khoá học",  href: "/course",              auth: false },
];

const INK   = "#3D2B1F";
const TERRA = "#C4622D";

export function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [modal,      setModal]      = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useUIStore();

  function handleNavClick(e: React.MouseEvent, requireAuth: boolean) {
    setMobileOpen(false);
    if (!requireAuth || isLoggedIn) return;
    e.preventDefault();
    setModal(true);
  }

  return (
    <>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50, width: "100%",
          background: INK,
          borderBottom: `2px solid ${TERRA}55`,
        }}
      >
        <div
          style={{
            maxWidth: 1400, margin: "0 auto", padding: "0 1.25rem",
            height: 60, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12,
          }}
        >
          {/* Logo */}
          <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display,'Lora',Georgia,serif)", fontWeight: 700, fontSize: "0.9rem", color: "#FFFDF6", lineHeight: 1.2 }}>
                TOEIC Diary
              </div>
              <div style={{ fontSize: "0.55rem", color: "rgba(255,253,246,0.42)", letterSpacing: "0.13em", textTransform: "uppercase" }}>
                Dictation · Grammar · Reading
              </div>
            </div>
          </Link>

          {/* Desktop nav — className controls show/hide, no display in inline style */}
          <nav
            className="hidden md:flex"
            style={{ alignItems: "center", gap: 24, flex: 1, justifyContent: "center" }}
          >
            {NAV.map(({ label, href, auth }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(e, auth)}
                style={{
                  fontSize: "0.82rem", color: "rgba(255,253,246,0.8)", fontWeight: 500,
                  textDecoration: "none", paddingBottom: 3, whiteSpace: "nowrap",
                  borderBottom: "2px solid transparent", transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = TERRA;
                  e.currentTarget.style.color = "#FFFDF6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = "transparent";
                  e.currentTarget.style.color = "rgba(255,253,246,0.8)";
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              aria-label={theme === "dark" ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFDF6", padding: "6px", display: "flex", alignItems: "center", borderRadius: 6, opacity: 0.8, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Desktop auth — className controls show/hide */}
            {isLoggedIn ? (
              <Link
                href="/dictation"
                className="hidden md:inline-flex"
                style={{ padding: "6px 16px", borderRadius: 8, background: TERRA, color: "#fff", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}
              >
                Vào học →
              </Link>
            ) : (
              <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
                <Link href="/auth/login" style={{ fontSize: "0.82rem", color: "rgba(255,253,246,0.75)", textDecoration: "none", fontWeight: 500 }}>
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  style={{ padding: "6px 14px", borderRadius: 8, background: TERRA, color: "#fff", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}
                >
                  Đăng ký miễn phí
                </Link>
              </div>
            )}

            {/* Mobile hamburger — className controls show/hide */}
            <button
              className="flex md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFDF6", padding: 4 }}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div
            className="md:hidden"
            style={{
              background: INK,
              borderTop: `1px solid ${TERRA}33`,
              padding: "0.75rem 1.25rem 1.25rem",
            }}
          >
            {/* Nav links */}
            <nav style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
              {NAV.map(({ label, href, auth }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => handleNavClick(e, auth)}
                  style={{
                    fontSize: "0.9rem", color: "rgba(255,253,246,0.85)", fontWeight: 500,
                    textDecoration: "none", padding: "11px 0",
                    borderBottom: `1px solid ${TERRA}22`,
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Mobile auth */}
            {isLoggedIn ? (
              <Link
                href="/dictation"
                style={{ display: "block", textAlign: "center", padding: "11px 16px", borderRadius: 8, background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}
              >
                Vào học →
              </Link>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                  href="/auth/register"
                  style={{ display: "block", textAlign: "center", padding: "11px 16px", borderRadius: 8, background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}
                >
                  Đăng ký miễn phí
                </Link>
                <Link
                  href="/auth/login"
                  style={{ display: "block", textAlign: "center", padding: "10px 16px", borderRadius: 8, border: `1.5px solid ${TERRA}55`, color: "rgba(255,253,246,0.8)", fontWeight: 500, fontSize: "0.85rem", textDecoration: "none" }}
                >
                  Đã có tài khoản? Đăng nhập
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Auth modal (unauthenticated nav click) */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(61,43,31,0.6)" }}
          onClick={() => setModal(false)}
        >
          <div
            style={{
              position: "relative", background: "#FFFDF6",
              border: `2px solid ${TERRA}45`, borderRadius: 18,
              boxShadow: `0 24px 64px rgba(61,43,31,0.35)`,
              padding: "2rem 2rem 1.75rem", width: "100%", maxWidth: 360, margin: "0 1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(false)}
              style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#9A8672" }}
              aria-label="Đóng"
            >
              <X size={17} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🎧</div>
              <h2 style={{ fontFamily: "var(--font-display,'Lora',Georgia,serif)", fontSize: "1.1rem", fontWeight: 700, color: INK, margin: "0 0 6px" }}>
                Bạn cần đăng nhập
              </h2>
              <p style={{ fontSize: "0.82rem", color: "#6B4C2A", lineHeight: 1.6, margin: 0 }}>
                Tạo tài khoản miễn phí để truy cập đầy đủ tính năng.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "1.25rem" }}>
              <Link
                href="/auth/register"
                style={{ display: "block", textAlign: "center", padding: "11px 16px", borderRadius: 10, background: TERRA, color: "#fff", fontWeight: 700, fontSize: "0.87rem", textDecoration: "none" }}
              >
                Đăng ký miễn phí
              </Link>
              <Link
                href="/auth/login"
                style={{ display: "block", textAlign: "center", padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${TERRA}55`, color: INK, fontWeight: 500, fontSize: "0.84rem", textDecoration: "none" }}
              >
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.6rem", letterSpacing: "0.15em", color: `${TERRA}60`, textTransform: "uppercase" }}>
              ── ✦ TOEIC DICTATION DIARY ✦ ──
            </div>
          </div>
        </div>
      )}
    </>
  );
}
