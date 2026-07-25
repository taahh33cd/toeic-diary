import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { KHOA0_COURSE_ID } from "@/lib/payment/khoa0";

export const dynamic = "force-dynamic";

/**
 * GET /api/payment/khoa-0/status
 * Polled by the checkout screen. Returns "paid" once an admin has approved the
 * order (granting the course), otherwise the latest order's status.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { enrolledCourses: true },
  });

  if (profile?.enrolledCourses.includes(KHOA0_COURSE_ID)) {
    return NextResponse.json({ status: "paid" });
  }

  const purchase = await prisma.coursePurchase.findFirst({
    where: { userId: user.id, courseId: KHOA0_COURSE_ID },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return NextResponse.json({ status: purchase?.status ?? "none" });
}
