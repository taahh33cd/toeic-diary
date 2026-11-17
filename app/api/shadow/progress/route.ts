import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { getShadowLessonState, recordShadowSentence } from "@/lib/shadow/progress";
import { syncRoadmapAfterAttempt } from "@/lib/roadmap/hook";

/** GET ?lessonId= — câu đã đạt, bài đã xong chưa, số câu hôm nay. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const lessonId = request.nextUrl.searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "missing lessonId" }, { status: 400 });
  return NextResponse.json(await getShadowLessonState(user.id, lessonId));
}

/** POST { lessonId, sentenceId, starIds } — ghi một câu đạt (đã qua kiểm tra giọng trên trình duyệt). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { lessonId?: unknown; sentenceId?: unknown; starIds?: unknown }
    | null;
  const lessonId = typeof body?.lessonId === "string" ? body.lessonId : "";
  const sentenceId = typeof body?.sentenceId === "string" ? body.sentenceId : "";
  const starIds = Array.isArray(body?.starIds) ? body.starIds.filter((x): x is string => typeof x === "string") : [];
  if (!lessonId || !sentenceId) return NextResponse.json({ error: "missing ids" }, { status: 400 });

  await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, displayName: user.email?.split("@")[0] ?? null },
    update: {},
  });

  const result = await recordShadowSentence(user.id, { lessonId, sentenceId, starIds });
  if (!result) return NextResponse.json({ error: "sentence not in lesson" }, { status: 400 });
  // Việc lộ trình "Shadow N câu Part X" tự tích ngay khi đủ câu.
  if (result.counted) await syncRoadmapAfterAttempt(user.id);
  return NextResponse.json(result);
}
