import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { loadAttemptDetail } from "@/lib/journal/attempts";
import { AttemptReviewClient } from "./_review-client";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Xem lại bài đã làm" };

export default async function AttemptDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/journal/attempts/${id}`);

  // Chỉ lấy được lượt của chính mình — loadAttemptDetail lọc theo userId.
  const detail = await loadAttemptDetail(user.id, id);
  if (!detail) notFound();

  const profile = await prisma.profile
    .findUnique({ where: { id: user.id }, select: { studentCode: true, role: true } })
    .catch(() => null);

  // Sổ từ vựng ghi theo studentCode trên Firebase → chỉ HV nội bộ/giáo viên lưu được.
  const canSaveVocab = Boolean(profile?.studentCode)
    || profile?.role === "teacher" || profile?.role === "admin";

  return (
    <AttemptReviewClient
      test={detail.test}
      config={detail.config}
      answers={detail.answers}
      marked={detail.marked}
      canSaveVocab={canSaveVocab}
      testHref={detail.item.testHref}
    />
  );
}
