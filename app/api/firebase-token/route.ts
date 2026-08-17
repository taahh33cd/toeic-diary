import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

/**
 * POST /api/firebase-token
 *
 * Exchanges a valid Supabase session for a Firebase Custom Token.
 * The Custom Token carries role + studentCode + teacherId as claims
 * so Firebase Security Rules can check them later (Phase 4).
 *
 * Flow:
 *   1. Verify Supabase session (cookie-based, server-side)
 *   2. Fetch Profile from DB to get role/studentCode/teacherId
 *   3. Create Firebase Custom Token (uid = Supabase user.id)
 *   4. Return { token }
 */

// Lazy singleton pool — reused across requests in the same process
let _pool: pg.Pool | null = null;
function getPool() {
  if (!_pool) {
    _pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

function getPrisma() {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({ adapter });
}

/**
 * Quyền nằm ở HAI nơi: `app_metadata.role` của Supabase Auth (thứ cả app dùng để
 * gác cổng /admin) và `profiles.role` trong Postgres. Khi hai nơi lệch nhau, lấy
 * quyền CAO HƠN — nếu không, một bản ghi profile cũ sẽ âm thầm hạ quyền admin
 * xuống student và Firebase Rules chặn hết dữ liệu học viên (đã xảy ra 16/08/2026).
 */
const ROLE_RANK: Record<string, number> = { student: 0, teacher: 1, admin: 2 };

function highestRole(a: string | undefined, b: string | undefined): string {
  const ra = ROLE_RANK[a ?? ""] ?? 0;
  const rb = ROLE_RANK[b ?? ""] ?? 0;
  return ra >= rb ? (a ?? "student") : (b ?? "student");
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Supabase session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch profile for claims (fallback to app_metadata if DB unavailable)
    let role = (user.app_metadata?.role as string | undefined) ?? "student";
    let studentCode: string | null = null;
    let teacherId: string | null = null;

    if (process.env.DATABASE_URL) {
      try {
        const prisma = getPrisma();
        const profile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { role: true, studentCode: true, teacherId: true },
        });
        if (profile) {
          role = highestRole(role, profile.role ?? undefined);
          studentCode = profile.studentCode ?? null;
          teacherId = profile.teacherId ?? null;
        }
      } catch (dbErr) {
        console.warn("[firebase-token] DB unavailable, using app_metadata:", dbErr);
      }
    }

    // 3. Create Firebase Custom Token
    const adminAuth = getAdminAuth();
    const claims: Record<string, string | null> = { role, studentCode, teacherId };

    // Firebase custom token uid must be Supabase user id
    const firebaseToken = await adminAuth.createCustomToken(user.id, claims);

    return NextResponse.json({ token: firebaseToken });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[firebase-token]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
