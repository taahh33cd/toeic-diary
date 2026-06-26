import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import type { Homework } from "@/lib/firebase/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Today's date in ICT (UTC+7)
  const nowUtc = new Date();
  const todayIct = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
  const today = todayIct.toISOString().slice(0, 10);

  // Lookback windows
  const d30 = new Date(todayIct);
  d30.setDate(todayIct.getDate() - 30);
  const thirtyDaysAgo = d30.toISOString().slice(0, 10);

  const d7 = new Date(todayIct);
  d7.setDate(todayIct.getDate() - 7);
  const sevenDaysAgo = d7.toISOString().slice(0, 10);

  const students = await prisma.profile.findMany({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true },
  });

  if (students.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  const db = getAdminDb();
  let notified = 0;

  await Promise.allSettled(
    students.map(async (student) => {
      const snap = await db.ref(`students/${student.studentCode}/homework`).get();
      const hwArr: Homework[] = snap.val() ?? [];

      // Active: assigned ≤ today, deadline ≥ today (or no deadline assigned within 30 days)
      const current = hwArr.filter(
        (h) =>
          h.date <= today &&
          ((h.endDate && h.endDate >= today) ||
            (!h.endDate && h.date >= thirtyDaysAgo))
      );

      // Recently overdue: deadline within last 7 days
      const overdue = hwArr.filter(
        (h) => h.endDate && h.endDate < today && h.endDate >= sevenDaysAgo
      );

      if (current.length === 0 && overdue.length === 0) return;

      let title: string;
      let body: string;

      if (current.length > 0 && overdue.length > 0) {
        title = "📝 Bài tập đang chờ bạn!";
        body = `${current.length} bài đang học • ${overdue.length} bài quá hạn`;
      } else if (current.length > 0) {
        title = "📝 Nhắc nhở bài tập hôm nay";
        body =
          current.length === 1
            ? "Bạn có 1 bài tập chưa hoàn thành. Làm ngay nhé!"
            : `Bạn có ${current.length} bài tập đang trong thời hạn. Cố lên!`;
      } else {
        title = "⚠️ Bài tập quá hạn!";
        body = `${overdue.length} bài đã quá hạn — báo thầy nếu cần thêm thời gian!`;
      }

      await sendPushToUser(student.id, { title, body, url: "/journal" });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
