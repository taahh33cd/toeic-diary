import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { KHOA0_COURSE_ID } from "@/lib/payment/khoa0";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/course-unlock
 * Tells the client whether to show the "course unlocked" celebration popup:
 * the user owns Khoá 0 but hasn't seen the celebration yet. Covers both admin
 * approval and manual DB upgrades (both set enrolledCourses).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ celebrate: false });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { enrolledCourses: true, courseUnlockCelebratedAt: true },
  });

  const celebrate =
    !!profile &&
    profile.enrolledCourses.includes(KHOA0_COURSE_ID) &&
    profile.courseUnlockCelebratedAt === null;

  return NextResponse.json({ celebrate });
}

/**
 * POST /api/me/course-unlock
 * Marks the celebration as seen so it never shows again for this account.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.profile.updateMany({
    where: { id: user.id, courseUnlockCelebratedAt: null },
    data: { courseUnlockCelebratedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
