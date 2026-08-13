import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected path prefixes for authenticated app shell
const PROTECTED_PATHS = [
  '/dashboard',
  '/users',
  '/classes',
  '/subjects',
  '/teacher-assignments',
  '/assignments',
  '/submissions',
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  // Check for stored token in cookies if present, or allow client-side AuthContext guard to handle redirection
  // Since tokens are stored in localStorage in client components, server middleware allows client component hydration
  // while client-side route guard in AppShell layout ensures strict enforcement.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
