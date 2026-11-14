import { ForbiddenException, Injectable } from "@nestjs/common";
import type { ApiEnvironment } from "../config.js";
import { MemberSessionService } from "./member-session.service.js";

@Injectable()
export class CsrfOriginService {
  private readonly allowedOrigins: ReadonlySet<string>;

  constructor(
    environment: Pick<ApiEnvironment, "AUTH_ALLOWED_ORIGINS">,
    private readonly sessions: MemberSessionService,
  ) {
    const origins = environment.AUTH_ALLOWED_ORIGINS.split(",").map((value) => value.trim());
    if (origins.length === 0 || origins.some((origin) => !validOrigin(origin))) {
      throw new Error("Invalid configured authentication origin.");
    }
    this.allowedOrigins = new Set(origins);
  }

  async assertValid(
    sessionId: string,
    csrfToken: string | undefined,
    origin: string | undefined,
  ): Promise<void> {
    if (!csrfToken || !origin || !this.allowedOrigins.has(origin)) throw new ForbiddenException();
    if (!(await this.sessions.validateCsrf(sessionId, csrfToken))) throw new ForbiddenException();
  }
}

function validOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === value && (url.protocol === "https:" || url.protocol === "http:");
  } catch {
    return false;
  }
}
