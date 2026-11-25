import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { syncHomeworkAutoDone, syncManyAutoDone } from "@/lib/homework/auto-done";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/homework/auto-done — đánh dấu xong các mục BTVN lấy từ kho bài
 * mà học viên đã làm thật.
 *
 *   - Học viên: không cần body, chỉ đối chiếu BTVN của chính mình.
 *   - Giáo viên: `{ codes: [...] }` để đối chiếu cả lớp khi mở trang lớp/HV,
 *     cho tiến độ giáo viên thấy là tiến độ thật.
 */

const Body = z.object({ codes: z.array(z.string().trim().min(1).max(40)).max(80).optional() });

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const role = (user.app_metadata?.role as string | undefined) ?? "student";
  const codes = parsed.data.codes;

  try {
    if (codes?.length) {
      if (role !== "admin" && role !== "teacher") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const profiles = await prisma.profile.findMany({
        where: { studentCode: { in: [...new Set(codes)] } },
        select: { id: true, studentCode: true },
      });
      const ticked = await syncManyAutoDone(
        profiles.map((p) => ({ code: p.studentCode!, userId: p.id })),
      );
      return NextResponse.json({ ticked });
    }

    const me = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { studentCode: true },
    });
    if (!me?.studentCode) return NextResponse.json({ ticked: 0 });
    const ticked = await syncHomeworkAutoDone(me.studentCode, user.id);
    return NextResponse.json({ ticked });
  } catch (e) {
    console.error("[homework/auto-done]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
