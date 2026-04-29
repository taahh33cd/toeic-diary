import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Anh Hiếu² Admin",
  },
  description: "Quản lý học viên, bài tập và tiến độ học TOEIC",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="theme-admin min-h-screen flex"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* ── Skip to main content ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:bg-[var(--accent-primary)] focus:text-white focus:outline-none"
      >
        Chuyển đến nội dung chính
      </a>
      {/* ── Sidebar (desktop) ── */}
      <Sidebar role="admin" />

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar + drawer */}
        <MobileNav role="admin" />

        {/* Page content */}
        <main id="main-content" className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
