import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const serverEnvironment = vi.hoisted(() => ({
  getWebEnvironment: vi.fn(() => ({ API_BASE_URL: "http://api.internal" })),
}));

vi.mock("../../../../lib/server-env", () => serverEnvironment);

import { GET, POST } from "./route";

const context = (path: string[]): { params: Promise<{ path: string[] }> } => ({
  params: Promise.resolve({ path }),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  serverEnvironment.getWebEnvironment.mockReset();
  serverEnvironment.getWebEnvironment.mockReturnValue({ API_BASE_URL: "http://api.internal" });
});

describe("foundation BFF route policy", () => {
  it("returns a sanitized configuration error when server environment validation fails", async () => {
    serverEnvironment.getWebEnvironment.mockImplementation(() => {
      throw new Error("private configuration detail");
    });

    const response = await GET(
      new NextRequest("http://web.local/api/v1/health/live"),
      context(["health", "live"]),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "BFF_CONFIGURATION_ERROR" } });
  });

  it("forwards the approved liveness path and query to the fixed API origin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 203 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new NextRequest("http://web.local/api/v1/health/live?probe=1"),
      context(["health", "live"]),
    );
    expect(response.status).toBe(203);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetchMock.mock.calls[0]?.[0].toString()).toBe("http://api.internal/health/live?probe=1");
  });

  it("rejects paths outside the explicit foundation allowlist", async () => {
    const response = await GET(
      new NextRequest("http://web.local/api/v1/admin/users"),
      context(["admin", "users"]),
    );
    expect(response.status).toBe(404);
  });

  it("rejects unsupported methods for an allowed path", async () => {
    const response = await POST(
      new NextRequest("http://web.local/api/v1/health/live", { method: "POST" }),
      context(["health", "live"]),
    );
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });

  it("rejects oversized request bodies before forwarding", async () => {
    const response = await POST(
      new NextRequest("http://web.local/api/v1/health/live", {
        method: "POST",
        headers: { "content-length": "1048577" },
      }),
      context(["health", "live"]),
    );
    expect(response.status).toBe(413);
  });

  it("enforces the body limit on streamed bytes even when the declared size is small", async () => {
    const payload = new Uint8Array(1_048_577);
    const response = await POST(
      new NextRequest("http://web.local/api/v1/health/live", {
        method: "POST",
        headers: { "content-length": "1" },
        body: payload,
      }),
      context(["health", "live"]),
    );
    expect(response.status).toBe(413);
  });

  it("maps upstream timeouts and unavailable responses safely", async () => {
    vi.stubEnv("BFF_UPSTREAM_TIMEOUT_MS", "100");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: URL, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
              once: true,
            });
          }),
      ),
    );
    const timedOut = await GET(
      new NextRequest("http://web.local/api/v1/health/live"),
      context(["health", "live"]),
    );
    expect(timedOut.status).toBe(504);
    expect(await timedOut.text()).not.toContain("api.internal");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection details")));
    const unavailable = await GET(
      new NextRequest("http://web.local/api/v1/health/ready"),
      context(["health", "ready"]),
    );
    expect(unavailable.status).toBe(502);
    expect(await unavailable.text()).not.toContain("connection details");
  });

  it("preserves upstream status and does not forward upstream cookies for non-auth routes", async () => {
    const upstreamHeaders = new Headers({ "content-type": "application/json" });
    upstreamHeaders.append("set-cookie", "a=1; HttpOnly");
    upstreamHeaders.append("set-cookie", "b=2; Secure");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("{}", {
          status: 429,
          headers: upstreamHeaders,
        }),
      ),
    );
    const response = await GET(
      new NextRequest("http://web.local/api/v1/health/ready"),
      context(["health", "ready"]),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    // BFF only forwards set-cookie for auth routes (refresh/logout)
    // For non-auth routes, it does not forward upstream cookies to browser
    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBe(0);
  });

  it("sanitizes upstream server errors while preserving their status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("stack trace with internal host", { status: 503 })),
    );
    const response = await GET(
      new NextRequest("http://web.local/api/v1/health/ready"),
      context(["health", "ready"]),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("internal host");
  });
});
