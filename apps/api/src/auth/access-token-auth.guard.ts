import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AccessTokenService } from "./access-token.service.js";
import type { AuthenticatedRequest } from "./current-principal.decorator.js";

@Injectable()
export class AccessTokenAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException();
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) throw new UnauthorizedException();
    request.principal = this.accessTokens.verify(token);
    return true;
  }
}
