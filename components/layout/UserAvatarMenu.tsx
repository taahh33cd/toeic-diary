"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  BarChart2,
  NotebookPen,
  Headphones,
  GraduationCap,
  BookOpen,
  Puzzle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserAvatarMenuProps {
  userEmail: string;
  userDisplayName?: string | null;
  /** Optional CSS color for the avatar ring/border — defaults to semi-transparent white */
  borderColor?: string;
}

/**
 * Reusable avatar button + dropdown menu.
 * Drop this into any header that needs the profile dropdown.
 */
export function UserAvatarMenu({
  userEmail,
  userDisplayName,
  borderColor = "rgba(255,255,255,0.4)",
}: UserAvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef  = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const router   = useRouter();

  const initial     = userDisplayName?.[0]?.toUpperCase() ?? userEmail[0]?.toUpperCase() ?? "U";
  const displayName = userDisplayName ?? userEmail.split("@")[0];

  // Close on outside click or Escape
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const NAV_ITEMS = [
    { href: "/practice",       icon: <Headphones   size={15} aria-hidden />, label: "Luyện tập theo Part" },
    { href: "/progress",       icon: <BarChart2    size={15} aria-hidden />, label: "Tiến độ học tập"    },
    { href: "/journal/vocab",  icon: <BookOpen     size={15} aria-hidden />, label: "Từ vựng đã lưu"     },
    { href: "/grammar",        icon: <GraduationCap size={15} aria-hidden />, label: "Luyện ngữ pháp"   },
    { href: "/subskills",      icon: <Puzzle       size={15} aria-hidden />, label: "Subskills Part 2"   },
    { href: "/journal",        icon: <NotebookPen  size={15} aria-hidden />, label: "Nhật ký học tập"   },
  ];

  return (
    <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Avatar button */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu tài khoản"
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.20)",
          border: `1.5px solid ${borderColor}`,
          color: "#fff",
          fontSize: "0.8rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          outline: open ? "2px solid rgba(255,255,255,0.5)" : "none",
          outlineOffset: 1,
          transition: "outline 0.12s",
          flexShrink: 0,
        }}
      >
        {initial}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          aria-label="Tài khoản"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 208,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg, 12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            overflow: "hidden",
            zIndex: 9999,
            animation: "slideDown 0.12s ease",
          }}
        >
          {/* User info header */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {displayName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "0 8px" }} />

          {/* Nav items */}
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-secondary)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
              }}
            >
              {icon}
              {label}
            </Link>
          ))}

          <div style={{ height: 1, background: "var(--border)", margin: "0 8px" }} />

          {/* Sign out */}
          <button
            role="menuitem"
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              width: "100%",
              fontSize: "0.875rem",
              color: "var(--accent-red, #ef4444)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <LogOut size={15} aria-hidden />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
