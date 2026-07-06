import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import type { Homework, HwItem, SubmissionsMap, DayLinksMap } from "@/lib/firebase/types";

export const runtime = "nodejs";

// Must mirror the completion logic in app/(student)/journal/progress/page.tsx.
const SECTIONS = ["vocab", "listening", "reading", "practice", "other"] as const;

/** A homework counts as done when its day-link is submitted (whole day complete)
 *  or every item across all sections is ticked. Empty homework is never overdue. */
function isDone(hw: Homework, submissions: SubmissionsMap, dayLinks: DayLinksMap): boolean {
  let total = 0;
  for (const sec of SECTIONS) total += (hw[sec] as HwItem[] | undefined)?.length ?? 0;
  if (total === 0) return true;
  if (dayLinks[hw.id]?.link) return true;

  let done = 0;
  for (const sec of SECTIONS) {
    const items = hw[sec] as HwItem[] | undefined;
    if (!items) continue;
    for (let i = 0; i < items.length; i++) {
      if (submissions[`${hw.id}_${sec}_${i}`]?.ticked) done++;
    }
  }
  return done === total;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const internal = request.headers.get("x-internal-secret");
  const ok =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    (!!process.env.INTERNAL_PUSH_SECRET && internal === process.env.INTERNAL_PUSH_SECRET);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Today in ICT (UTC+7). A homework is overdue once its deadline is before today.
  const todayIct = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const today = todayIct.toISOString().slice(0, 10);

  const students = await prisma.profile.findMany({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true },
  });
  if (students.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  const db = getAdminDb();
  let notified = 0;

  await Promise.allSettled(
    students.map(async (student) => {
      const code = student.studentCode!;
      const [hwSnap, subSnap, dlSnap] = await Promise.all([
        db.ref(`students/${code}/homework`).get(),
        db.ref(`submissions/${code}`).get(),
        db.ref(`daylinks/${code}`).get(),
      ]);
      if (!hwSnap.exists()) return;

      const rawHw = hwSnap.val() as Homework[] | Record<string, Homework> | null;
      const list: Homework[] = Array.isArray(rawHw) ? rawHw : Object.values(rawHw ?? {});
      const submissions = (subSnap.val() as SubmissionsMap) ?? {};
      const dayLinks = (dlSnap.val() as DayLinksMap) ?? {};

      const overdue = list.filter((hw) => {
        if (!hw?.id) return false;
        const deadline = hw.endDate ?? hw.date;
        return deadline < today && !isDone(hw, submissions, dayLinks);
      });
      if (overdue.length === 0) return;

      await sendPushToUser(student.id, {
        title: "📌 Bài tập quá hạn cần hoàn thành",
        body:
          overdue.length === 1
            ? "Bạn có 1 bài tập đã quá hạn chưa nộp. Hoàn thành ngay nhé!"
            : `Bạn có ${overdue.length} bài tập đã quá hạn chưa nộp. Hoàn thành ngay nhé!`,
        url: "/journal/progress",
      });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
