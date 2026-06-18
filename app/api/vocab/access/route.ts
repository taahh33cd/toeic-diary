import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export type VocabAccessReason = "ok" | "not_logged_in" | "free" | "frozen";

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
      .select("role, student_code, enrolled_courses")
      .eq("id", user.id)
      .single<{ role: string; student_code: string | null; enrolled_courses: number[] | null }>();

    if (!profile) {
      return NextResponse.json({ canUse: false, reason: "not_logged_in" });
    }

    // Teacher / admin always allowed
    if (profile.role === "teacher" || profile.role === "admin") {
      return NextResponse.json({ canUse: true, reason: "ok" });
    }

    // Student must have a code and at least one enrolled course (0–3)
    const courses = profile.enrolled_courses ?? [];
    if (!profile.student_code || courses.length === 0) {
      return NextResponse.json({ canUse: false, reason: "free" });
    }

    // Check frozen flag in Firebase
    const snap = await getAdminDb()
      .ref(`students/${profile.student_code}/frozen`)
      .get();

    if (snap.val() === true) {
      return NextResponse.json({ canUse: false, reason: "frozen" });
    }

    return NextResponse.json({ canUse: true, reason: "ok" });
  } catch (err) {
    console.error("[vocab/access]", err);
    // Fail open — don't block legitimate users due to infra error
    return NextResponse.json({ canUse: true, reason: "ok" });
  }
}
