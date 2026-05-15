import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only teacher/admin may push
  const role = (user.app_metadata as Record<string, string>)?.role;
  if (role !== "teacher" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, title, body, url } = await request.json().catch(() => ({}));
  if (!userId || !title) {
    return NextResponse.json({ error: "userId + title required" }, { status: 400 });
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return NextResponse.json({ sent: 0 });

  const payload = JSON.stringify({ title, body: body ?? "", url: url ?? "/journal" });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        JSON.parse(s.subscription) as webpush.PushSubscription,
        payload
      ).catch(async (err) => {
        // Remove stale subscriptions (410 Gone)
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } });
        }
        throw err;
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: subs.length });
}
