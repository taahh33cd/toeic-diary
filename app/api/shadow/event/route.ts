import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logShadowEvent } from "@/lib/shadow/progress";

/**
 * POST { type, lessonId, sentenceId?, metadata? } — sự kiện đo lường từ trình duyệt.
 * Chỉ nhận shadow_open / shadow_record; sentence_done và lesson_done do server ghi
 * lúc tính tiến độ, để không đếm trùng.
 */
const CLIENT_TYPES = new Set(["shadow_open", "shadow_record"] as const);
type ClientType = "shadow_open" | "shadow_record";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { type?: unknown; lessonId?: unknown; sentenceId?: unknown; metadata?: unknown }
    | null;
  const type = body?.type as ClientType;
  const lessonId = typeof body?.lessonId === "string" ? body.lessonId : "";
  if (!CLIENT_TYPES.has(type) || !lessonId) return NextResponse.json({ error: "invalid event" }, { status: 400 });

  const sentenceId = typeof body?.sentenceId === "string" ? body.sentenceId : null;
  const raw = body?.metadata;
  const metadata =
    raw && typeof raw === "object" && !Array.isArray(raw) && JSON.stringify(raw).length <= 1000
      ? (raw as Record<string, unknown>)
      : undefined;

  try {
    await logShadowEvent(user.id, type, lessonId, sentenceId, metadata);
  } catch {
    // Profile chưa có (FK) — bỏ qua, sự kiện đo lường không được làm hỏng trải nghiệm.
  }
  return NextResponse.json({ ok: true });
}
