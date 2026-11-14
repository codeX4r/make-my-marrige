import { NextResponse, type NextRequest } from "next/server";
import {
  isPublicPathname,
  normalizePathname,
  buildLoginRedirectUrl,
} from "./lib/route-protection";

const AUTH_COOKIE_NAMES = [
  "mmm_access",
  "mmm_refresh",
  "__Host-mmm_access",
  "__Host-mmm_refresh",
] as const;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const normalized = normalizePathname(pathname);

  // Backward-compatible redirects: /auth/login -> /auth?tab=login
  if (normalized === "/auth/login") {
    const url = new URL("/auth", request.url);
    url.search = search;
    url.searchParams.set("tab", "login");
    return NextResponse.redirect(url, { status: 307 });
  }

  // Backward-compatible redirects: /auth/register -> /auth?tab=register
  if (normalized === "/auth/register") {
    const url = new URL("/auth", request.url);
    url.search = search;
    url.searchParams.set("tab", "register");
    return NextResponse.redirect(url, { status: 307 });
  }

  // Public routes: allow without authentication check
  if (isPublicPathname(normalized)) {
    return NextResponse.next();
  }

  // Protected routes: check for presence of authentication cookie
  const hasAuthCookie = AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name));

  if (!hasAuthCookie) {
    const destination = `${pathname}${search}`;
    const redirectUrl = buildLoginRedirectUrl(destination, request.url);
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/ (BFF API routes, which manage their own security policies)
     * - _next/static (static build files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets with extensions (.svg, .png, .jpg, etc.)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
