import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ReadingBannerAndNav } from "@/components/reading/ReadingBannerAndNav";

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
    select: { displayName: true },
  });

  const displayName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "bạn";

  return (
    <div
      className="theme-reading"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <ReadingBannerAndNav displayName={displayName} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
