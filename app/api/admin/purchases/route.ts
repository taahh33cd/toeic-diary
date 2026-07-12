import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, status: 401, user: null };
  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "admin" && role !== "teacher") {
    return { error: "Forbidden" as const, status: 403, user: null };
  }
  return { error: null, status: 200, user };
}

/**
 * GET /api/admin/purchases
 * Lists open Khoá 0 orders (pending + submitted) for the approval panel,
 * awaiting-review first.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const purchases = await prisma.coursePurchase.findMany({
    where: { status: { in: ["pending", "submitted"] } },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      code: true,
      amount: true,
      status: true,
      submittedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ purchases });
}

/**
 * POST /api/admin/purchases
 * Body: { id: string; action: "approve" | "reject" }
 * Approve grants course access to the buyer; reject marks the order rejected.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  const { id, action } = body;
  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const purchase = await prisma.coursePurchase.findUnique({ where: { id } });
  if (!purchase) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (purchase.status === "paid") {
    return NextResponse.json({ status: "paid" }); // already approved — idempotent
  }

  if (action === "reject") {
    await prisma.coursePurchase.update({ where: { id }, data: { status: "rejected" } });
    return NextResponse.json({ status: "rejected" });
  }

  // Approve: mark paid + grant course access.
  await prisma.$transaction(async (tx) => {
    await tx.coursePurchase.update({
      where: { id },
      data: { status: "paid", paidAt: new Date(), approvedBy: gate.user!.id },
    });

    const profile = await tx.profile.findUnique({
      where: { id: purchase.userId },
      select: { enrolledCourses: true },
    });
    const current = profile?.enrolledCourses ?? [];
    if (!current.includes(purchase.courseId)) {
      await tx.profile.update({
        where: { id: purchase.userId },
        data: { enrolledCourses: { set: [...current, purchase.courseId] } },
      });
    }
  });

  return NextResponse.json({ status: "paid" });
}
