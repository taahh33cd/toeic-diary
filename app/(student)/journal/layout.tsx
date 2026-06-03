import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Brand } from "@/components/shared/Brand";
import { NavSwitcher } from "@/components/shared/NavSwitcher";
import { JournalTabBar } from "@/components/journal/TabBar";
import { JournalMobileNav } from "@/components/journal/MobileNav";
import { MobileBottomNav } from "@/components/journal/MobileBottomNav";
import { NotificationWatcher } from "@/components/shared/NotificationWatcher";
import { InstallBanner } from "@/components/shared/InstallBanner";
import { PushPromptBanner } from "@/components/shared/PushPromptBanner";
import { LocaleProvider } from "@/hooks/useLocale";
import { JournalThemeWrapper } from "@/components/journal/ThemeProvider";

export const dynamic = "force-dynamic";

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
    select: { studentCode: true, displayName: true, journalTheme: true },
  });

  if (!profile?.studentCode) redirect("/auth/onboarding-incomplete");

  return (
    <LocaleProvider>
    <JournalThemeWrapper
      className="theme-journal min-h-screen flex flex-col"
      initialTheme={profile.journalTheme ?? undefined}
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
          background: "var(--journal-header-bg, #3D2B1F)",
          borderColor: "var(--journal-header-border, #2A1F15)",
          boxShadow: "var(--shadow-sm)",
          viewTransitionName: "journal-header",
          ["--text-primary" as string]: "#FFFFFF",
          ["--text-secondary" as string]: "rgba(255,255,255,0.72)",
          ["--bg-secondary" as string]: "rgba(255,255,255,0.08)",
          ["--accent-primary" as string]: "#FF7A3D",
          ["--orange-faint" as string]: "rgba(255,122,61,0.18)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center relative">
          <Brand
            size="sm"
            href="/journal"
            label={`${profile?.displayName ?? user.email?.split("@")[0] ?? "My"}'s TOEIC Diary`}
          />

          {/* Desktop: nav centered */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <NavSwitcher orientation="horizontal" />
          </div>

          {/* Mobile: hamburger dropdown on the right */}
          <div className="md:hidden ml-auto">
            <JournalMobileNav />
          </div>
        </div>
      </header>

      {/* ── Desktop journal tab bar ── */}
      <JournalTabBar />

      {/* ── Push notification prompt ── */}
      <PushPromptBanner
        studentCode={profile.studentCode}
        description="Bật thông báo để nhận lịch học, nhận xét và bài tập mới từ thầy"
      />

      {/* ── Page content ── */}
      <main id="main-content" className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-4 md:py-6">
        <ViewTransition enter="journal-page" exit="journal-page">
          {children}
        </ViewTransition>
      </main>

      {/* ── Realtime notification watcher ── */}
      <NotificationWatcher studentCode={profile.studentCode} />

      {/* ── PWA install banner ── */}
      <InstallBanner />

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav />

      {/* Spacer for mobile nav */}
      <div className="md:hidden h-16" aria-hidden="true" />
    </JournalThemeWrapper>
    </LocaleProvider>
  );
}
