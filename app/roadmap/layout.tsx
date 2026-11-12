import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Lộ trình học",
    template: "%s | Anh Hiếu²",
  },
  description: "Lộ trình TOEIC cá nhân hoá từ kết quả bài test đầu vào",
};

/**
 * Khu Lộ trình nằm ở cấp cao nhất chứ không trong /journal.
 *
 * Lý do: layout /journal bắt buộc phải có `studentCode` — mã do giáo viên cấp —
 * nên học viên tự đăng ký sẽ bị đá sang trang bán khoá. Mà lộ trình thì đã chốt
 * là mở cho mọi tài khoản đăng nhập. Để ở đây thì ngang hàng /skills, /subskills
 * và ai đăng nhập cũng vào được; phần việc hằng ngày vẫn sẽ đổ vào
 * /journal/missions cho học viên có sổ (Phase 3).
 */
const ROADMAP_HEADER_BG = "#0f766e";

export default async function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/roadmap");

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { displayName: true } })
    .catch(() => null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Header
        userEmail={user.email}
        userDisplayName={profile?.displayName}
        bg={ROADMAP_HEADER_BG}
      />
      <main className="max-w-[900px] mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        {children}
      </main>
    </div>
  );
}
