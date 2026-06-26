import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import type { VocabWord } from "@/lib/firebase/types";

export const runtime = "nodejs";

// Must mirror constants in app/(student)/journal/vocab/page.tsx
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60];
const MASTERY_THRESHOLD = 10;

function isDue(word: Omit<VocabWord, "id">, todayStr: string): boolean {
  if ((word.repCount ?? 0) >= MASTERY_THRESHOLD) return false;
  if (!word.lastReview) return true; // never reviewed → immediately due
  const last = new Date(word.lastReview + "T00:00:00");
  const interval = SRS_INTERVALS[Math.min(word.repCount ?? 0, SRS_INTERVALS.length - 1)];
  const due = new Date(last);
  due.setDate(due.getDate() + interval);
  return due <= new Date(todayStr + "T00:00:00");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      if (dueCount === 0) return;

      await sendPushToUser(student.id, {
        title: "🧠 Ôn từ vựng hôm nay!",
        body:
          dueCount === 1
            ? "Có 1 từ cần ôn lại hôm nay. Mất chưa đến 1 phút!"
            : `${dueCount} từ đang chờ bạn ôn lại. Giữ đà nhớ từ nhé!`,
        url: "/journal/vocab",
      });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
