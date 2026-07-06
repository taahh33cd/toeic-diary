import { NextResponse, type NextRequest } from "next/server";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

// TEMPORARY debug route — verifies whether a push sent from the Vercel Node
// runtime is presented as a banner on iOS (Cloud Functions' equivalent send is
// delivered to the SW but not presented). Delete once diagnosis is complete.
const TOKEN = "vx7k2p9qmd";
const TEST_UID = "c28e8d5f-256f-4e48-814e-d4ed0930cffb";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const t = new Date().toLocaleTimeString();
  await sendPushToUser(TEST_UID, {
    title: `🌐 VERCEL test ${t}`,
    body: "Gửi từ Vercel Node runtime",
    url: "/journal",
  });
  return NextResponse.json({ ok: true, sentAt: t });
}
