"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/shared/Brand";
import { signOutAll } from "@/hooks/firebase/useFirebaseAuthBridge";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin",              emoji: "📊", label: "Dashboard",   exact: true },
  { href: "/admin/students",     emoji: "👥", label: "Học viên" },
  { href: "/admin/homework",     emoji: "📝", label: "Bài tập" },
  { href: "/admin/progress",     emoji: "📈", label: "Tiến độ" },
  { href: "/admin/classes",      emoji: "🏫", label: "Lớp học" },
  { href: "/admin/scores",       emoji: "🎯", label: "Điểm số" },
  { href: "/admin/bookings",     emoji: "📅", label: "Lịch hẹn" },
  { href: "/admin/slots",        emoji: "⏰", label: "Khung giờ" },
  { href: "/admin/attendance",   emoji: "✅", label: "Điểm danh" },
  { href: "/admin/settings",     emoji: "⚙️", label: "Cài đặt" },
  { href: "/admin/teachers",     emoji: "👨‍🏫", label: "Giáo viên",  adminOnly: true },
];

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role = "teacher" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOutAll();
    router.push("/auth/login");
  }

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0"
      style={{
        width: "var(--sidebar-w, 240px)",
        background: "var(--sidebar-bg, #1E2235)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Brand size="sm" href="/admin" />
        <span
          className="mt-1 block text-xs font-medium px-1"
          style={{ color: "var(--sidebar-text, #A8B0CC)" }}
        >
          {role === "admin" ? "Admin" : "Teacher"} Panel
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5" aria-label="Admin navigation">
        {NAV.filter((item) => !item.adminOnly || role === "admin").map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== "/admin";
          const isAdminDash = item.exact && pathname === "/admin";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active || isAdminDash
                  ? "text-white"
                  : "hover:text-white"
              }`}
              style={
                active || isAdminDash
                  ? {
                      background: "var(--sidebar-active-bg, rgba(176,125,26,0.25))",
                      color: "var(--sidebar-active-text, #FFFFFF)",
                    }
                  : { color: "var(--sidebar-text, #A8B0CC)" }
              }
              aria-current={active ? "page" : undefined}
            >
              <span className="text-base leading-none w-5 text-center" aria-hidden="true">
                {item.emoji}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ color: "var(--sidebar-text, #A8B0CC)" }}
        >
          <span className="text-base w-5 text-center" aria-hidden="true">🎧</span>
          Dictation
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400"
          style={{ color: "var(--sidebar-text, #A8B0CC)" }}
        >
          <span className="text-base w-5 text-center" aria-hidden="true">🚪</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
