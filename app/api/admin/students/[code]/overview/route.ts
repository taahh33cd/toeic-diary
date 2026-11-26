import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { estimateFromTotals } from "@/lib/journal/results-math";
import { vnDate } from "@/lib/part-goals/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface StudentOverview {
  /** null = HV chưa đăng nhập lần nào (chưa có tài khoản gắn mã). */
  account: {
    lastActiveDate: string | null; // YYYY-MM-DD giờ VN
    currentStreak: number;
    level: number;
    totalXp: number;
  } | null;
  /** Thi thử trọn đề (mode real, có điểm 990), mới nhất trước, tối đa 8 bài. */
  mocks: { total: number; date: string }[];
  estimate: { value: number; n: number } | null;
  /** Bài Speaking/Writing HV đã nộp, đang chờ chấm. */
  pendingGrading: number;
}

/** GET /api/admin/students/{code}/overview — số liệu Postgres cho trang chi tiết HV. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { code } = await ctx.params;

  const profile = await prisma.profile.findUnique({
    where: { studentCode: code },
    select: { id: true, lastActiveDate: true, currentStreak: true, level: true, totalXp: true },
  });
  if (!profile) {
    const empty: StudentOverview = { account: null, mocks: [], estimate: null, pendingGrading: 0 };
    return NextResponse.json(empty);
  }

  const [fulls, pendingGrading] = await Promise.all([
    prisma.fullTestAttempt.findMany({
      where: { userId: profile.id, status: "done", total: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: { total: true, config: true, completedAt: true, updatedAt: true },
    }),
    prisma.skillSubmission.count({ where: { userId: profile.id, status: "submitted" } }),
  ]);

  // Cùng quy tắc với bảng Kết quả HV: chỉ bài thi thử chế độ "real" mới tính điểm 990.
  const mocks = fulls
    .filter((f) => (f.config as { mode?: string } | null)?.mode === "real" && f.total !== null)
    .slice(0, 8)
    .map((f) => ({ total: f.total!, date: vnDate(f.completedAt ?? f.updatedAt) }));

  const body: StudentOverview = {
    account: {
      lastActiveDate: profile.lastActiveDate ? vnDate(profile.lastActiveDate) : null,
      currentStreak: profile.currentStreak,
      level: profile.level,
      totalXp: profile.totalXp,
    },
    mocks,
    estimate: estimateFromTotals(mocks.map((m) => m.total)),
    pendingGrading,
  };
  return NextResponse.json(body);
}
