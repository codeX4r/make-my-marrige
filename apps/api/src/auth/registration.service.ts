import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { ClientSession, Connection, Types } from "mongoose";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { registerIdentityModels } from "../identity/persistence/index.js";
import { PasswordHashService } from "./password-hash.service.js";
import { hashToken } from "./token-secrets.js";

export const EMAIL_VERIFICATION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const MAX_RESENDS_PER_TOKEN = 5;

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type RegisterResult = {
  userId: string;
  emailNormalized: string;
  displayName: string;
  emailVerificationStatus: "UNVERIFIED";
  emailVerificationRequired: true;
};

type EmailVerificationTokenMaterial = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeDisplayName(displayName: string): string {
  return displayName.trim();
}

function newEmailVerificationToken(now: Date): EmailVerificationTokenMaterial {
  const token = `mmm_verify_${randomUUID()}`;
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_LIFETIME_MS),
  };
}

@Injectable()
export class RegistrationService {
  private readonly models;
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @Inject(MONGO_CONNECTION) private readonly connection: Connection,
    private readonly passwordHash: PasswordHashService,
  ) {
    this.models = registerIdentityModels(connection);
  }

  async register(input: RegisterRequest, now = new Date()): Promise<RegisterResult> {
    const emailNormalized = normalizeEmail(input.email);
    const displayName = normalizeDisplayName(input.displayName);

    if (!this.isValidEmail(emailNormalized)) {
      throw new UnprocessableEntityException("Invalid email address.");
    }
    if (!this.isValidDisplayName(displayName)) {
      throw new UnprocessableEntityException("Invalid display name.");
    }
    if (!this.passwordHash.isValidPassword(input.password)) {
      throw new UnprocessableEntityException("Invalid password.");
    }

    const passwordHash = this.passwordHash.hash(input.password);

    const databaseSession = await this.connection.startSession();
    try {
      return await databaseSession.withTransaction(async () => {
        const existing = await this.models.User.findOne({ emailNormalized })
          .select("_id")
          .session(databaseSession);
        if (existing) {
          throw new ConflictException("An account with that email address already exists.");
        }

                const created = await this.models.User.create(
          [
            {
              emailNormalized,
              displayName,
              passwordHash: JSON.stringify(passwordHash),
              emailVerificationStatus: "UNVERIFIED",
              accountStatus: "ACTIVE",
            },
          ],
          { session: databaseSession },
        );
        const createdUser = created[0];
        if (!createdUser) throw new Error("Registration failed to create user.");

        const tokenMaterial = newEmailVerificationToken(now);
        await this.models.EmailVerificationToken.create(
          [
            {
              userId: createdUser._id,
              tokenHash: tokenMaterial.tokenHash,
              status: "PENDING",
              expiresAt: tokenMaterial.expiresAt,
            },
          ],
          { session: databaseSession },
        );

        this.logger.debug(
          {
            userId: createdUser._id.toString(),
            emailVerificationTokenId: tokenMaterial.tokenHash.slice(0, 8),
          },
          "member_registered",
        );

        return {
          userId: createdUser._id.toString(),
          emailNormalized: createdUser.emailNormalized,
          displayName: createdUser.displayName,
          emailVerificationStatus: "UNVERIFIED",
          emailVerificationRequired: true,
        };
      });
    } finally {
      await databaseSession.endSession();
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
  }

  private isValidDisplayName(displayName: string): boolean {
    return displayName.length > 0 && displayName.length <= 100;
  }
}