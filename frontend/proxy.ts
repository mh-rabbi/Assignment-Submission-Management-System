// proxy.ts — Next.js 16 auth guard (formerly middleware.ts)
// Exported function must be named "proxy" (not middleware or default)
// Runtime: Node.js (default in Next.js 16)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken, isTokenExpired } from "@/lib/auth";
import type { Role } from "@/types/api";

const ROLE_PATHS: Record<Role, string> = {
  Admin: "/admin",
  Teacher: "/teacher",
  Student: "/student",
};

const PROTECTED_PREFIXES = ["/admin", "/teacher", "/student"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // Read auth cookie
  const token = request.cookies.get("auth_token")?.value;

  // No token → redirect to /login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Expired token → redirect to /login
  if (isTokenExpired(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("auth_token");
    res.cookies.delete("user_info");
    return res;
  }

  // Decode token for role check
  const user = decodeToken(token);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role/path mismatch → redirect to the user's own dashboard
  const expectedPrefix = ROLE_PATHS[user.role];
  if (!pathname.startsWith(expectedPrefix)) {
    return NextResponse.redirect(new URL(expectedPrefix, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files, images, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|public/|api/).*)",
  ],
};
