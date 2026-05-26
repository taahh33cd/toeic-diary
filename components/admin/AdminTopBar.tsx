"use client";

import Link from "next/link";

export function AdminTopBar() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });

  return (
    <header
      className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-40 border-b"
      style={{
        background: "rgba(249,249,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(199,196,214,0.3)",
        viewTransitionName: "admin-topbar",
      }}
    >
      <p
        className="text-sm opacity-60"
        style={{ color: "var(--text-secondary)", fontFamily: "var(--font-admin-sans)" }}
      >
        Chào mừng trở lại, thầy Hiếu! · {dateStr}
      </p>

      <div className="flex items-center gap-4">
        {/* REALTIME badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider text-green-600">REALTIME</span>
        </div>

        <span className="material-symbols-outlined text-[22px] cursor-pointer transition-colors hover:text-[#4441c4]"
          style={{ color: "var(--text-secondary)" }}>
          notifications
        </span>

        <Link href="/admin/settings">
          <span className="material-symbols-outlined text-[22px] cursor-pointer transition-colors hover:text-[#4441c4]"
            style={{ color: "var(--text-secondary)" }}>
            settings
          </span>
        </Link>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #5d5cde, #4441c4)" }}
        >
          H²
        </div>
      </div>
    </header>
  );
}
