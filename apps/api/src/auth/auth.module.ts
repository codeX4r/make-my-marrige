import { DynamicModule, Module } from "@nestjs/common";
import type { ApiEnvironment } from "../config.js";
import { AccessTokenAuthGuard } from "./access-token-auth.guard.js";
import { AccessTokenService } from "./access-token.service.js";
import { CsrfOriginService } from "./csrf-origin.service.js";
import { JwtKeyRingService } from "./jwt-key-ring.service.js";
import { MemberSessionService } from "./member-session.service.js";
import { PasswordHashService } from "./password-hash.service.js";
import { RegistrationService } from "./registration.service.js";
import { AuthController } from "./auth.controller.js";

@Module({})
export class AuthModule {
  static register(environment: ApiEnvironment): DynamicModule {
    return {
      module: AuthModule,
      controllers: [AuthController],
      providers: [
        {
          provide: JwtKeyRingService,
          useFactory: () => new JwtKeyRingService(environment),
        },
        {
          provide: AccessTokenService,
          useFactory: (keyRing: JwtKeyRingService) =>
            new AccessTokenService(keyRing, environment.AUTH_JWT_ISSUER, environment.AUTH_JWT_AUDIENCE),
          inject: [JwtKeyRingService],
        },
        PasswordHashService,
        MemberSessionService,
        RegistrationService,
        {
          provide: CsrfOriginService,
          useFactory: (sessions: MemberSessionService) => new CsrfOriginService(environment, sessions),
          inject: [MemberSessionService],
        },
        AccessTokenAuthGuard,
      ],
      exports: [
        AccessTokenAuthGuard,
        AccessTokenService,
        CsrfOriginService,
        MemberSessionService,
        PasswordHashService,
        RegistrationService,
      ],
    };
  }
}
