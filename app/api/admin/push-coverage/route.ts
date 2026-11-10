import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * GET /api/admin/push-coverage
 *
 * Số thiết bị đã đăng ký nhận thông báo của từng học viên, để dashboard gắn
 * nhãn "chưa bật thông báo". Dữ liệu này nằm ở Postgres (PushSubscription) nên
 * thẻ đọc RTDB không thấy được — thiếu nó thì thầy bấm nhắc một HV chưa bật
 * thông báo mà không hề biết là push không tới đâu cả.
 *
 * Trả về { coverage: { [studentCode]: số thiết bị } }. Chỉ trả về con số, không
 * trả endpoint hay khoá của subscription.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [profiles, grouped] = await Promise.all([
    prisma.profile.findMany({
      where: { studentCode: { not: null } },
      select: { id: true, studentCode: true },
    }),
    prisma.pushSubscription.groupBy({ by: ["userId"], _count: { _all: true } }),
  ]);

  const perUser = new Map(grouped.map((g) => [g.userId, g._count._all]));
  const coverage: Record<string, number> = {};
  for (const p of profiles) {
    if (p.studentCode) coverage[p.studentCode] = perUser.get(p.id) ?? 0;
  }

  return NextResponse.json({ coverage });
}
