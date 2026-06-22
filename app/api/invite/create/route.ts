import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { randomBytes } from "crypto";

let _pool: pg.Pool | null = null;
function getPool() {
  if (!_pool) _pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}
function getPrisma() {
  return new PrismaClient({ adapter: new PrismaPg(getPool()) });
}

/**
 * POST /api/invite/create
 * Body: { email: string; studentCode?: string }
 * Auth: teacher or admin only (checked via app_metadata.role)
 * Returns: { token, inviteUrl }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (user.app_metadata?.role as string) ?? "student";
    if (role !== "teacher" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as { email?: string; studentCode?: string };
    const email = body.email?.trim().toLowerCase();
    const studentCode = body.studentCode?.trim() || null;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const token = randomBytes(24).toString("hex"); // 48-char hex token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const prisma = getPrisma();

    // Ensure teacher profile exists
    await prisma.profile.upsert({
      where: { id: user.id },
      create: { id: user.id, role, displayName: user.email ?? null },
      update: {},
    });

    const invite = await prisma.teacherInvite.create({
      data: {
        email,
        studentCode,
        teacherId: user.id,
        token,
        role: "student",
        expiresAt,
      },
    });

    const studentBase =
      process.env.NEXT_PUBLIC_STUDENT_URL ??
      req.headers.get("origin") ??
      `https://${req.headers.get("host")}`;
    const inviteUrl = `${studentBase}/invite/${invite.token}`;

    return NextResponse.json({ token: invite.token, inviteUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[invite/create]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
