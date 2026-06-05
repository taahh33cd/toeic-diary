import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";

/** Unique key derived from full endpoint URL (base64url-encoded, safe for RTDB paths) */
function endpointKey(endpoint: string): string {
  return Buffer.from(endpoint).toString("base64url");
}

function isAdmin(user: { app_metadata?: Record<string, unknown> }): boolean {
  const role = (user.app_metadata as Record<string, string>)?.role;
  return role === "teacher" || role === "admin";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { studentCode, ...subscriptionData } = body as { studentCode?: string } & Record<string, unknown>;
  const subscription = subscriptionData as PushSubscriptionJSON;

  if (!subscription.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const key = endpointKey(subscription.endpoint);

  if (isAdmin(user)) {
    // Admin subscriptions go to adminSubs/ in RTDB only — not Prisma.
    // Cloud Functions read adminSubs/ to push enrollment events to admin devices.
    try {
      const db = getAdminDb();
      await db.ref(`adminSubs/${key}`).set({
        subscription: JSON.stringify(subscription),
        uid: user.id,
        updatedAt: new Date().toISOString(),
      });
      // Cross-cleanup: remove this endpoint from any pushSubs entry (same physical device)
      const allPushSubs = await db.ref("pushSubs").get();
      if (allPushSubs.exists()) {
        const removals: Promise<void>[] = [];
        allPushSubs.forEach((child) => {
          removals.push(child.ref.child(`subs/${key}`).remove().catch(() => {}));
        });
        await Promise.all(removals);
      }
    } catch (err) {
      console.error("[push/subscribe] adminSubs write failed:", err);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Student / free user: store in Postgres + mirror to RTDB
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: user.id, subscription: JSON.stringify(subscription) },
    create: {
      userId: user.id,
      endpoint: subscription.endpoint,
      subscription: JSON.stringify(subscription),
    },
  });

  try {
    const db = getAdminDb();
    await db.ref(`pushSubs/${user.id}/subs/${key}`).set(JSON.stringify(subscription));

    if (studentCode) {
      await db.ref(`pushSubs/${user.id}/studentCode`).set(studentCode);
      await db.ref(`students/${studentCode}/supabaseUid`).set(user.id);
    }

    // Cross-cleanup: remove this endpoint from adminSubs (same physical device)
    await db.ref(`adminSubs/${key}`).remove().catch(() => {});
  } catch (err) {
    console.error("[push/subscribe] RTDB write failed:", err);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await request.json().catch(() => ({}));

  if (isAdmin(user)) {
    if (endpoint) {
      try {
        const db = getAdminDb();
        await db.ref(`adminSubs/${endpointKey(endpoint)}`).remove();
      } catch (err) {
        console.error("[push/subscribe] adminSubs delete failed:", err);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Student / free user cleanup
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint } });
    try {
      const db = getAdminDb();
      await db.ref(`pushSubs/${user.id}/subs/${endpointKey(endpoint)}`).remove();
    } catch (err) {
      console.error("[push/subscribe] RTDB delete failed:", err);
    }
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
    try {
      const db = getAdminDb();
      await db.ref(`pushSubs/${user.id}/subs`).remove();
    } catch (err) {
      console.error("[push/subscribe] RTDB delete-all failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
