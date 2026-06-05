import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isAdmin(role?: string) {
  return role === "admin" || role === "teacher";
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add code between createServerClient and getUser().
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role as string | undefined;
  const { pathname } = request.nextUrl;

  // ── Root "/" ────────────────────────────────────────────────────────────────
  if (pathname === "/") {
    if (!user) return redirectTo(request, "/home");
    return redirectTo(request, isAdmin(role) ? "/admin" : "/journal");
  }

  // ── Admin routes ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) return redirectTo(request, "/auth/login");
    if (!isAdmin(role)) return redirectTo(request, "/journal");
    return supabaseResponse;
  }

  // ── Student journal routes ───────────────────────────────────────────────────
  if (pathname.startsWith("/journal")) {
    if (isAdmin(role)) return redirectTo(request, "/admin");
    return supabaseResponse;
  }

  // ── Admin đang logged in truy cập bất kỳ route nào khác → về /admin ─────────
  // Cho phép /auth/* (logout, OAuth callbacks) và /home (public)
  if (user && isAdmin(role)) {
    const isPublicForAdmin =
      pathname.startsWith("/auth/") ||
      pathname === "/home";
    if (!isPublicForAdmin) return redirectTo(request, "/admin");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match tất cả request paths trừ:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - api/ (API routes — không redirect)
     * - Static assets (favicon, icons, sw.js, manifest, audio/image files)
     */
    "/((?!_next/static|_next/image|api/|favicon\\.ico|icon\\.svg|icon\\.png|sw\\.js|manifest\\.json|offline|.*\\.(?:png|jpg|jpeg|gif|webp|ico|mp3|mp4|woff2?|ttf|eot)).*)",
  ],
};
