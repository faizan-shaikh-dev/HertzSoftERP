import { NextResponse } from 'next/server';

// Server-Side Edge Guard for Hertzsoft ERP
export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/login';

  // 1. If unauthenticated user tries to access protected pages -> redirect to /login
  if (!token && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and tries to access /login -> redirect to home dashboard
  if (token && isLoginPage) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// Apply middleware to application routes (exclude static files, assets, and APIs)
export const config = {
  matcher: [
    '/',
    '/login',
    '/leads/:path*',
    '/projects/:path*',
    '/certificates/:path*'
  ]
};
