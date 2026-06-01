import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { isUsageExempt, FREE_LIMIT_SECONDS } from "@/lib/access";

export const dynamic = "force-dynamic";

// Max delta accepted per request — prevents runaway increments
const MAX_DELTA = 600;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let delta = 0;
  try {
    const body = await req.json();
    if (typeof body.delta === "number" && body.delta > 0) {
      delta = Math.min(Math.floor(body.delta), MAX_DELTA);
    }
  } catch {
    // sendBeacon might send empty body on unload — treat as delta=0 (just fetch current)
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      freeUsageSeconds: true,
      role: true,
      studentCode: true,
      enrolledCourses: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Exempt users: don't accumulate, always unlocked
  if (isUsageExempt(profile)) {
    return NextResponse.json({ total: 0, locked: false, exempt: true });
  }

  if (delta === 0) {
    // Just a read — return current state without writing
    const total = profile.freeUsageSeconds;
    return NextResponse.json({ total, locked: total >= FREE_LIMIT_SECONDS });
  }

  const updated = await prisma.profile.update({
    where: { id: user.id },
    data: { freeUsageSeconds: { increment: delta } },
    select: { freeUsageSeconds: true },
  });

  return NextResponse.json({
    total: updated.freeUsageSeconds,
    locked: updated.freeUsageSeconds >= FREE_LIMIT_SECONDS,
  });
}
