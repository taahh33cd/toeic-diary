import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Header } from "@/components/layout/Header";

export const dynamic = "force-dynamic";

// Tone riêng cho khu Luyện đề: header indigo (khác sky-blue của phần còn lại)
const SKILLS_HEADER_BG = "#4f46e5";

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
      <Header userEmail={user.email} userDisplayName={profile?.displayName} bg={SKILLS_HEADER_BG} />
      {children}
    </div>
  );
}
