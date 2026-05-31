"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun, X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useState } from "react";

const NAV = [
  { label: "Dictation",  href: "/dictation" },
  { label: "Grammar",    href: "/grammar" },
  { label: "Reading",    href: "/reading-practice" },
  { label: "Luyện đề",  href: "/practice", soon: false },
];

export function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { theme, toggleTheme } = useUIStore();
  const router = useRouter();
  const [modal, setModal] = useState(false);

  function handleNavClick(href: string, e: React.MouseEvent) {
    if (isLoggedIn) return; // allow normal navigation
    e.preventDefault();
    setModal(true);
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#4DA8DA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 no-underline hover:opacity-90 transition-opacity">
            <span className="font-bold text-base text-white leading-tight">TOEIC Diary</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleNavClick(href, e)}
                className="text-sm text-white font-medium pb-1 border-b-2 border-transparent hover:border-[#FFD66B] transition-colors cursor-pointer"
                style={{ textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon text-white hover:text-white hover:bg-white/10"
              aria-label="Đổi theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isLoggedIn ? (
              <Link
                href="/dictation"
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-[#4DA8DA] text-sm font-semibold hover:bg-[#FFD66B] transition-colors"
                style={{ textDecoration: "none" }}
              >
                Vào học →
              </Link>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-white font-medium hover:text-[#FFD66B] transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-1.5 rounded-lg bg-white text-[#4DA8DA] text-sm font-semibold hover:bg-[#FFD66B] transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  Đăng ký miễn phí
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setModal(false)}
        >
          <div
            className="relative bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="text-3xl mb-3 text-center">🎧</div>
            <h2 className="text-lg font-bold text-center text-[var(--text-primary)] mb-1">
              Bạn cần đăng nhập
            </h2>
            <p className="text-sm text-center text-[var(--text-secondary)] mb-6">
              Tạo tài khoản miễn phí để truy cập đầy đủ tính năng.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/auth/register"
                className="w-full text-center px-4 py-3 rounded-xl bg-[#4DA8DA] text-white font-semibold text-sm hover:bg-[#3b96c8] transition-colors"
                style={{ textDecoration: "none" }}
              >
                Đăng ký miễn phí
              </Link>
              <Link
                href="/auth/login"
                className="w-full text-center px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium text-sm hover:bg-[var(--bg-secondary)] transition-colors"
                style={{ textDecoration: "none" }}
              >
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
