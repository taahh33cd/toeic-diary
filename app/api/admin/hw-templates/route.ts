import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireGrader } from "@/lib/submissions/guard";
import { ContentSchema, contentOf, toJson } from "@/lib/homework/content";

export const dynamic = "force-dynamic";

/** GET — mọi mẫu BTVN (dùng chung giữa các giáo viên), mới sửa lên đầu. */
export async function GET() {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const templates = await prisma.hwTemplate.findMany({ orderBy: { updatedAt: "desc" }, take: 300 });
  return NextResponse.json({ templates });
}

const Body = z.object({ title: z.string().trim().min(1).max(200), content: ContentSchema });

/** POST — lưu một mẫu mới. */
export async function POST(req: Request) {
  const gate = await requireGrader();
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const t = await prisma.hwTemplate.create({
    data: { ownerId: gate.user!.id, title: parsed.data.title, content: toJson(contentOf(parsed.data.content)) },
  });
  return NextResponse.json({ template: t }, { status: 201 });
}
