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

    // Verify user owns a studentCode and has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, student_code, enrolled_courses")
      .eq("id", user.id)
      .single<{ role: string; student_code: string | null; enrolled_courses: number[] | null }>();

    const isPrivileged = profile?.role === "teacher" || profile?.role === "admin";
    const studentCode = profile?.student_code;

    if (!isPrivileged) {
      if (!studentCode || (profile?.enrolled_courses ?? []).length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const frozen = await getAdminDb().ref(`students/${studentCode}/frozen`).get();
      if (frozen.val() === true) {
        return NextResponse.json({ error: "Account frozen" }, { status: 403 });
      }
    }

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
