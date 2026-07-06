/**
 * lib/push.ts — Server-side Web Push helpers.
 * Shared by API routes, server actions, and cron jobs.
 */

import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";

function setupVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

/**
 * True when the push service permanently rejected the subscription, so it
 * should be purged from storage. ONLY 410 Gone / 404 Not Found qualify —
 * the browser expired or revoked the sub. 401/403 and 400+VapidPkHashMismatch
 * are VAPID server-key problems: the sub is still valid, our signing key was
 * wrong. Deleting on those wrongly nukes live devices (fix the key instead).
 */
function isDeadSubscription(err: { statusCode?: number; body?: string }): boolean {
  return err.statusCode === 410 || err.statusCode === 404;
}

/** Send push to all subscriptions of a Supabase user (from Prisma). */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body?: string; url?: string }
): Promise<void> {
  setupVapid();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const payloadStr = JSON.stringify({ url: "/journal", ...payload });

  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification(JSON.parse(s.subscription) as webpush.PushSubscription, payloadStr)
        .catch(async (err: { statusCode?: number; body?: string }) => {
          if (isDeadSubscription(err)) {
            await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        })
    )
  );
}

/** Send push to all admin device subscriptions stored in RTDB adminSubs/. */
export async function sendPushToAdminSubs(
  payload: { title: string; body?: string; url?: string }
): Promise<void> {
  setupVapid();
  const db = getAdminDb();
  const snap = await db.ref("adminSubs").get();
  if (!snap.exists()) return;

  const payloadStr = JSON.stringify({ url: "/admin", ...payload });
  const promises: Promise<unknown>[] = [];

  snap.forEach((child) => {
    const data = child.val() as { subscription?: string } | null;
    if (!data?.subscription) return;
    try {
      const sub = JSON.parse(data.subscription) as webpush.PushSubscription;
      promises.push(
        webpush.sendNotification(sub, payloadStr).catch(async (err: { statusCode?: number; body?: string }) => {
          if (isDeadSubscription(err)) {
            await child.ref.remove().catch(() => undefined);
          }
        })
      );
    } catch {
      // malformed JSON — ignore
    }
  });

  await Promise.all(promises);
}
