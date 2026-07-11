import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SkillsHeader } from "@/components/skills/SkillsHeader";

export const dynamic = "force-dynamic";

export default async function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/skills");

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { displayName: true } })
    .catch(() => null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <SkillsHeader userEmail={user.email} userDisplayName={profile?.displayName} />
      {children}
    </div>
  );
}
