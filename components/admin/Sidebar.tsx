"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOutAll } from "@/hooks/firebase/useFirebaseAuthBridge";
import { useRouter } from "next/navigation";
import { usePendingPurchases } from "@/hooks/usePendingPurchases";

const NAV = [
  { href: "/admin",            icon: "dashboard",    label: "Dashboard",  exact: true },
  { href: "/admin/students",   icon: "group",        label: "Học viên" },
  { href: "/admin/homework",   icon: "assignment",   label: "Bài tập" },
  { href: "/admin/progress",   icon: "trending_up",  label: "Tiến độ" },
  { href: "/admin/classes",    icon: "school",       label: "Lớp học" },
  { href: "/admin/scores",     icon: "analytics",    label: "Điểm số" },
  { href: "/admin/bookings",   icon: "event",        label: "Lịch hẹn" },
  { href: "/admin/slots",      icon: "schedule",     label: "Khung giờ" },
  { href: "/admin/attendance", icon: "fact_check",   label: "Điểm danh" },
  { href: "/admin/purchases",  icon: "payments",     label: "Mở khoá" },
  { href: "/admin/settings",   icon: "settings",     label: "Cài đặt" },
  { href: "/admin/teachers",   icon: "badge",        label: "Giáo viên", adminOnly: true },
];

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role = "teacher" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pendingPurchases = usePendingPurchases();

  async function handleSignOut() {
    await signOutAll();
    router.push("/auth/login");
  }

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{
        width: "var(--sidebar-w, 280px)",
        background: "var(--sidebar-bg, #1a1c20)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        fontFamily: "var(--font-admin-sans)",
        viewTransitionName: "admin-sidebar",
      }}
    >
      {/* Brand */}
      <div className="px-8 pt-7 pb-8 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: "linear-gradient(135deg, #5d5cde, #4441c4)" }}
        >
          H²
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight" style={{ color: "#f1eeff", fontFamily: "var(--font-admin-serif)" }}>
            Anh Hiếu
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#777585", letterSpacing: "0.04em" }}>
            {role === "admin" ? "Admin" : "Teacher"} Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-0.5" aria-label="Admin navigation">
        {NAV.filter((item) => !item.adminOnly || role === "admin").map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && item.href !== "/admin";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
              style={
                active
                  ? {
                      background: "rgba(68,65,196,0.18)",
                      color: "#f1eeff",
                      borderLeft: "3px solid #4441c4",
                      paddingLeft: "13px",
                    }
                  : {
                      color: "#777585",
                      borderLeft: "3px solid transparent",
                      paddingLeft: "13px",
                    }
              }
              aria-current={active ? "page" : undefined}
            >
              <span
                className="material-symbols-outlined text-[20px] shrink-0"
                style={{
                  fontVariationSettings: "'wght' 300",
                  color: active ? "#c2c1ff" : "#777585",
                }}
              >
                {item.icon}
              </span>
              <span className="text-[13px] font-semibold tracking-[0.04em]">{item.label}</span>
              {item.href === "/admin/purchases" && pendingPurchases > 0 && (
                <span
                  className="ml-auto min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none shrink-0"
                  style={{ background: "#ef4444" }}
                  aria-label={`${pendingPurchases} đơn chờ xác nhận`}
                >
                  {pendingPurchases > 99 ? "99+" : pendingPurchases}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 mt-auto border-t space-y-0.5" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200"
          style={{ color: "#777585", paddingLeft: "13px" }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 300" }}>
            headset
          </span>
          <span className="text-[13px] font-semibold tracking-[0.04em]">Dictation</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-red-500/10"
          style={{ color: "#b94a4a", paddingLeft: "13px" }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 300" }}>
            logout
          </span>
          <span className="text-[13px] font-semibold tracking-[0.04em]">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
