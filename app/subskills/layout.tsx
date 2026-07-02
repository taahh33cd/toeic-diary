import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SubskillsHeader } from "@/components/subskills/SubskillsHeader";

export const dynamic = "force-dynamic";

export default async function SubskillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/subskills");

  const profile = user
    ? await prisma.profile
        .findUnique({ where: { id: user.id }, select: { displayName: true } })
        .catch(() => null)
    : null;

  const displayName =
    profile?.displayName ?? user?.email?.split("@")[0] ?? "bạn";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <SubskillsHeader
        displayName={displayName}
        userEmail={user?.email}
        userDisplayName={profile?.displayName}
      />
      {children}
    </div>
  );
}
