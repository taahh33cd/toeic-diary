import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { loadPartGoalsBundle } from "@/lib/part-goals/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/part-goals            — HV: mục tiêu part + tiến độ mọi tháng của chính mình
 * GET /api/part-goals?code=XXX   — GV/admin: của HV bất kỳ (không cộng XP)
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata?.role as string) ?? "student";
  const isStaff = role === "admin" || role === "teacher";

  let code: string | null;
  let userId: string | null;
  if (isStaff) {
    code = req.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Thiếu mã học viên" }, { status: 400 });
    const p = await prisma.profile.findUnique({ where: { studentCode: code }, select: { id: true } });
    userId = p?.id ?? null;
  } else {
    const p = await prisma.profile.findUnique({ where: { id: user.id }, select: { studentCode: true } });
    code = p?.studentCode ?? null;
    userId = user.id;
    if (!code) return NextResponse.json({ months: [], celebrate: null });
  }

  try {
    const bundle = await loadPartGoalsBundle(code, userId, isStaff ? null : user.id);
    return NextResponse.json(bundle);
  } catch (e) {
    console.error("[part-goals GET]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Không tải được mục tiêu" }, { status: 500 });
  }
}
