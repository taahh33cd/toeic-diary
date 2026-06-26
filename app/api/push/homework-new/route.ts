import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

/**
 * POST /api/push/homework-new
 * Called by the admin homework form right after pushHomework() writes to Firebase.
 * Body: { studentCode: string; hwTitle?: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as
    | { studentCode?: string; hwTitle?: string }
    | null;

  if (!body?.studentCode) {
    return NextResponse.json({ error: "missing studentCode" }, { status: 400 });
  }

  const profile = await prisma.profile.findFirst({
    where: { studentCode: body.studentCode },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ ok: true, skipped: "no profile" });
  }

  await sendPushToUser(profile.id, {
    title: "📚 Bài tập mới từ thầy!",
    body: body.hwTitle
      ? `Thầy vừa giao: ${body.hwTitle}. Kiểm tra ngay nhé!`
      : "Thầy vừa giao bài tập mới. Vào journal để xem chi tiết!",
    url: "/journal",
  });

  return NextResponse.json({ ok: true });
}
