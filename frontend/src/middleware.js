import { NextResponse } from 'next/server';

// Server-Side Edge Guard for Hertzsoft ERP
export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protect private application routes
  if (!token && pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware only to protected application routes
export const config = {
  matcher: [
    '/',
    '/leads/:path*',
    '/projects/:path*',
    '/certificates/:path*'
  ]
};
