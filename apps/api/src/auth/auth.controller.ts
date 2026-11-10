import {
  Body,
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
import { RegistrationService } from "./registration.service.js";
import { EmailVerificationService } from "./email-verification.service.js";
import { LoginService, type LoginResult } from "./login.service.js";
import type { AuthenticatedPrincipal } from "./auth.types.js";
import { RegisterDto, LoginDto, VerifyEmailDto, ResendEmailDto } from "./auth.dto.js";

const BFF_ACCESS_TOKEN_HEADER = "x-mmm-access-token";
const BFF_REFRESH_TOKEN_HEADER = "x-mmm-refresh-token";
const BFF_CSRF_TOKEN_HEADER = "x-mmm-csrf-token";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly sessions: MemberSessionService,
    private readonly csrf: CsrfOriginService,
    private readonly registration: RegistrationService,
    private readonly verification: EmailVerificationService,
    private readonly loginService: LoginService,
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

  @Post("register")
  @HttpCode(201)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: { user: { userId: string; email: string; displayName: string; emailVerificationStatus: string } } }> {
    const result = await this.registration.register({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
    });
    return { data: { user: { userId: result.userId, email: result.emailNormalized, displayName: result.displayName, emailVerificationStatus: result.emailVerificationStatus } } };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ data: { user: LoginResult["user"] } }> {
    const result = await this.loginService.login({
      email: dto.email,
      password: dto.password,
    });
    response.setHeader(BFF_ACCESS_TOKEN_HEADER, result.tokens.accessToken);
    response.setHeader(BFF_REFRESH_TOKEN_HEADER, result.tokens.refreshToken);
    response.setHeader(BFF_CSRF_TOKEN_HEADER, result.csrfToken);
    return { data: { user: result.user } };
  }

  @Post("email/verify")
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ data: { verified: true } }> {
    await this.verification.verify(dto.token);
    return { data: { verified: true } };
  }

  @Post("email/resend")
  @HttpCode(200)
  async resendEmail(@Body() dto: ResendEmailDto): Promise<{ data: { resent: true } }> {
    await this.verification.resend(dto.email);
    return { data: { resent: true } };
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
