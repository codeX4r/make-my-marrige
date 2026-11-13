export type ApiRequestOptions = Omit<RequestInit, "credentials">;

const bffPrefix = "/api/v1/";

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, "");
  if (!normalizedPath || normalizedPath.startsWith("../")) {
    throw new Error("API path must be a non-empty relative path.");
  }

  const response = await fetch(`${bffPrefix}${normalizedPath}`, {
    ...options,
    credentials: "same-origin",
    headers: { accept: "application/json", ...options.headers },
    cache: "no-store",
  });

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
