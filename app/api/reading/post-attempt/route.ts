import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { passageId?: string; score?: number; details?: Record<string, number> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { passageId, score, details } = body;
  if (!passageId || score == null) {
    return NextResponse.json({ error: "Missing passageId or score" }, { status: 400 });
  }
  if (score < 0 || score > 100) {
    return NextResponse.json({ error: "Score out of range" }, { status: 400 });
  }

  try {
    await prisma.postReadingAttempt.create({
      data: {
        userId:    user.id,
        passageId,
        score,
        details:   details ?? {},
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[post-attempt]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

/** GET: best post-reading score for a passage */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const passageId = req.nextUrl.searchParams.get("passageId");
  if (!passageId) return NextResponse.json({ score: null });

  const best = await prisma.postReadingAttempt.findFirst({
    where: { userId: user.id, passageId },
    orderBy: { score: "desc" },
    select: { score: true, details: true },
  });

  return NextResponse.json(best ?? { score: null });
}
