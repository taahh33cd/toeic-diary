import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const internal = request.headers.get("x-internal-secret");
  const ok =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    (!!process.env.INTERNAL_PUSH_SECRET && internal === process.env.INTERNAL_PUSH_SECRET);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await prisma.profile.findMany({
    where: { studentCode: { not: null } },
    select: { id: true, studentCode: true },
  });

  if (students.length === 0) return NextResponse.json({ ok: true, notified: 0 });

  // Số từ đến hạn của MỌI học viên trong một câu groupBy, thay vì tải cả kho từ
  // của từng người về từ RTDB rồi tự đếm. Đếm theo từ nên từ nằm ở nhiều bộ
  // không bị đếm hai lần — chỗ mà badge cũ thổi phồng số.
  const now = new Date();
  const dueRows = await prisma.vocabProgress.groupBy({
    by: ["userId"],
    where: {
      userId: { in: students.map((s) => s.id) },
      mastered: false,
      OR: [{ dueAt: null }, { dueAt: { lte: now } }],
    },
    _count: { _all: true },
  });
  const dueByUser = new Map(dueRows.map((r) => [r.userId, r._count._all]));

  const db = getAdminDb();
  let notified = 0;

  await Promise.allSettled(
    students.map(async (student) => {
      const dueCount = dueByUser.get(student.id) ?? 0;

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
