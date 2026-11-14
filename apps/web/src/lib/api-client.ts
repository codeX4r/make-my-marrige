export type ApiRequestOptions = Omit<RequestInit, "credentials">;

const bffPrefix = "/api/v1/";

let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token;
  if (typeof window !== "undefined") {
    try {
      if (token) {
        sessionStorage.setItem("mmm_csrf_token", token);
      } else {
        sessionStorage.removeItem("mmm_csrf_token");
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
  }
}

export function getCsrfToken(): string | null {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  if (typeof window !== "undefined") {
    try {
      inMemoryCsrfToken = sessionStorage.getItem("mmm_csrf_token");
    } catch {
      inMemoryCsrfToken = null;
    }
  }
  return inMemoryCsrfToken;
}

export function clearCsrfToken(): void {
  setCsrfToken(null);
}

const NO_AUTO_REFRESH_PATHS = new Set([
  "auth/refresh",
  "auth/login",
  "auth/register",
  "auth/verify-email",
  "auth/email/verify",
  "auth/email/resend",
  "auth/password/forgot",
  "auth/password/reset",
]);

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function executeRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`${bffPrefix}auth/refresh`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          accept: "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        cache: "no-store",
      });
      if (res.ok) {
        const newCsrf = res.headers.get("x-csrf-token");
        if (newCsrf) setCsrfToken(newCsrf);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  isRetry = false,
): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, "");
  if (!normalizedPath || normalizedPath.startsWith("../")) {
    throw new Error("API path must be a non-empty relative path.");
  }

  const method = (options.method || "GET").toUpperCase();
  const csrf = getCsrfToken();

  const headers: Record<string, string> = {
    accept: "application/json",
    ...(csrf && method !== "GET" && method !== "HEAD" ? { "x-csrf-token": csrf } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${bffPrefix}${normalizedPath}`, {
    ...options,
    credentials: "same-origin",
    headers,
    cache: "no-store",
  });

  // Track CSRF token returned in response headers
  const returnedCsrf = response.headers.get("x-csrf-token");
  if (returnedCsrf) {
    setCsrfToken(returnedCsrf);
  }

  // Auto-refresh token if 401 encountered on an authenticated path
  if (response.status === 401 && !isRetry && !NO_AUTO_REFRESH_PATHS.has(normalizedPath)) {
    const refreshed = await executeRefresh();
    if (refreshed) {
      return apiRequest<T>(path, options, true);
    }
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}.`;
    try {
      const data = (await response.json()) as {
        error?: { message?: string; code?: string };
        message?: string | string[];
      };
      if (data?.error?.message) {
        message = data.error.message;
      } else if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
