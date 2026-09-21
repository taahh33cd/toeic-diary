import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

/**
 * POST /api/push/hw-note
 * Gọi từ trang chi tiết học viên sau khi saveHwFileNote() ghi vào Firebase.
 * Body: { studentCode: string; note?: string; hwLabel?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as
    | { studentCode?: string; note?: string; hwLabel?: string }
    | null;

  if (!body?.studentCode) {
    return NextResponse.json({ error: "missing studentCode" }, { status: 400 });
  }

  const profile = await prisma.profile.findFirst({
    where: { studentCode: body.studentCode },
    select: { id: true },
  });

  if (!profile) return NextResponse.json({ ok: true, skipped: "no profile" });

  await sendPushToUser(profile.id, {
    title: body.hwLabel
      ? `💬 Thầy Hiếu đã nhận xét bài nộp ${body.hwLabel}`
      : "💬 Thầy Hiếu đã nhận xét bài nộp",
    body: body.note ? body.note.slice(0, 80) : "Mở mục Nhiệm vụ để xem nhận xét.",
    url: "/journal/missions",
  });

  return NextResponse.json({ ok: true });
}
