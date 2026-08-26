import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { STEPS_SKILL, getFreeItems } from "@/lib/subskills/speaking-p2-steps";
import FreePracticeClient from "@/components/subskills/speaking/FreePracticeClient";
import { CONTAINER_MAX, FILL_SCREEN, FS, PAD_X, PAD_Y } from "@/lib/ui/scale";

export const metadata: Metadata = { title: "Luyện tự do — Mô tả tranh 3 bước" };

export default async function FreePracticePage() {
  const items = getFreeItems();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const rows = user
    ? await prisma.pictureNote
        .findMany({
          where: { userId: user.id },
          select: { itemId: true, step1: true, step2: true, step3: true },
        })
        .catch(() => [])
    : [];

  const notes: Record<string, { step1: string; step2: string; step3: string }> = {};
  for (const r of rows) notes[r.itemId] = { step1: r.step1, step2: r.step2, step3: r.step3 };

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
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem", fontSize: FS.sm, color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/subskills" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Subskills</Link>
        <span>›</span>
        <Link href="/subskills/speaking/part2" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Part 2</Link>
        <span>›</span>
        <Link href="/subskills/speaking/part2/mo-ta-buoc" style={{ color: "var(--text-muted)", textDecoration: "none" }}>{STEPS_SKILL.labelVi}</Link>
        <span>›</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Luyện tự do</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
          Luyện tự do với kho ảnh
        </h1>
        <p style={{ margin: 0, fontSize: FS.sm, color: "var(--text-muted)", fontStyle: "italic" }}>
          Chọn ảnh bất kỳ, tự nháp từ vựng và câu cho 3 bước. Không chấm điểm, không khoá cấp độ — ghi chú tự lưu theo tài khoản.
        </p>
      </div>

      <FreePracticeClient items={items} initialNotes={notes} userId={user?.id ?? null} />

      <div style={{ marginTop: "auto", height: 1, background: "var(--border)" }} />
      <p style={{ marginTop: "0.75rem", textAlign: "center", fontSize: FS.xs, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        TOEIC DICTATION DIARY
      </p>
    </div>
  );
}
