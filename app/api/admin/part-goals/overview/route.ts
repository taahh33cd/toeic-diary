import { NextResponse, type NextRequest } from "next/server";
import { requireGrader } from "@/lib/submissions/guard";
import { loadGoalsForMonths, loadRoster, reminderMonths } from "@/lib/part-goals/admin";
import { MONTH_RE, shiftMonth } from "@/lib/part-goals/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/part-goals/overview?month=YYYY-MM
 * Danh sách HV + mục tiêu tổng + mục tiêu part của tháng đó và tháng trước (để chép).
 */
export async function GET(req: NextRequest) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const month = req.nextUrl.searchParams.get("month") ?? reminderMonths().at(-1)!;
  if (!MONTH_RE.test(month)) return NextResponse.json({ error: "Tháng không hợp lệ" }, { status: 400 });
  const prev = shiftMonth(month, -1);
  const [roster, goals] = await Promise.all([loadRoster(true), loadGoalsForMonths([month, prev])]);
  return NextResponse.json({ month, roster, goals: goals[month], prevGoals: goals[prev] });
}
