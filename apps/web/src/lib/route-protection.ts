/**
 * Route protection policy rules and utilities.
 * Enforces MakeMyMarrige core routing policy:
 * - Public: '/', '/auth', and public auth workflows (/auth/verify-email, etc.)
 * - Protected: All other frontend application routes (/dashboard, /auth/profile, etc.)
 */

export const PUBLIC_EXACT_ROUTES = ["/", "/auth"] as const;

export const PUBLIC_AUTH_WORKFLOW_ROUTES = [
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
] as const;

export const LEGACY_AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
] as const;

/**
 * Normalizes a pathname: trims whitespace, removes trailing slash (unless root '/'),
 * and lowercases for uniform comparison.
 */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  let normalized = pathname.trim();
  if (normalized.endsWith("/") && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Checks whether a given pathname is public.
 */
export function isPublicPathname(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (PUBLIC_EXACT_ROUTES.includes(normalized as (typeof PUBLIC_EXACT_ROUTES)[number])) {
    return true;
  }
  if (
    PUBLIC_AUTH_WORKFLOW_ROUTES.includes(
      normalized as (typeof PUBLIC_AUTH_WORKFLOW_ROUTES)[number],
    )
  ) {
    return true;
  }
  if (LEGACY_AUTH_ROUTES.includes(normalized as (typeof LEGACY_AUTH_ROUTES)[number])) {
    return true;
  }
  return false;
}

/**
 * Checks whether a given pathname is protected.
 */
export function isProtectedPathname(pathname: string): boolean {
  return !isPublicPathname(pathname);
}

function hasControlCharacters(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // ASCII control characters 0x00 - 0x1F and 0x7F (DEL)
    if ((code >= 0 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
}

/**
 * Validates and sanitizes a return/redirect URL to prevent open redirects and redirect loops.
 * Returns the safe relative path (with search/hash if present), or null if unsafe.
 */
export function sanitizeReturnUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  // Disallow control characters anywhere in the raw input URL (including CRLF, tabs, null bytes)
  if (hasControlCharacters(url)) return null;

  const trimmed = url.trim();

  // Must begin with a single '/' and not '//' or '/\' (prevents protocol-relative open redirects)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return null;
  }

  // Disallow protocol schemes (e.g. javascript:, data:, http:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;

  // Extract path portion to prevent redirect loops back to auth pages
  const pathOnly = trimmed.split(/[?#]/)[0] ?? "";
  const normalized = normalizePathname(pathOnly);

  // If the target is an auth or recovery workflow, do not redirect back to it
  if (
    normalized === "/auth" ||
    normalized.startsWith("/auth/login") ||
    normalized.startsWith("/auth/register") ||
    normalized.startsWith("/auth/verify-email") ||
    normalized.startsWith("/auth/resend-verification") ||
    normalized.startsWith("/auth/forgot-password") ||
    normalized.startsWith("/auth/reset-password")
  ) {
    return null;
  }

  return trimmed;
}

/**
 * Builds the login redirect URL with a safe return URL attached.
 */
export function buildLoginRedirectUrl(
  destinationUrl: string,
  baseUrl: string | URL = "http://localhost:3000",
): URL {
  const url = new URL("/auth", baseUrl);
  url.searchParams.set("tab", "login");
  const safeReturn = sanitizeReturnUrl(destinationUrl);
  if (safeReturn) {
    url.searchParams.set("redirect", safeReturn);
  }
  return url;
}
