import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

const MAX_LEN = 4000;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.pictureNote.findMany({
    where: { userId: user.id },
    select: { itemId: true, step1: true, step2: true, step3: true },
  });

  const byItem: Record<string, { step1: string; step2: string; step3: string }> = {};
  for (const n of notes) byItem[n.itemId] = { step1: n.step1, step2: n.step2, step3: n.step3 };

  return NextResponse.json(byItem);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    itemId?: string;
    step1?: string;
    step2?: string;
    step3?: string;
  };

  if (!body.itemId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const steps = {
    step1: (body.step1 ?? "").slice(0, MAX_LEN),
    step2: (body.step2 ?? "").slice(0, MAX_LEN),
    step3: (body.step3 ?? "").slice(0, MAX_LEN),
  };

  await prisma.pictureNote.upsert({
    where: { userId_itemId: { userId: user.id, itemId: body.itemId } },
    create: { userId: user.id, itemId: body.itemId, ...steps },
    update: steps,
  });

  return NextResponse.json({ ok: true });
}
