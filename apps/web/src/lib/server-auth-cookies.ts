type CookieMode = "local" | "production";

export type AuthCookieConfiguration = Readonly<{
  accessName: string;
  refreshName: string;
  secure: boolean;
}>;

export function getAuthCookieConfiguration(
  environment: Record<string, string | undefined> = process.env,
): AuthCookieConfiguration {
  const mode = environment.AUTH_COOKIE_MODE as CookieMode | undefined;
  if (mode !== "local" && mode !== "production") {
    throw new Error("AUTH_COOKIE_MODE must be explicitly configured as local or production.");
  }
  if (mode === "production") {
    if (environment.NODE_ENV !== "production") {
      throw new Error("Production authentication cookies require NODE_ENV=production.");
    }
    return { accessName: "__Host-mmm_access", refreshName: "__Host-mmm_refresh", secure: true };
  }
  if (environment.NODE_ENV === "production") {
    throw new Error("Local authentication cookies cannot be used in production.");
  }
  return { accessName: "mmm_access", refreshName: "mmm_refresh", secure: false };
}

export function sessionCookieHeaders(
  accessToken: string,
  refreshToken: string,
  configuration: AuthCookieConfiguration,
): string[] {
  return [
    serialize(configuration.accessName, accessToken, configuration, 15 * 60),
    serialize(configuration.refreshName, refreshToken, configuration, 7 * 24 * 60 * 60),
  ];
}

export function clearSessionCookieHeaders(configuration: AuthCookieConfiguration): string[] {
  return [
    serialize(configuration.accessName, "", configuration, 0),
    serialize(configuration.refreshName, "", configuration, 0),
  ];
}

function serialize(
  name: string,
  value: string,
  configuration: AuthCookieConfiguration,
  maxAge: number,
): string {
  const attributes = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (configuration.secure) attributes.push("Secure");
  return attributes.join("; ");
}
