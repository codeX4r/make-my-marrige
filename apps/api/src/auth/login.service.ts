import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { Connection } from "mongoose";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { registerIdentityModels } from "../identity/persistence/index.js";
import { PasswordHashService } from "./password-hash.service.js";
import { MemberSessionService } from "./member-session.service.js";
import type { SessionTokens } from "./auth.types.js";

export type LoginRequest = {
  email: string;
  password: string;
  rememberSession?: boolean;
};

export type LoginResult = {
  tokens: SessionTokens;
  user: {
    id: string;
    email: string;
    displayName: string;
    emailVerificationStatus: string;
  };
  csrfToken: string;
};

function normalizeEmail(email: string): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

@Injectable()
export class LoginService {
  private readonly models;

  constructor(
    @Inject(MONGO_CONNECTION) private readonly connection: Connection,
    private readonly passwordHash: PasswordHashService,
    private readonly sessions: MemberSessionService,
  ) {
    this.models = registerIdentityModels(connection);
  }

  async login(input: LoginRequest): Promise<LoginResult> {
    const emailNormalized = normalizeEmail(input.email);
    if (!emailNormalized || typeof input.password !== "string") {
      throw new UnprocessableEntityException("Invalid email or password format.");
    }

    const user = await this.models.User.findOne({ emailNormalized }).select("+passwordHash").lean();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new ForbiddenException("Account is suspended or closed.");
    }

    if (user.emailVerificationStatus !== "VERIFIED") {
      throw new ForbiddenException("Email address must be verified before login.");
    }

    let parsedHash: { salt: string; hash: string };

    try {
      parsedHash = JSON.parse(user.passwordHash) as { salt: string; hash: string };
    } catch {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (!(await this.passwordHash.verify(input.password, parsedHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const tokens = await this.sessions.create(user._id);

    return {
      tokens,
      user: {
        id: user._id.toString(),
        email: user.emailNormalized,
        displayName: user.displayName,
        emailVerificationStatus: user.emailVerificationStatus,
      },
      csrfToken: tokens.csrfToken,
    };
  }
}
