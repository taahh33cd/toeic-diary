import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (!["single", "double", "triple"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const passages = await prisma.readingPassage.findMany({
    where: { type },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      type: true,
      category: true,
      orderIndex: true,
      _count: { select: { questions: true } },
    },
  });

  return NextResponse.json(passages);
}
