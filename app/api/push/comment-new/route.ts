import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { sendPushToUser } from "@/lib/push";

export const runtime = "nodejs";

/**
 * POST /api/push/comment-new
 * Called by the teacher's student detail page after pushComment() writes to Firebase.
 * Body: { studentCode: string; comment: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "teacher")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as
    | { studentCode?: string; comment?: string }
    | null;

  if (!body?.studentCode) {
    return NextResponse.json({ error: "missing studentCode" }, { status: 400 });
  }

  const profile = await prisma.profile.findFirst({
    where: { studentCode: body.studentCode },
    select: { id: true },
  });

  if (!profile) return NextResponse.json({ ok: true, skipped: "no profile" });

  const preview = body.comment ? body.comment.slice(0, 80) : "Thầy vừa để lại nhận xét cho bạn.";

  await sendPushToUser(profile.id, {
    title: "💬 Thầy Hiếu đã nhận xét",
    body: preview,
    url: "/journal",
  });

  return NextResponse.json({ ok: true });
}
