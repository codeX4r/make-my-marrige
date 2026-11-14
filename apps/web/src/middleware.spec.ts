import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("centralized route protection middleware", () => {
  it("allows public root landing page without credentials", () => {
    const request = new NextRequest("http://localhost:3000/");
    const response = middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite") || response.headers.get("location")).toBeNull();
  });

  it("allows centralized /auth page without credentials", () => {
    const request = new NextRequest("http://localhost:3000/auth");
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("allows public auth workflow routes without credentials", () => {
    const routes = [
      "http://localhost:3000/auth/verify-email?token=xyz",
      "http://localhost:3000/auth/resend-verification",
      "http://localhost:3000/auth/forgot-password",
      "http://localhost:3000/auth/reset-password?token=xyz",
    ];

    for (const url of routes) {
      const request = new NextRequest(url);
      const response = middleware(request);
      expect(response.status).toBe(200);
    }
  });

  it("redirects legacy /auth/login to /auth?tab=login preserving extra params", () => {
    const request = new NextRequest("http://localhost:3000/auth/login?redirect=%2Fdashboard");
    const response = middleware(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth");
    expect(location.searchParams.get("tab")).toBe("login");
    expect(location.searchParams.get("redirect")).toBe("/dashboard");
  });

  it("redirects legacy /auth/register to /auth?tab=register", () => {
    const request = new NextRequest("http://localhost:3000/auth/register");
    const response = middleware(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth");
    expect(location.searchParams.get("tab")).toBe("register");
  });

  it("redirects unauthenticated requests on protected /dashboard to /auth?tab=login with return URL", () => {
    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = middleware(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth");
    expect(location.searchParams.get("tab")).toBe("login");
    expect(location.searchParams.get("redirect")).toBe("/dashboard");
  });

  it("redirects unauthenticated requests on protected /auth/profile to /auth?tab=login with return URL", () => {
    const request = new NextRequest("http://localhost:3000/auth/profile?tab=security");
    const response = middleware(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth");
    expect(location.searchParams.get("tab")).toBe("login");
    expect(location.searchParams.get("redirect")).toBe("/auth/profile?tab=security");
  });

  it("redirects unauthenticated requests on protected /auth/sessions to /auth?tab=login with return URL", () => {
    const request = new NextRequest("http://localhost:3000/auth/sessions");
    const response = middleware(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth");
    expect(location.searchParams.get("tab")).toBe("login");
    expect(location.searchParams.get("redirect")).toBe("/auth/sessions");
  });

  it("allows access to protected routes when mmm_access cookie is present", () => {
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "mmm_access=valid.jwt.token" },
    });
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("allows access to protected routes when mmm_refresh cookie is present (enabling sliding refresh)", () => {
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "mmm_refresh=opaque-refresh-token" },
    });
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("allows access to protected routes when production __Host-mmm_access cookie is present", () => {
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "__Host-mmm_access=valid.jwt.token" },
    });
    const response = middleware(request);
    expect(response.status).toBe(200);
  });
});
