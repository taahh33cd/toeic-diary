import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** POST /api/push/ping — called by service worker when push event fires.
 *  No auth required — SW has no credentials. Used purely to confirm
 *  that the push event is reaching the service worker on the device.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  console.log("[push/ping] SW received push event:", JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
