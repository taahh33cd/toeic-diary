import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user actually owns this studentCode
    const { data: profile } = await supabase
      .from("profiles")
      .select("student_code")
      .eq("id", user.id)
      .single<{ student_code: string | null }>();

    const studentCode = profile?.student_code;
    if (!studentCode) {
      return NextResponse.json({ error: "No student code" }, { status: 403 });
    }

    const body = await req.json() as {
      word: string;
      vi?: string;
      ipa?: string;
      pos?: string;
      def?: string;
      example?: string;
      part: number;
      addedDate: string;
      repCount: number;
    };

    const id = `v${Date.now()}`;
    const entry = {
      word: body.word,
      part: body.part,
      addedDate: body.addedDate,
      repCount: body.repCount ?? 0,
      ...(body.vi      ? { vi: body.vi }           : {}),
      ...(body.ipa     ? { ipa: body.ipa }         : {}),
      ...(body.pos     ? { pos: body.pos }         : {}),
      ...(body.def     ? { def: body.def }         : {}),
      ...(body.example ? { example: body.example } : {}),
    };

    await getAdminDb().ref(`vocab/${studentCode}/${id}`).set(entry);

    return NextResponse.json({ id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[vocab/save]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
