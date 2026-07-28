import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isUsageExempt } from "@/lib/access";
import { ContentLockModal } from "@/components/shared/ContentLockModal";
import { getCatalogEntry, getExamSet, isTestFree, loadTest } from "@/lib/full-tests";
import { FullTestRunner } from "@/components/full-tests/FullTestRunner";

type Props = { params: Promise<{ exam: string; test: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam, test } = await params;
  const entry = getCatalogEntry(exam, Number(test));
  return { title: entry ? `${entry.title} — TOEIC` : "Full Test — TOEIC" };
}

export default async function FullTestPage({ params }: Props) {
  const { exam, test } = await params;
  const examSet = getExamSet(exam);
  const testNumber = Number(test);
  if (!examSet || !examSet.available || !Number.isInteger(testNumber)) notFound();

  const entry = getCatalogEntry(exam, testNumber);
  if (!entry || entry.locked) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? await prisma.profile
        .findUnique({
          where: { id: user.id },
          select: { role: true, studentCode: true, enrolledCourses: true, freeUsageSeconds: true },
        })
        .catch(() => null)
    : null;

  // Đề 1 mở cho mọi người; còn lại cần đã đăng ký khoá (hoặc là HV nội bộ/giáo viên).
  if (!isTestFree(testNumber) && !isUsageExempt(profile)) {
    // Không nạp đề: người chưa mở khoá thì không cần tải 350KB dữ liệu đề.
    return <ContentLockModal />;
  }

  const data = await loadTest(entry.slug);
  if (!data) notFound();

  // Sổ từ vựng ghi theo studentCode trên Firebase, nên chỉ HV nội bộ mới lưu được.
  const canSaveVocab = Boolean(profile?.studentCode)
    || profile?.role === "teacher" || profile?.role === "admin";

  return <FullTestRunner test={data} examSlug={exam} canSaveVocab={canSaveVocab} />;
}
