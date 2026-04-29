import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordXp, XP_RULES, type XpSource } from "@/lib/xp";

// Subset of XP sources callable from client. Server-only sources
// (dictation_lesson*, streak_*) are excluded — they fire from server actions.
const CLIENT_ALLOWED: ReadonlySet<XpSource> = new Set<XpSource>([
  "vocab_review",
  "vocab_master",
  "mission_task",
  "mission_day",
  "homework_submit",
  "test_score",
  "daily_login",
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as
    | { source?: string; metadata?: Record<string, unknown> }
    | null;
  if (!body?.source) {
    return NextResponse.json({ error: "missing source" }, { status: 400 });
  }
  const source = body.source as XpSource;
  if (!(source in XP_RULES) || !CLIENT_ALLOWED.has(source)) {
    return NextResponse.json({ error: "invalid source" }, { status: 400 });
  }

  const result = await recordXp(user.id, source, undefined, body.metadata);
  return NextResponse.json(result);
}
