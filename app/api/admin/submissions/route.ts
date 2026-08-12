import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";

export const dynamic = "force-dynamic";

/** Hàng chờ chấm cho giáo viên: mặc định bài đã gửi, cũ nhất lên trước. */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const status = req.nextUrl.searchParams.get("status") ?? "submitted";

  const submissions = await prisma.skillSubmission.findMany({
    where: status === "all" ? { status: { in: ["submitted", "graded"] } } : { status },
    orderBy: status === "graded" ? { gradedAt: "desc" } : { submittedAt: "asc" },
    take: 200,
    select: {
      id: true,
      skill: true,
      unit: true,
      title: true,
      status: true,
      band: true,
      submittedAt: true,
      gradedAt: true,
      profile: { select: { id: true, displayName: true, studentCode: true } },
    },
  });

  return NextResponse.json({ submissions });
}
