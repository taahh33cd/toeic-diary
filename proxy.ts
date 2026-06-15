import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/test", "/vocabulary", "/progress"];

function isAdminRole(role?: string) {
  return role === "admin" || role === "teacher";
}

function roleHome(role?: string) {
  return isAdminRole(role) ? "/admin" : "/journal";
}

const STUDENT_URL =
  process.env.NEXT_PUBLIC_STUDENT_URL ?? 'https://toeic-dictation-diary.vercel.app'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Domain separation ─────────────────────────────────────────────────────────
  if (process.env.SITE_MODE === 'admin') {
    // Admin-only site: only /admin, /auth, /api, /invite allowed
    const allowed =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/invite')
    if (!allowed) return NextResponse.redirect(STUDENT_URL + pathname)
  } else if (pathname.startsWith('/admin')) {
    // Student site: hide /admin completely (404, don't reveal it exists)
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.app_metadata?.role as string | undefined);
  const { pathname } = request.nextUrl;

  function redirectTo(dest: string) {
    const url = request.nextUrl.clone();
    url.pathname = dest;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ── Root "/" ─────────────────────────────────────────────────────────────────
  if (pathname === "/") {
    if (!user) return redirectTo("/home");
    return redirectTo(roleHome(role));
  }

  // ── Auth pages: redirect logged-in users to their home ───────────────────────
  if (pathname === "/auth/login" || pathname === "/auth/register") {
    if (user) return redirectTo(roleHome(role));
    return supabaseResponse;
  }

  // ── Admin routes ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!isAdminRole(role)) return redirectTo("/journal");
    return supabaseResponse;
  }

  // ── Student journal routes ───────────────────────────────────────────────────
  if (pathname.startsWith("/journal")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (isAdminRole(role)) return redirectTo("/admin");
    return supabaseResponse;
  }

  // ── Other protected routes (test, vocabulary, progress) ─────────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // ── Admin logged in → redirect away from any non-admin route ─────────────────
  // Allow: /auth/* (logout/OAuth), /home (public landing)
  if (user && isAdminRole(role)) {
    const isPublicForAdmin =
      pathname.startsWith("/auth/") || pathname === "/home";
    if (!isPublicForAdmin) return redirectTo("/admin");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|icon\\.png|sw\\.js|manifest\\.json|offline|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4|woff2?|ttf|eot)).*)",
  ],
};
