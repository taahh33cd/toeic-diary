import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { isUsageExempt } from "@/lib/access";
import { getSkillMetaP2 } from "@/lib/subskills/writing-part2";
import WritingP2ComposeClient from "@/components/subskills/writing/WritingP2ComposeClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Tầng 9: Viết thật & nộp chấm — Writing Part 2" };

export default async function WritingP2Tang9Page() {
  const skill = getSkillMetaP2("tang9")!;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.profile
        .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true, enrolledCourses: true } })
        .catch(() => null)
    : null;

  return (
    <div
      style={{
        ...FILL_SCREEN,
        background: "var(--bg-primary)",
        padding: `${PAD_Y} ${PAD_X}`,
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/writing" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Writing</Link>
        <span>›</span>
        <Link href="/subskills/writing/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 2</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{skill.labelVi}</span>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {skill.labelVi}
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          {skill.label} · {skill.description}
        </p>
      </div>

      <WritingP2ComposeClient canSubmit={isUsageExempt(profile)} />

      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>TOEIC DICTATION DIARY</p>
    </div>
  );
}
