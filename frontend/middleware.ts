import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromToken } from '@/lib/auth/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAdminPage = pathname.startsWith('/admin');

  if ((isDashboardPage || isAdminPage) && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminPage && accessToken) {
    const session = getSessionFromToken(accessToken);

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isDashboardPage && accessToken) {
    const session = getSessionFromToken(accessToken);

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (isAuthPage && accessToken) {
    const session = getSessionFromToken(accessToken);

    if (session) {
      const destination = session.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
