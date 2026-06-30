import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/** POST /api/push/test — student gửi test push cho chính mình để kiểm tra pipeline */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  if (subs.length === 0) {
    return NextResponse.json({ ok: false, error: "no_subscription", subCount: 0 });
  }

  try {
    await sendPushToUser(user.id, {
      title: "✅ Thông báo hoạt động!",
      body: "Push notification đang hoạt động đúng trên thiết bị này.",
      url: "/journal/settings",
    });
    return NextResponse.json({ ok: true, subCount: subs.length });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      subCount: subs.length,
    });
  }
}

/** GET /api/push/test — trả về số subscription đang lưu trong DB */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.pushSubscription.count({ where: { userId: user.id } });
  return NextResponse.json({ subCount: count });
}
