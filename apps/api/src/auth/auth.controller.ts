import {
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AccessTokenAuthGuard } from "./access-token-auth.guard.js";
import { CsrfOriginService } from "./csrf-origin.service.js";
import { CurrentPrincipal, type AuthenticatedRequest } from "./current-principal.decorator.js";
import { MemberSessionService } from "./member-session.service.js";
import type { AuthenticatedPrincipal } from "./auth.types.js";

const BFF_ACCESS_TOKEN_HEADER = "x-mmm-access-token";
const BFF_REFRESH_TOKEN_HEADER = "x-mmm-refresh-token";
const BFF_CSRF_TOKEN_HEADER = "x-mmm-csrf-token";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly sessions: MemberSessionService,
    private readonly csrf: CsrfOriginService,
  ) {}

  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: Record<string, never> }> {
    const refreshToken = request.header(BFF_REFRESH_TOKEN_HEADER);
    if (!refreshToken) throw unauthorized();
    const sessionId = await this.sessions.findActiveSessionIdForRefresh(refreshToken);
    await this.csrf.assertValid(
      sessionId,
      request.header("x-csrf-token"),
      request.header("origin"),
    );
    const tokens = await this.sessions.refresh(refreshToken);
    response.setHeader(BFF_ACCESS_TOKEN_HEADER, tokens.accessToken);
    response.setHeader(BFF_REFRESH_TOKEN_HEADER, tokens.refreshToken);
    response.setHeader(BFF_CSRF_TOKEN_HEADER, tokens.csrfToken);
    return { data: {} };
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AccessTokenAuthGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
  ): Promise<{ data: { revoked: true } }> {
    await this.csrf.assertValid(
      principal.sessionId,
      request.header("x-csrf-token"),
      request.header("origin"),
    );
    await this.sessions.revokeCurrentFamily(principal.userId, principal.sessionId);
    return { data: { revoked: true } };
  }
}

function unauthorized(): UnauthorizedException {
  return new UnauthorizedException();
}
