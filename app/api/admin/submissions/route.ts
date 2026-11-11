import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  skill: string;
  unit: string;
  title: string;
  status: string;
  band: number | null;
  submitted_at: Date | null;
  graded_at: Date | null;
  by_ai: boolean | null;
  profile_id: string | null;
  display_name: string | null;
  student_code: string | null;
};

/**
 * Hàng chờ chấm cho giáo viên: mặc định bài đã gửi, cũ nhất lên trước.
 *
 * Cả ba tab đều xếp theo NGÀY NỘP (không phải ngày chấm) để thứ tự khớp với
 * cách giáo viên nhớ bài — "bài em nộp hôm thứ 5". `order` cho đổi chiều.
 *
 * Viết bằng SQL thẳng vì phải phân biệt bài AI chấm với bài thầy chấm qua
 * `feedback->>'by'`, mà bài chấm từ trước khi có AI không có khoá đó: lọc bằng
 * JSON filter của Prisma thì `NOT (NULL = 'ai')` ra NULL và những bài cũ đó
 * biến mất khỏi tab của thầy. `coalesce` dưới đây xử lý đúng trường hợp ấy.
 */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const status = req.nextUrl.searchParams.get("status") ?? "submitted";
  const desc = req.nextUrl.searchParams.get("order") === "desc";

  const where =
    status === "ai"
      ? Prisma.sql`s.status = 'graded' AND s.feedback->>'by' = 'ai'`
      : status === "graded"
        ? Prisma.sql`s.status = 'graded' AND coalesce(s.feedback->>'by', 'teacher') <> 'ai'`
        : status === "all"
          ? Prisma.sql`s.status IN ('submitted', 'graded')`
          : Prisma.sql`s.status = 'submitted'`;

  // nulls last ở cả hai chiều — bản nộp hỏng thiếu submitted_at không chen lên đầu.
  const order = desc
    ? Prisma.sql`s.submitted_at DESC NULLS LAST`
    : Prisma.sql`s.submitted_at ASC NULLS LAST`;

  try {
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT s.id, s.skill, s.unit, s.title, s.status, s.band,
             s.submitted_at, s.graded_at,
             (s.feedback->>'by' = 'ai') AS by_ai,
             p.id AS profile_id, p.display_name, p.student_code
        FROM skill_submissions s
        LEFT JOIN profiles p ON p.id = s.user_id
       WHERE ${where}
       ORDER BY ${order}
       LIMIT 200`;

    const submissions = rows.map((r) => ({
      id: r.id,
      skill: r.skill,
      unit: r.unit,
      title: r.title,
      status: r.status,
      band: r.band,
      submittedAt: r.submitted_at,
      gradedAt: r.graded_at,
      // Bài "chờ chấm" mà đã có nhận xét của AI = học viên xin thầy chấm lại.
      byAi: r.by_ai === true,
      profile: r.profile_id
        ? { id: r.profile_id, displayName: r.display_name, studentCode: r.student_code }
        : null,
    }));

    return NextResponse.json({ submissions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/submissions GET]", msg);
    return NextResponse.json({ error: `Lỗi máy chủ: ${msg}` }, { status: 500 });
  }
}
