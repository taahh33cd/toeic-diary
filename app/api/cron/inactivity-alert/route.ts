import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToAdminSubs } from "@/lib/push";

export const runtime = "nodejs";

const INACTIVE_DAYS = 5;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS);

  // Only enrolled students (studentCode not null) who haven't been active for 5+ days
  const inactive = await prisma.profile.findMany({
    where: {
      studentCode: { not: null },
      OR: [
        { lastActiveDate: null },
        { lastActiveDate: { lt: cutoff } },
      ],
    },
    select: { studentCode: true, displayName: true, lastActiveDate: true },
  });

  if (inactive.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  const names = inactive
    .map((u) => u.displayName ?? u.studentCode)
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");

  const extra = inactive.length > 5 ? ` và ${inactive.length - 5} người khác` : "";

  await sendPushToAdminSubs({
    title: `⚠️ ${inactive.length} học viên không hoạt động ${INACTIVE_DAYS} ngày`,
    body: `${names}${extra}`,
    url: "/admin/students",
  });

  return NextResponse.json({ ok: true, notified: inactive.length });
}
