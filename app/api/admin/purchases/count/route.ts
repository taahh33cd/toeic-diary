import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/purchases/count
 * Số đơn Khoá 0 đang chờ xác nhận (status = "submitted"), dùng cho indicator
 * trên nav item "Mở khoá". Trả 0 nếu chưa đăng nhập / không phải admin-teacher.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

  const role = (user.app_metadata?.role as string) ?? "student";
  if (role !== "admin" && role !== "teacher") {
    return NextResponse.json({ count: 0 }, { status: 403 });
  }

  const count = await prisma.coursePurchase.count({ where: { status: "submitted" } });
  return NextResponse.json({ count });
}
