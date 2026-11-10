import type { NextRequest } from "next/server";
import { getWebEnvironment } from "../../../../lib/server-env";
import {
  clearSessionCookieHeaders,
  getAuthCookieConfiguration,
  sessionCookieHeaders,
} from "../../../../lib/server-auth-cookies";

const MAX_REQUEST_BYTES = 1_048_576;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 5_000;
const MAX_UPSTREAM_TIMEOUT_MS = 30_000;

type RouteContext = { params: Promise<{ path: string[] }> };
type RoutePolicy = {
  upstreamPath: string;
  methods: readonly string[];
  authentication?: "refresh" | "logout" | "resend";
};

// Foundation-only routes. Add product operations only after their contracts are approved.
const routePolicies: Record<string, RoutePolicy> = {
  "health/live": { upstreamPath: "/health/live", methods: ["GET"] },
  "health/ready": { upstreamPath: "/health/ready", methods: ["GET"] },
  "auth/refresh": { upstreamPath: "/v1/auth/refresh", methods: ["POST"], authentication: "refresh" },
  "auth/logout": { upstreamPath: "/v1/auth/logout", methods: ["POST"], authentication: "logout" },
  "email/resend": { upstreamPath: "/v1/auth/email/resend", methods: ["POST"], authentication: "resend" },
};

function jsonError(status: number, code: string): Response {
  return Response.json({ error: { code } }, { status, headers: { "cache-control": "no-store" } });
}

function upstreamTimeoutMs(): number {
  const configured = process.env.BFF_UPSTREAM_TIMEOUT_MS;
  if (configured === undefined) return DEFAULT_UPSTREAM_TIMEOUT_MS;
  const value = Number(configured);
  if (!Number.isInteger(value) || value < 100 || value > MAX_UPSTREAM_TIMEOUT_MS) {
    throw new Error("Invalid BFF upstream timeout configuration.");
  }
  return value;
}

function apiOrigin(): URL {
  const origin = new URL(getWebEnvironment().API_BASE_URL);
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    throw new Error("Invalid API origin configuration.");
  }
  return origin;
}

async function bodyExceedsLimit(request: Request): Promise<boolean> {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_REQUEST_BYTES) return true;
  if (!request.body) return false;
  const reader = request.body.getReader();
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return false;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return true;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const policy = routePolicies[path.join("/")];
  if (!policy) return jsonError(404, "NOT_FOUND");
  try {
    if (await bodyExceedsLimit(request)) return jsonError(413, "REQUEST_TOO_LARGE");
  } catch {
    return jsonError(499, "CLIENT_DISCONNECTED");
  }
  if (!policy.methods.includes(request.method)) {
    return new Response(null, {
      status: 405,
      headers: { allow: policy.methods.join(", "), "cache-control": "no-store" },
    });
  }
  let timeoutMs: number;
  let upstreamUrl: URL;
  try {
    timeoutMs = upstreamTimeoutMs();
    upstreamUrl = apiOrigin();
  } catch {
    return jsonError(500, "BFF_CONFIGURATION_ERROR");
  }
  upstreamUrl.pathname = policy.upstreamPath;
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of ["accept", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let cookieConfiguration: ReturnType<typeof getAuthCookieConfiguration> | undefined;
  if (policy.authentication) {
    try {
      cookieConfiguration = getAuthCookieConfiguration();
    } catch {
      return jsonError(500, "BFF_CONFIGURATION_ERROR");
    }
    const csrfToken = request.headers.get("x-csrf-token");
    const origin = request.headers.get("origin");
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
    if (origin) headers.set("origin", origin);
    if (policy.authentication === "refresh") {
      const refreshToken = request.cookies.get(cookieConfiguration.refreshName)?.value;
      if (refreshToken) headers.set("x-mmm-refresh-token", refreshToken);
    } else if (policy.authentication === "logout") {
      const accessToken = request.cookies.get(cookieConfiguration.accessName)?.value;
      if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
    } else if (policy.authentication) {
      // For other authenticated requests, forward access token as Bearer for NestJS guard
      const accessToken = request.cookies.get(cookieConfiguration.accessName)?.value;
      if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
    }
  }
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = AbortSignal.any([request.signal, timeoutSignal]);

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "manual",
      signal,
    });
  } catch {
    if (timeoutSignal.aborted) return jsonError(504, "UPSTREAM_TIMEOUT");
    if (request.signal.aborted) return jsonError(499, "CLIENT_DISCONNECTED");
    return jsonError(502, "UPSTREAM_UNAVAILABLE");
  }

  if (upstream.status >= 500) return jsonError(upstream.status, "UPSTREAM_ERROR");

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  for (const name of ["content-type", "x-request-id", "www-authenticate"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  if (policy.authentication === "refresh" && upstream.ok && cookieConfiguration) {
    const accessToken = upstream.headers.get("x-mmm-access-token");
    const refreshToken = upstream.headers.get("x-mmm-refresh-token");
    const csrfToken = upstream.headers.get("x-mmm-csrf-token");
    if (!accessToken || !refreshToken || !csrfToken) return jsonError(502, "UPSTREAM_ERROR");
    for (const cookie of sessionCookieHeaders(accessToken, refreshToken, cookieConfiguration)) {
      responseHeaders.append("set-cookie", cookie);
    }
    responseHeaders.set("x-csrf-token", csrfToken);
  }
  if (policy.authentication === "logout" && upstream.ok && cookieConfiguration) {
    for (const cookie of clearSessionCookieHeaders(cookieConfiguration)) {
      responseHeaders.append("set-cookie", cookie);
    }
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
