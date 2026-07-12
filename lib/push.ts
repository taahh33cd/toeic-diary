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

/**
 * Frozen accounts receive no push at all. `frozen` lives in RTDB at
 * students/{studentCode}/frozen; map userId → studentCode via Prisma.
 * Fail-open: a transient lookup error must not block all notifications.
 */
export async function isUserFrozen(userId: string): Promise<boolean> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { studentCode: true },
    });
    if (!profile?.studentCode) return false;
    const snap = await getAdminDb().ref(`students/${profile.studentCode}/frozen`).get();
    return snap.val() === true;
  } catch (e) {
    console.error("[push] frozen check failed, proceeding:", e);
    return false;
  }
}

/** Send push to all subscriptions of a Supabase user (from Prisma). */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body?: string; url?: string }
): Promise<void> {
  setupVapid();
  if (await isUserFrozen(userId)) return;

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

/**
 * Notify all admins: write an admin-bell entry (RTDB adminNotifications, read by
 * AdminTopBar) AND push a banner to every admin device. Use for events the
 * teacher must act on — e.g. a new purchase awaiting approval.
 */
export async function notifyAdmins(
  payload: { title: string; body?: string; url?: string }
): Promise<void> {
  try {
    await getAdminDb().ref("adminNotifications").push({
      title: payload.title,
      body: payload.body ?? "",
      url: payload.url ?? "/admin",
      createdAt: Date.now(),
      read: false,
    });
  } catch (e) {
    console.error("[notifyAdmins] bell write failed:", e);
  }
  await sendPushToAdminSubs(payload);
}
