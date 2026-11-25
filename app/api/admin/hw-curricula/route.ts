import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { parseLessons } from "@/lib/homework/drafts";

export const dynamic = "force-dynamic";

/** GET — danh sách giáo trình kèm số buổi và các lớp/HV đang dùng. */
export async function GET() {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const rows = await prisma.hwCurriculum.findMany({
    orderBy: { updatedAt: "desc" },
    include: { runs: { where: { status: "active" }, select: { id: true, targetLabel: true } } },
  });
  return NextResponse.json({
    curricula: rows.map((c) => ({
      id: c.id,
      title: c.title,
      lessonCount: parseLessons(c.lessons).length,
      runs: c.runs,
      updatedAt: c.updatedAt,
    })),
  });
}

const Body = z.object({ title: z.string().trim().min(1).max(200) });

export async function POST(req: Request) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thiếu tên giáo trình" }, { status: 400 });
  const c = await prisma.hwCurriculum.create({
    data: { ownerId: gate.user!.id, title: parsed.data.title, lessons: [] },
  });
  return NextResponse.json({ id: c.id }, { status: 201 });
}
