import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type VocabAccessReason = "ok" | "not_logged_in" | "free";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ canUse: false, reason: "not_logged_in" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, student_code")
      .eq("id", user.id)
      .single<{ role: string; student_code: string | null }>();

    if (!profile) {
      return NextResponse.json({ canUse: false, reason: "not_logged_in" });
    }

    // Teacher / admin always allowed
    if (profile.role === "teacher" || profile.role === "admin") {
      return NextResponse.json({ canUse: true, reason: "ok" });
    }

    // Student must have a student code (i.e. enrolled in at least one course)
    if (!profile.student_code) {
      return NextResponse.json({ canUse: false, reason: "free" });
    }

    return NextResponse.json({ canUse: true, reason: "ok" });
  } catch (err) {
    console.error("[vocab/access]", err);
    // Fail open — don't block legitimate users due to infra error
    return NextResponse.json({ canUse: true, reason: "ok" });
  }
}
