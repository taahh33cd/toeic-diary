import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import type { Homework, VocabWord } from "@/lib/firebase/types";

export const runtime = "nodejs";

// Must mirror constants in app/(student)/journal/vocab/page.tsx
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60];
const MASTERY_THRESHOLD = 10;

function isDue(word: Omit<VocabWord, "id">, todayStr: string): boolean {
  if ((word.repCount ?? 0) >= MASTERY_THRESHOLD) return false;
  if (!word.lastReview) return true;
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

  const nowUtc = new Date();
  const todayIct = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
  const today = todayIct.toISOString().slice(0, 10);

  // Midnight ICT expressed as UTC (for streak comparison against lastActiveDate)
  const todayStartUtc = new Date(
    Date.UTC(todayIct.getUTCFullYear(), todayIct.getUTCMonth(), todayIct.getUTCDate()) -
      7 * 60 * 60 * 1000
  );

  // Homework lookback windows
  const d30 = new Date(todayIct);
  d30.setDate(todayIct.getDate() - 30);
  const thirtyDaysAgo = d30.toISOString().slice(0, 10);

  const d7 = new Date(todayIct);
  d7.setDate(todayIct.getDate() - 7);
  const sevenDaysAgo = d7.toISOString().slice(0, 10);

  const students = await prisma.profile.findMany({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true, currentStreak: true, lastActiveDate: true },
  });

  if (students.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  const db = getAdminDb();
  let notified = 0;

  await Promise.allSettled(
    students.map(async (student) => {
      // ── Streak check ──
      const streakAtRisk =
        student.currentStreak > 0 &&
        (student.lastActiveDate === null || student.lastActiveDate < todayStartUtc);

      // ── Homework check ──
      const hwSnap = await db.ref(`students/${student.studentCode}/homework`).get();
      const hwArr: Homework[] = hwSnap.val() ?? [];

      const current = hwArr.filter(
        (h) =>
          h.date <= today &&
          ((h.endDate && h.endDate >= today) || (!h.endDate && h.date >= thirtyDaysAgo))
      );
      const overdue = hwArr.filter(
        (h) => h.endDate && h.endDate < today && h.endDate >= sevenDaysAgo
      );
      const hasHomework = current.length > 0 || overdue.length > 0;

      // ── Vocab SRS check ──
      const vocabSnap = await db.ref(`vocab/${student.studentCode}`).get();
      let dueVocab = 0;
      if (vocabSnap.exists()) {
        const raw = vocabSnap.val() as Record<string, Omit<VocabWord, "id">>;
        dueVocab = Object.values(raw).filter((w) => isDue(w, today)).length;
      }

      if (!streakAtRisk && !hasHomework && dueVocab === 0) return;

      // ── Build push message ──
      const activeSignals = [streakAtRisk, hasHomework, dueVocab > 0].filter(Boolean).length;

      let title: string;
      let body: string;

      if (activeSignals === 1) {
        // Single signal → use focused original messages
        if (streakAtRisk) {
          title = `🔥 Giữ streak ${student.currentStreak} ngày của bạn!`;
          body = "Còn vài tiếng nữa là hết ngày — học 1 bài ngắn để không mất chuỗi nhé!";
        } else if (hasHomework) {
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
        } else {
          title = "🧠 Ôn từ vựng hôm nay!";
          body =
            dueVocab === 1
              ? "Có 1 từ cần ôn lại hôm nay. Mất chưa đến 1 phút!"
              : `${dueVocab} từ đang chờ bạn ôn lại. Giữ đà nhớ từ nhé!`;
        }
      } else {
        // Multiple signals → consolidated message
        const parts: string[] = [];
        if (streakAtRisk) parts.push(`🔥 Streak ${student.currentStreak} ngày`);
        if (current.length > 0) parts.push(`📝 ${current.length} bài tập`);
        else if (overdue.length > 0) parts.push(`⚠️ ${overdue.length} bài quá hạn`);
        if (dueVocab > 0) parts.push(`🧠 ${dueVocab} từ cần ôn`);

        title = "📚 Nhắc nhở học tập hôm nay";
        body = parts.join(" • ");
      }

      await sendPushToUser(student.id, { title, body, url: "/journal" });
      notified++;
    })
  );

  return NextResponse.json({ ok: true, notified });
}
