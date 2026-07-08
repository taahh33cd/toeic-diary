"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/firebase/useNotifications";

function formatRelativeTime(iso?: string, fallbackKey?: string): string {
  let ts = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(ts) && fallbackKey) {
    const n = parseInt(fallbackKey, 10);
    if (!Number.isNaN(n)) ts = n;
  }
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Vừa xong";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return `${Math.floor(diff / 86_400_000)} ngày trước`;
}

/** Notifications carry only a `type` (no url) — route by type. */
function urlForType(type: string): string {
  if (type === "homework") return "/journal/progress";
  if (type === "vocab") return "/journal/vocab";
  return "/journal";
}

// Hardcoded palette: the journal header overrides --text-* to white, so the
// (light) dropdown must not inherit those or its text would be invisible.
const INK = "#3D2B1F";
const MUTED = "#8A7A6C";
const FAINT = "#B5A697";
const ACCENT = "#C4622D";

export function JournalNotificationBell({ studentCode }: { studentCode: string }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications(studentCode);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-white/10"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "#fff" }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none"
            style={{ background: "#ef4444" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl overflow-hidden z-50"
            style={{
              background: "#fff",
              border: "1px solid rgba(61,43,31,0.12)",
              boxShadow: "0 8px 32px rgba(61,43,31,0.18)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "rgba(61,43,31,0.1)" }}
            >
              <span className="font-semibold text-sm" style={{ color: INK }}>
                Thông báo
                {unreadCount > 0 && (
                  <span
                    className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: ACCENT }}
                  >
                    {unreadCount}
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: ACCENT }}>
                  Đọc tất cả
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-sm py-10" style={{ color: MUTED }}>
                  Chưa có thông báo
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n._key}
                    className="w-full text-left px-4 py-3 flex gap-3 items-start border-b last:border-0 transition-colors hover:bg-black/[0.03]"
                    style={{
                      borderColor: "rgba(61,43,31,0.07)",
                      background: n.read ? "transparent" : "rgba(196,98,45,0.06)",
                    }}
                    onClick={() => {
                      markAsRead(n._key);
                      setOpen(false);
                      router.push(urlForType(n.type));
                    }}
                  >
                    <span
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ background: n.read ? "transparent" : ACCENT }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: INK }}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: MUTED }}>
                          {n.body}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: FAINT }}>
                        {formatRelativeTime(n.createdAt, n._key)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
