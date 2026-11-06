import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import { recentOverdueHomework } from "@/lib/journal/homework";
import type { Homework, SubmissionsMap, DayLinksMap } from "@/lib/firebase/types";

export const runtime = "nodejs";

/** Chỉ nhắc bài quá hạn trong 7 ngày gần nhất — khớp danh sách trên dashboard. */
const WINDOW_DAYS = 7;

/** Khoá chuông cố định, dùng chung với cron homework-overdue nên không spam
 *  chuông: bấm nhiều lần chỉ làm mới một mục, học viên làm xong thì cron xoá. */
const BELL_KEY = "reminder_homework_overdue";

type Result = {
  studentCode: string;
  /** "sent" đã gửi · "clear" không còn bài quá hạn · "no-profile" chưa có tài khoản · "error" */
  status: "sent" | "clear" | "no-profile" | "error";
  overdue: number;
  /** Mốc đã ghi vào students/{code}/lastHwReminderAt (ISO). */
  sentAt?: string;
};

/**
 * POST /api/admin/homework-remind
 * Body: { studentCodes: string[] }
 *
 * Nhắc học viên còn bài tập quá hạn chưa nộp: ghi một mục vào chuông in-app
 * (notifications/{code}) và đẩy web push. Số bài quá hạn được tính lại ở server
 * để tin nhắn không sai nếu dashboard đang giữ dữ liệu cũ.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { studentCodes?: unknown } | null;
  const codes = Array.isArray(body?.studentCodes)
    ? body!.studentCodes.filter((c): c is string => typeof c === "string" && c.length > 0)
    : [];
  if (codes.length === 0) {
    return NextResponse.json({ error: "missing studentCodes" }, { status: 400 });
  }

  // Hôm nay theo giờ Việt Nam (UTC+7), giống cron homework-overdue.
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const db = getAdminDb();

  const settled = await Promise.all(
    codes.map(async (code): Promise<Result> => {
      try {
        const [profile, hwSnap, subSnap, dlSnap, frozenSnap] = await Promise.all([
          prisma.profile.findFirst({ where: { studentCode: code }, select: { id: true } }),
          db.ref(`students/${code}/homework`).get(),
          db.ref(`submissions/${code}`).get(),
          db.ref(`daylinks/${code}`).get(),
          db.ref(`students/${code}/frozen`).get(),
        ]);

        if (frozenSnap.val() === true) return { studentCode: code, status: "clear", overdue: 0 };

        const rawHw = hwSnap.val() as Homework[] | Record<string, Homework> | null;
        const list: Homework[] = Array.isArray(rawHw) ? rawHw : Object.values(rawHw ?? {});
        const submissions = (subSnap.val() as SubmissionsMap) ?? {};
        const dayLinks = (dlSnap.val() as DayLinksMap) ?? {};

        const overdue = recentOverdueHomework(list, submissions, dayLinks, today, WINDOW_DAYS);
        if (overdue.length === 0) return { studentCode: code, status: "clear", overdue: 0 };

        const title = "📌 Bài tập quá hạn cần hoàn thành";
        const body =
          overdue.length === 1
            ? "Bạn có 1 bài tập đã quá hạn chưa nộp. Hoàn thành ngay nhé!"
            : `Bạn có ${overdue.length} bài tập đã quá hạn chưa nộp. Hoàn thành ngay nhé!`;

        const sentAt = new Date().toISOString();
        await db.ref(`notifications/${code}/${BELL_KEY}`).set({
          type: "homework",
          title,
          body,
          read: false,
          createdAt: sentAt,
        });

        // Mốc "đã nhắc tay" cho dashboard (cron KHÔNG ghi field này — xem
        // OverdueRemindCard). Ghi cả khi HV chưa có tài khoản vì mục chuông
        // đã vào rồi, thầy không cần bấm lại.
        await db.ref(`students/${code}/lastHwReminderAt`).set(sentAt);

        if (!profile) {
          return { studentCode: code, status: "no-profile", overdue: overdue.length, sentAt };
        }

        await sendPushToUser(profile.id, { title, body, url: "/journal/progress" });
        return { studentCode: code, status: "sent", overdue: overdue.length, sentAt };
      } catch (e) {
        console.error(`[homework-remind] ${code} failed:`, e);
        return { studentCode: code, status: "error", overdue: 0 };
      }
    })
  );

  return NextResponse.json({
    ok: true,
    sent: settled.filter((r) => r.status === "sent").length,
    results: settled,
  });
}
