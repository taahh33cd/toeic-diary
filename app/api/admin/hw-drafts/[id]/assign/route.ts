import { NextResponse } from "next/server";

import { requireGrader } from "@/lib/submissions/guard";
import { assignDraft } from "@/lib/homework/drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — giao ngay một nháp cho lớp/HV của nó. */
export async function POST(_req: Request, ctx: RouteContext<"/api/admin/hw-drafts/[id]/assign">) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  try {
    const r = await assignDraft(id, gate.user!.id);
    return NextResponse.json({ ok: true, students: r.students });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[hw-drafts assign]", id, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
