import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser, sendPushToAdminSubs } from "@/lib/push";

export const runtime = "nodejs";

/**
 * POST /api/push/dispatch — internal endpoint called by Cloud Functions.
 *
 * Pushes sent directly from the Cloud Functions runtime reach the service
 * worker but iOS does NOT present them as a banner; the same web-push call from
 * this Vercel Node runtime is presented correctly. So RTDB-triggered functions
 * delegate the actual send here.
 *
 * Auth: shared secret in the `x-internal-secret` header.
 * Body: { target: { kind: "uid", uid } | { kind: "studentCode", code } | { kind: "admins" },
 *         title, body?, url? }
 */
export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.INTERNAL_PUSH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    target?: { kind?: string; uid?: string; code?: string };
    title?: string;
    body?: string;
    url?: string;
  } | null;

  if (!body?.target?.kind || !body.title) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const payload = { title: body.title, body: body.body, url: body.url };
  const { target } = body;

  if (target.kind === "admins") {
    await sendPushToAdminSubs(payload);
  } else if (target.kind === "uid" && target.uid) {
    await sendPushToUser(target.uid, payload);
  } else if (target.kind === "studentCode" && target.code) {
    const profile = await prisma.profile.findFirst({
      where: { studentCode: target.code },
      select: { id: true },
    });
    if (profile) await sendPushToUser(profile.id, payload);
  } else {
    return NextResponse.json({ error: "bad target" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
