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
    throw new Error(`API request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}
