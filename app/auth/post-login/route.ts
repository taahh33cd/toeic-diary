import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const role = (user.app_metadata?.role as string | undefined) ?? "student";
  const target = role === "teacher" || role === "admin" ? "/admin" : "/journal";
  return NextResponse.redirect(new URL(target, request.url));
}
