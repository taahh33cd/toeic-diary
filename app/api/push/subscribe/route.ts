import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";

/** Stable 40-char key derived from endpoint URL (base64url-encoded, safe for RTDB paths) */
function endpointKey(endpoint: string): string {
  return Buffer.from(endpoint).toString("base64url").slice(0, 40);
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

  // Extract studentCode (optional) before passing the rest as PushSubscriptionJSON
  const { studentCode, ...subscriptionData } = body as { studentCode?: string } & Record<string, unknown>;
  const subscription = subscriptionData as PushSubscriptionJSON;

  if (!subscription.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  // 1) Store in Postgres via Prisma (upsert by endpoint to avoid duplicates)
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: user.id, subscription: JSON.stringify(subscription) },
    create: {
      userId: user.id,
      endpoint: subscription.endpoint,
      subscription: JSON.stringify(subscription),
    },
  });

  // 2) Mirror to Firebase RTDB so Cloud Functions can access without Prisma
  try {
    const db = getAdminDb();
    const key = endpointKey(subscription.endpoint);

    await db.ref(`pushSubs/${user.id}/subs/${key}`).set(JSON.stringify(subscription));

    if (studentCode) {
      // Write studentCode alongside so P3 Cloud Function can query by it
      await db.ref(`pushSubs/${user.id}/studentCode`).set(studentCode);
      // Also write reverse mapping for P4 (iterate all students quickly)
      await db.ref(`students/${studentCode}/supabaseUid`).set(user.id);
    }
  } catch (err) {
    // RTDB write failure is non-fatal — Prisma record is the source of truth for existing push flow
    console.error("[push/subscribe] RTDB write failed:", err);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await request.json().catch(() => ({}));
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint },
    });

    // Remove from RTDB
    try {
      const db = getAdminDb();
      const key = endpointKey(endpoint);
      await db.ref(`pushSubs/${user.id}/subs/${key}`).remove();
    } catch (err) {
      console.error("[push/subscribe] RTDB delete failed:", err);
    }
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });

    // Remove all subs from RTDB for this user
    try {
      const db = getAdminDb();
      await db.ref(`pushSubs/${user.id}/subs`).remove();
    } catch (err) {
      console.error("[push/subscribe] RTDB delete-all failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
