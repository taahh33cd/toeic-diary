import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { GrammarShell } from "@/components/grammar/GrammarShell";
import { isUsageExempt } from "@/lib/access";
import { UsageGate } from "@/components/shared/UsageGate";

export const dynamic = "force-dynamic";

export default async function GrammarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/grammar");

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { displayName: true, role: true, studentCode: true, enrolledCourses: true, freeUsageSeconds: true } })
    .catch(() => null);

  return (
    <GrammarShell
      displayName={profile?.displayName}
      userEmail={user.email}
      userDisplayName={profile?.displayName}
    >
      <UsageGate initialSeconds={profile?.freeUsageSeconds ?? 0} isExempt={isUsageExempt(profile)} />
      {children}
    </GrammarShell>
  );
}
