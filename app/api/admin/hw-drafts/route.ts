import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { refreshDrafts } from "@/lib/homework/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/admin/hw-drafts?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Làm mới nháp từ giáo trình trước, rồi trả nháp trong khoảng ngày (theo ngày giao).
 */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!DAY.test(from) || !DAY.test(to)) return NextResponse.json({ error: "Thiếu khoảng ngày" }, { status: 400 });

  await refreshDrafts().catch((e) => console.error("[hw-drafts GET refresh]", e instanceof Error ? e.message : e));

  const drafts = await prisma.hwDraft.findMany({
    where: { date: { gte: from, lte: to }, run: { status: "active" } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      run: {
        select: {
          id: true,
          targetType: true,
          targetId: true,
          targetLabel: true,
          autoAssign: true,
          curriculum: { select: { id: true, title: true } },
        },
      },
    },
  });
  return NextResponse.json({ drafts });
}
