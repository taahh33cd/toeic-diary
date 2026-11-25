import { NextResponse, type NextRequest } from "next/server";

import { autoAssignDue } from "@/lib/homework/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron tối (20:30 giờ VN): giao các nháp BTVN đã duyệt của giáo trình bật
 * "tự giao", tới ngày buổi học rồi.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const internal = request.headers.get("x-internal-secret");
  const ok =
    auth === `Bearer ${process.env.CRON_SECRET}` ||
    (!!process.env.INTERNAL_PUSH_SECRET && internal === process.env.INTERNAL_PUSH_SECRET);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const r = await autoAssignDue();
  if (r.failed) console.warn(`[hw-auto-assign] ${r.assigned} đã giao, ${r.failed} lỗi`);
  return NextResponse.json({ ok: true, ...r });
}
