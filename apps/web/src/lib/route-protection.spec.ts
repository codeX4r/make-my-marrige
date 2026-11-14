import { describe, expect, it } from "vitest";
import {
  isPublicPathname,
  isProtectedPathname,
  normalizePathname,
  sanitizeReturnUrl,
  buildLoginRedirectUrl,
} from "./route-protection";

describe("route protection policies", () => {
  describe("normalizePathname", () => {
    it("handles root path", () => {
      expect(normalizePathname("/")).toBe("/");
      expect(normalizePathname("")).toBe("/");
    });

    it("removes trailing slashes", () => {
      expect(normalizePathname("/dashboard/")).toBe("/dashboard");
      expect(normalizePathname("/auth/profile/")).toBe("/auth/profile");
    });

    it("trims whitespace", () => {
      expect(normalizePathname(" /dashboard ")).toBe("/dashboard");
    });
  });

  describe("isPublicPathname and isProtectedPathname", () => {
    it("classifies root and auth landing as public", () => {
      expect(isPublicPathname("/")).toBe(true);
      expect(isPublicPathname("/auth")).toBe(true);
      expect(isProtectedPathname("/")).toBe(false);
      expect(isProtectedPathname("/auth")).toBe(false);
    });

    it("classifies public auth workflow routes as public", () => {
      expect(isPublicPathname("/auth/verify-email")).toBe(true);
      expect(isPublicPathname("/auth/resend-verification")).toBe(true);
      expect(isPublicPathname("/auth/forgot-password")).toBe(true);
      expect(isPublicPathname("/auth/reset-password")).toBe(true);
    });

    it("classifies legacy redirect routes as public", () => {
      expect(isPublicPathname("/auth/login")).toBe(true);
      expect(isPublicPathname("/auth/register")).toBe(true);
    });

    it("classifies application and profile routes as protected", () => {
      expect(isProtectedPathname("/dashboard")).toBe(true);
      expect(isProtectedPathname("/dashboard/functions")).toBe(true);
      expect(isProtectedPathname("/auth/profile")).toBe(true);
      expect(isProtectedPathname("/auth/sessions")).toBe(true);
      expect(isProtectedPathname("/workspaces")).toBe(true);
      expect(isProtectedPathname("/workspaces/current")).toBe(true);
    });
  });

  describe("sanitizeReturnUrl", () => {
    it("preserves safe relative paths with search queries", () => {
      expect(sanitizeReturnUrl("/dashboard")).toBe("/dashboard");
      expect(sanitizeReturnUrl("/auth/profile?tab=security")).toBe("/auth/profile?tab=security");
      expect(sanitizeReturnUrl("/workspaces/current/tasks?status=open")).toBe(
        "/workspaces/current/tasks?status=open",
      );
    });

    it("prevents open redirects to absolute URLs or protocol-relative URLs", () => {
      expect(sanitizeReturnUrl("https://evil.com")).toBeNull();
      expect(sanitizeReturnUrl("http://evil.com/phishing")).toBeNull();
      expect(sanitizeReturnUrl("//evil.com")).toBeNull();
      expect(sanitizeReturnUrl("/\\evil.com")).toBeNull();
      expect(sanitizeReturnUrl("javascript:alert(1)")).toBeNull();
      expect(sanitizeReturnUrl("data:text/html,evil")).toBeNull();
    });

    it("rejects control characters and CRLF injection", () => {
      expect(sanitizeReturnUrl("/dashboard\r\nSet-Cookie:evil=1")).toBeNull();
      expect(sanitizeReturnUrl("/dashboard\n")).toBeNull();
      expect(sanitizeReturnUrl("/dashboard\t")).toBeNull();
    });

    it("prevents redirect loops back to authentication workflow routes", () => {
      expect(sanitizeReturnUrl("/auth")).toBeNull();
      expect(sanitizeReturnUrl("/auth?tab=login")).toBeNull();
      expect(sanitizeReturnUrl("/auth/login")).toBeNull();
      expect(sanitizeReturnUrl("/auth/register")).toBeNull();
      expect(sanitizeReturnUrl("/auth/verify-email")).toBeNull();
      expect(sanitizeReturnUrl("/auth/resend-verification")).toBeNull();
      expect(sanitizeReturnUrl("/auth/forgot-password")).toBeNull();
      expect(sanitizeReturnUrl("/auth/reset-password?token=123")).toBeNull();
    });

    it("handles empty or non-string inputs safely", () => {
      expect(sanitizeReturnUrl(null)).toBeNull();
      expect(sanitizeReturnUrl(undefined)).toBeNull();
      expect(sanitizeReturnUrl("")).toBeNull();
      expect(sanitizeReturnUrl("   ")).toBeNull();
    });
  });

  describe("buildLoginRedirectUrl", () => {
    it("constructs login URL with safe redirect parameter", () => {
      const url = buildLoginRedirectUrl("/dashboard", "http://localhost:3000");
      expect(url.pathname).toBe("/auth");
      expect(url.searchParams.get("tab")).toBe("login");
      expect(url.searchParams.get("redirect")).toBe("/dashboard");
    });

    it("omits redirect parameter when destination is unsafe or a loop", () => {
      const url = buildLoginRedirectUrl("https://evil.com", "http://localhost:3000");
      expect(url.pathname).toBe("/auth");
      expect(url.searchParams.get("tab")).toBe("login");
      expect(url.searchParams.has("redirect")).toBe(false);
    });
  });
});
