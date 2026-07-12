import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { KHOA0_COURSE_ID } from "@/lib/payment/khoa0";
import { notifyAdmins } from "@/lib/push";

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

    // Notify admins that an order is now awaiting confirmation. Only on the
    // real pending→submitted transition, so re-submits don't re-notify.
    await notifyAdmins({
      title: "💳 Đơn hàng mới cần xác nhận",
      body: `${purchase.email ?? user.email ?? "Học viên"} đã báo chuyển khoản Khoá 0 — kiểm tra & duyệt mở khoá.`,
      url: "/admin/purchases",
    }).catch((e) => console.error("[khoa-0/submit] notifyAdmins failed:", e));
  }

  return NextResponse.json({ status: "submitted" });
}
