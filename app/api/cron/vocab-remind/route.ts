import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import { isDue } from "@/lib/vocab/srs";
import type { VocabWord } from "@/lib/firebase/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const internal = request.headers.get("x-internal-secret");
  const ok =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    (!!process.env.INTERNAL_PUSH_SECRET && internal === process.env.INTERNAL_PUSH_SECRET);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Today in ICT (UTC+7)
  const nowUtc = new Date();
  const todayIct = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
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
      const snap = await db.ref(`vocab/${student.studentCode}`).get();
      if (!snap.exists()) return;

      const raw = snap.val() as Record<string, Omit<VocabWord, "id">>;
      const dueCount = Object.values(raw).filter((w) => isDue(w, today)).length;

      // Deduped bell entry (fixed key): refresh while due, remove when clear.
      const bellRef = db.ref(`notifications/${student.studentCode}/reminder_vocab_due`);
      if (dueCount === 0) {
        await bellRef.remove().catch(() => {});
        return;
      }

      const body =
        dueCount === 1
          ? "Có 1 từ cần ôn lại hôm nay. Mất chưa đến 1 phút!"
          : `${dueCount} từ đang chờ bạn ôn lại. Giữ đà nhớ từ nhé!`;
      const title = "🧠 Ôn từ vựng hôm nay!";

      await bellRef.set({ type: "vocab", title, body, read: false, createdAt: new Date().toISOString() });
      await sendPushToUser(student.id, { title, body, url: "/journal/vocab" });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
