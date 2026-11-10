import { DynamicModule, Module } from "@nestjs/common";
import type { ApiEnvironment } from "../config.js";
import type { Connection } from "mongoose";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { AccessTokenAuthGuard } from "./access-token-auth.guard.js";
import { AccessTokenService } from "./access-token.service.js";
import { BrevoEmailAdapter } from "./email.adapter.js";
import { CsrfOriginService } from "./csrf-origin.service.js";
import { JwtKeyRingService } from "./jwt-key-ring.service.js";
import { MemberSessionService } from "./member-session.service.js";
import { PasswordHashService } from "./password-hash.service.js";
import { RegistrationService } from "./registration.service.js";
import { EmailVerificationService } from "./email-verification.service.js";
import { LoginService } from "./login.service.js";
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
        {
          provide: RegistrationService,
          useFactory: (
            connection: Connection,
            passwordHash: PasswordHashService,
            emailAdapter: BrevoEmailAdapter,
          ) => new RegistrationService(connection, passwordHash, emailAdapter),
          inject: [MONGO_CONNECTION, PasswordHashService, BrevoEmailAdapter],
        },
        EmailVerificationService,
        LoginService,
        {
          provide: BrevoEmailAdapter,
          useFactory: () => new BrevoEmailAdapter({
            EMAIL_BREVO_API_KEY: environment.EMAIL_BREVO_API_KEY,
            EMAIL_SENDER_EMAIL: environment.EMAIL_SENDER_EMAIL,
            EMAIL_SENDER_NAME: environment.EMAIL_SENDER_NAME,
          }),
        },
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
        EmailVerificationService,
        LoginService,
        BrevoEmailAdapter,
      ],
    };
  }
}
