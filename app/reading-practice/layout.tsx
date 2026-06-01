import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ReadingBannerAndNav } from "@/components/reading/ReadingBannerAndNav";
import { canAccessContent } from "@/lib/access";
import { ContentLockModal } from "@/components/shared/ContentLockModal";

export const dynamic = "force-dynamic";

export default async function ReadingPracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/reading-practice");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { displayName: true, role: true, studentCode: true, enrolledCourses: true },
  });

  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "bạn";

  const locked = !canAccessContent(profile);

  return (
    <div
      className="theme-reading"
      style={{ minHeight: "100vh", background: "var(--bg-primary)" }}
    >
      {locked && <ContentLockModal />}
      <ReadingBannerAndNav displayName={displayName} />
      {children}
    </div>
  );
}
