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
  authentication?: "refresh" | "logout" | "login" | "access";
};

// Foundation-only routes. Add product operations only after their contracts are approved.
const routePolicies: Record<string, RoutePolicy> = {
  "health/live": { upstreamPath: "/health/live", methods: ["GET"] },
  "health/ready": { upstreamPath: "/health/ready", methods: ["GET"] },
  "auth/me": { upstreamPath: "/v1/auth/me", methods: ["GET"], authentication: "access" },
  "auth/refresh": {
    upstreamPath: "/v1/auth/refresh",
    methods: ["POST"],
    authentication: "refresh",
  },
  "auth/logout": { upstreamPath: "/v1/auth/logout", methods: ["POST"], authentication: "logout" },
  "auth/register": { upstreamPath: "/v1/auth/register", methods: ["POST"] },
  "auth/login": { upstreamPath: "/v1/auth/login", methods: ["POST"], authentication: "login" },
  "auth/password/forgot": { upstreamPath: "/v1/auth/password/forgot", methods: ["POST"] },
  "auth/password/reset": { upstreamPath: "/v1/auth/password/reset", methods: ["POST"] },
  "auth/email/resend": { upstreamPath: "/v1/auth/email/resend", methods: ["POST"] },
  "auth/email/verify": { upstreamPath: "/v1/auth/email/verify", methods: ["POST"] },
  "auth/sessions": {
    upstreamPath: "/v1/auth/sessions",
    methods: ["GET"],
    authentication: "access",
  },
};

/** Resolve dynamic path segments that cannot be expressed as static keys. */
function resolveDynamicPolicy(
  segments: string[],
): (RoutePolicy & { upstreamPath: string }) | undefined {
  // auth/sessions/:sessionId/revoke  →  POST /v1/auth/sessions/:sessionId/revoke
  if (
    segments.length === 4 &&
    segments[0] === "auth" &&
    segments[1] === "sessions" &&
    segments[3] === "revoke"
  ) {
    const sessionId = segments[2];
    return {
      upstreamPath: `/v1/auth/sessions/${sessionId}/revoke`,
      methods: ["POST"],
      authentication: "access",
    };
  }
  return undefined;
}

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

async function readBoundedBody(
  request: Request,
): Promise<{ exceeded: boolean; body?: Uint8Array }> {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_REQUEST_BYTES) return { exceeded: true };
  if (!request.body) return { exceeded: false };
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        const body = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          body.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return { exceeded: false, body };
      }
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { exceeded: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const policy = routePolicies[path.join("/")] ?? resolveDynamicPolicy(path);
  if (!policy) return jsonError(404, "NOT_FOUND");
  let requestBody: Uint8Array | undefined;
  try {
    const result = await readBoundedBody(request);
    if (result.exceeded) return jsonError(413, "REQUEST_TOO_LARGE");
    requestBody = result.body;
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
  for (const name of ["accept", "content-type", "x-request-id"]) {
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
    } else if (policy.authentication === "login") {
      // Login: no cookies yet, forward credentials as-is (no auth headers needed)
      // NestJS will validate credentials and return tokens in headers
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
      body:
        request.method === "GET" || request.method === "HEAD" || !requestBody
          ? null
          : (requestBody as unknown as BodyInit),
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
  if (policy.authentication === "login" && upstream.ok && cookieConfiguration) {
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
