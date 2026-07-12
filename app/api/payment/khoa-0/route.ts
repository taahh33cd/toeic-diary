import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import {
  KHOA0_COURSE_ID,
  KHOA0_PRICE,
  BANK_ACCOUNT,
  BANK_CODE,
  BANK_OWNER,
  buildSepayQrUrl,
  generatePurchaseCode,
} from "@/lib/payment/khoa0";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/khoa-0
 * Creates (or re-uses) a pending Khoá 0 purchase for the logged-in user and
 * returns the SePay QR + bank details to display. Idempotent: repeated calls
 * return the same pending order until it is paid.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { enrolledCourses: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (profile.enrolledCourses.includes(KHOA0_COURSE_ID)) {
    return NextResponse.json({ status: "already_owned" });
  }

  // Re-use an existing pending order so refreshes don't create duplicates.
  let purchase = await prisma.coursePurchase.findFirst({
    where: { userId: user.id, courseId: KHOA0_COURSE_ID, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  if (!purchase) {
    purchase = await prisma.coursePurchase.create({
      data: {
        userId: user.id,
        courseId: KHOA0_COURSE_ID,
        code: generatePurchaseCode(),
        amount: KHOA0_PRICE,
      },
    });
  }

  return NextResponse.json({
    status: "pending",
    code: purchase.code,
    amount: purchase.amount,
    qrUrl: buildSepayQrUrl(purchase.code),
    bank: { code: BANK_CODE, account: BANK_ACCOUNT, owner: BANK_OWNER },
  });
}
