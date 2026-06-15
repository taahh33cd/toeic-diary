import { NextRequest, NextResponse } from 'next/server'

const STUDENT_URL =
  process.env.NEXT_PUBLIC_STUDENT_URL ?? 'https://toeic-dictation-diary.vercel.app'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (process.env.SITE_MODE === 'admin') {
    // Admin-only site: chỉ cho phép /admin/*, /auth/*, /api/*, /invite/*
    const allowed =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/invite')

    if (!allowed) {
      return NextResponse.redirect(STUDENT_URL + pathname)
    }
    return NextResponse.next()
  }

  // Student site (mặc định): ẩn hoàn toàn /admin — trả 404, không redirect
  // (không để lộ admin site tồn tại)
  if (pathname.startsWith('/admin')) {
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|manifest\\.json|sw\\.js|workbox-).*)',
  ],
}
