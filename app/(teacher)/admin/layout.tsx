import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

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
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-admin-sans)",
      }}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar + drawer */}
        <MobileNav role="admin" />

        {/* Desktop sticky top bar */}
        <AdminTopBar />

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-auto">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
            <ViewTransition enter="admin-page" exit="admin-page">
              {children}
            </ViewTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
