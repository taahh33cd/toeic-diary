import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { KHOA0_COURSE_ID } from "@/lib/payment/khoa0";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/khoa-0/submit
 * The buyer signals they have transferred the money. Marks their open order as
 * "submitted" so it surfaces in the admin approval panel.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      userId: user.id,
      courseId: KHOA0_COURSE_ID,
      status: { in: ["pending", "submitted"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!purchase) {
    return NextResponse.json({ error: "No open order" }, { status: 404 });
  }

  if (purchase.status === "pending") {
    await prisma.coursePurchase.update({
      where: { id: purchase.id },
      data: { status: "submitted", submittedAt: new Date() },
    });
  }

  return NextResponse.json({ status: "submitted" });
}
