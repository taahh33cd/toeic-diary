import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

const VALID_THEMES = new Set([
  "warm", "dark", "forest", "ocean",
  "rose", "lavender", "butter", "mint",
]);

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { theme?: string } | null;
  if (!body?.theme || !VALID_THEMES.has(body.theme)) {
    return NextResponse.json({ error: "invalid theme" }, { status: 400 });
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { journalTheme: body.theme },
  });

  return NextResponse.json({ ok: true, theme: body.theme });
}
