import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";

export const dynamic = "force-dynamic";

/**
 * Hàng chờ chấm cho giáo viên: mặc định bài đã gửi, cũ nhất lên trước.
 *
 * Cả hai tab đều xếp theo NGÀY NỘP (không phải ngày chấm) để thứ tự khớp với
 * cách giáo viên nhớ bài — "bài em nộp hôm thứ 5". `order` cho đổi chiều.
 */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const status = req.nextUrl.searchParams.get("status") ?? "submitted";
  const order = req.nextUrl.searchParams.get("order") === "desc" ? "desc" : "asc";

  try {
    const submissions = await prisma.skillSubmission.findMany({
      where: status === "all" ? { status: { in: ["submitted", "graded"] } } : { status },
      // nulls: "last" — bản nộp hỏng thiếu submittedAt không chen lên đầu khi đảo chiều.
      orderBy: { submittedAt: { sort: order, nulls: "last" } },
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/submissions GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
