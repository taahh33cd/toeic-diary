import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

function setupVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

/** POST /api/push/test — student gửi test push, trả về kết quả từng subscription */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true, endpoint: true, subscription: true },
  });

  if (subs.length === 0) {
    return NextResponse.json({ ok: false, error: "no_subscription", subCount: 0, results: [] });
  }

  setupVapid();
  const payload = JSON.stringify({
    title: "✅ Thông báo hoạt động!",
    body: "Push notification đang hoạt động đúng trên thiết bị này.",
    url: "/journal/settings",
  });

  const results = await Promise.allSettled(
    subs.map(async (s) => {
      const domain = new URL(s.endpoint).hostname;
      try {
        await webpush.sendNotification(
          JSON.parse(s.subscription) as webpush.PushSubscription,
          payload
        );
        return { id: s.id, domain, status: "ok" };
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode;
        // Auto-clean stale subscriptions
        if (code === 410 || code === 404 || code === 401) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
        return { id: s.id, domain, status: "error", code };
      }
    })
  );

  const details = results.map((r) => r.status === "fulfilled" ? r.value : { status: "error", code: -1 });
  const sent = details.filter((r) => r.status === "ok").length;

  return NextResponse.json({ ok: sent > 0, sent, total: subs.length, results: details });
}

/** GET /api/push/test — trả về số subscription trong DB */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { endpoint: true },
  });

  const domains = subs.map((s) => {
    try { return new URL(s.endpoint).hostname; } catch { return "unknown"; }
  });

  return NextResponse.json({ subCount: subs.length, domains });
}
