"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Vừa xong";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return `${Math.floor(diff / 86_400_000)} ngày trước`;
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, markAllRead } = useAdminNotifications();
  const router = useRouter();

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
      style={{
        background: "var(--bg-elevated, #fff)",
        border: "1px solid rgba(199,196,214,0.4)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(199,196,214,0.3)" }}
      >
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary, #1a1a2e)" }}>
          Thông báo
          {unreadCount > 0 && (
            <span
              className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "#5d5cde" }}
            >
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs hover:underline"
            style={{ color: "#5d5cde" }}
          >
            Đọc tất cả
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-sm py-10" style={{ color: "var(--text-secondary, #666)" }}>
            Chưa có thông báo
          </p>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              className="w-full text-left px-4 py-3 flex gap-3 items-start border-b last:border-0 transition-colors hover:bg-black/5"
              style={{
                borderColor: "rgba(199,196,214,0.2)",
                background: n.read ? "transparent" : "rgba(93,92,222,0.05)",
              }}
              onClick={() => {
                markAsRead(n.id);
                onClose();
                router.push(n.url);
              }}
            >
              <span
                className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                style={{ background: n.read ? "transparent" : "#5d5cde" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary, #1a1a2e)" }}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-secondary, #666)" }}>
                    {n.body}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--text-muted, #999)" }}>
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminTopBar() {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useAdminNotifications();

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

        {/* Bell + dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-black/5"
            onClick={() => setOpen((v) => !v)}
            aria-label="Thông báo"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ color: open ? "#5d5cde" : "var(--text-secondary)" }}
            >
              notifications
            </span>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none"
                style={{ background: "#ef4444" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="relative z-50">
                <NotificationDropdown onClose={() => setOpen(false)} />
              </div>
            </>
          )}
        </div>

        <Link href="/admin/settings">
          <span
            className="material-symbols-outlined text-[22px] cursor-pointer transition-colors hover:text-[#4441c4]"
            style={{ color: "var(--text-secondary)" }}
          >
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
