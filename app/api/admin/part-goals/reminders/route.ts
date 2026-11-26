import { NextResponse } from "next/server";
import { requireGrader } from "@/lib/submissions/guard";
import { loadReminders } from "@/lib/part-goals/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/part-goals/reminders — HV còn thiếu mục tiêu (popup + badge menu admin). */
export async function GET() {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  try {
    return NextResponse.json(await loadReminders());
  } catch (e) {
    console.error("[part-goals reminders]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Không tải được" }, { status: 500 });
  }
}
