import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { sendPushToAdminSubs } from "@/lib/push";

let _pool: pg.Pool | null = null;
function getPool() {
  if (!_pool) _pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}
function getPrisma() {
  return new PrismaClient({ adapter: new PrismaPg(getPool()) });
}

/**
 * POST /api/invite/accept
 * Body: { token: string }
 * Auth: any logged-in user (they accept the invite for themselves)
 * Returns: { ok: true; studentCode: string | null }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { token?: string };
    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const prisma = getPrisma();

    const invite = await prisma.teacherInvite.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.usedAt) {
      return NextResponse.json({ error: "Invite already used" }, { status: 409 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    const now = new Date();

    // Upsert profile — link studentCode + teacher
    await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        role: invite.role,
        studentCode: invite.studentCode,
        teacherId: invite.teacherId,
        invitedBy: invite.teacherId,
        invitedAt: invite.createdAt,
        acceptedAt: now,
        displayName: user.email ?? null,
      },
      update: {
        role: invite.role,
        studentCode: invite.studentCode ?? undefined,
        teacherId: invite.teacherId,
        invitedBy: invite.teacherId,
        invitedAt: invite.createdAt,
        acceptedAt: now,
      },
    });

    // Mark invite as used
    await prisma.teacherInvite.update({
      where: { token },
      data: { usedAt: now },
    });

    sendPushToAdminSubs({
      title: "🎓 Học viên mới vừa tham gia!",
      body: invite.studentCode
        ? `Mã HV: ${invite.studentCode} — ${invite.email}`
        : invite.email,
      url: "/admin/students",
    }).catch(() => {});

    return NextResponse.json({ ok: true, studentCode: invite.studentCode });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[invite/accept]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
