import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Brand } from "@/components/shared/Brand";
import { NavSwitcher } from "@/components/shared/NavSwitcher";
import { JournalTabBar } from "@/components/journal/TabBar";
import { MobileBottomNav } from "@/components/journal/MobileBottomNav";
import { NotificationWatcher } from "@/components/shared/NotificationWatcher";
import { InstallBanner } from "@/components/shared/InstallBanner";

export const metadata: Metadata = {
  title: {
    default: "Nhật ký học tập",
    template: "%s | Anh Hiếu²",
  },
  description: "Theo dõi tiến trình TOEIC — điểm số, từ vựng, nhiệm vụ hàng ngày",
};

export default async function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/journal");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { studentCode: true },
  });

  if (!profile?.studentCode) redirect("/auth/onboarding-incomplete");

  return (
    <div
      className="theme-journal min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* ── Skip to main content ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:bg-[var(--accent-primary)] focus:text-white focus:outline-none"
      >
        Chuyển đến nội dung chính
      </a>

      {/* ── Top header ── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Brand size="sm" href="/journal" />
          <NavSwitcher orientation="horizontal" />
        </div>
      </header>

      {/* ── Desktop journal tab bar ── */}
      <JournalTabBar />

      {/* ── Page content ── */}
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* ── Realtime notification watcher ── */}
      <NotificationWatcher studentCode={profile.studentCode} />

      {/* ── PWA install banner ── */}
      <InstallBanner />

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav />

      {/* Spacer for mobile nav */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </div>
  );
}
