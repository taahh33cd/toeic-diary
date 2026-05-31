import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { id } = await params;

  const passage = await prisma.readingPassage.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!passage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(passage);
}
