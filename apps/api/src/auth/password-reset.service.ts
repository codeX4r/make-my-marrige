import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Connection } from "mongoose";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { registerIdentityModels } from "../identity/persistence/index.js";
import { hashToken, generateOpaqueToken } from "./token-secrets.js";
import { BrevoEmailAdapter, type VerificationEmailPayload } from "./email.adapter.js";
import { PasswordHashService } from "./password-hash.service.js";
import { MemberSessionService } from "./member-session.service.js";

export const PASSWORD_RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;
export const MAX_PASSWORD_RESET_REQUESTS_PER_HOUR = 3;

type PasswordResetTokenMaterial = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

function newPasswordResetToken(now: Date): PasswordResetTokenMaterial {
  const token = `mmm_reset_${generateOpaqueToken()}`;
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_LIFETIME_MS),
  };
}

interface TransactionResult {
  shouldSend: boolean;
  email?: string;
  token?: string;
  expiresAt?: Date;
}

@Injectable()
export class PasswordResetService {
  private readonly models;
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @Inject(MONGO_CONNECTION) private readonly connection: Connection,
    private readonly emailAdapter: BrevoEmailAdapter,
    private readonly passwordHash: PasswordHashService,
    private readonly sessions: MemberSessionService,
  ) {
    this.models = registerIdentityModels(connection);
  }

  async requestReset(email: string, now = new Date()): Promise<{ requested: true }> {
    const emailNormalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
      throw new BadRequestException("Invalid email address.");
    }

    const databaseSession = await this.connection.startSession();

    try {
      const result = await databaseSession.withTransaction(async () => {
        const user = await this.models.User.findOne({ emailNormalized, accountStatus: "ACTIVE" })
          .select("_id emailNormalized")
          .session(databaseSession);

        // Always return generic success to prevent account enumeration
        if (!user) {
          return { shouldSend: false };
        }

        const existingToken = await this.models.PasswordResetToken.findOne({
          userId: user._id,
          status: "PENDING",
        }).session(databaseSession);

        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentRequests = await this.models.PasswordResetToken.countDocuments({
          userId: user._id,
          createdAt: { $gte: oneHourAgo },
        }).session(databaseSession);

        if (recentRequests >= 3) {
          throw new HttpException(
            "Too many password reset requests. Please try again later.",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (existingToken) {
          if (existingToken.expiresAt > now) {
            // Token still valid, don't create a new one
            return { shouldSend: false };
          }
          // Expired token - mark as expired and create new one
          await this.models.PasswordResetToken.updateOne(
            { _id: existingToken._id, status: "PENDING" },
            { $set: { status: "EXPIRED" } },
            { session: databaseSession },
          );
        }

        const tokenMaterial = newPasswordResetToken(now);
        await this.models.PasswordResetToken.create(
          [
            {
              userId: user._id,
              tokenHash: tokenMaterial.tokenHash,
              status: "PENDING",
              expiresAt: tokenMaterial.expiresAt,
              requestCount: 0,
              lastRequestedAt: now,
            },
          ],
          { session: databaseSession },
        );

        this.logger.debug({ userId: user._id.toString() }, "password_reset_token_created");

        return {
          shouldSend: true,
          email: user.emailNormalized,
          token: tokenMaterial.token,
          expiresAt: tokenMaterial.expiresAt,
        };
      });

      // Send reset email outside the transaction
      if (result.shouldSend && result.email && result.token && result.expiresAt) {
        await this.sendResetEmail(result.email, result.token, result.expiresAt);
      }

      return { requested: true };
    } finally {
      await databaseSession.endSession();
    }
  }

  async resetPassword(token: string, newPassword: string, now = new Date()): Promise<{ reset: true }> {
    if (!token || typeof token !== "string") {
      throw new BadRequestException("Reset token is required.");
    }
    if (!newPassword || typeof newPassword !== "string") {
      throw new BadRequestException("New password is required.");
    }
    if (newPassword.length < 12 || newPassword.length > 128) {
      throw new BadRequestException("Invalid password length.");
    }

    const tokenHash = hashToken(token);
    const databaseSession = await this.connection.startSession();

    try {
      return await databaseSession.withTransaction(async () => {
        const record = await this.models.PasswordResetToken.findOne({ tokenHash })
          .select("+tokenHash")
          .session(databaseSession);

        if (!record) {
          throw new NotFoundException("Reset token not found.");
        }

        if (record.status !== "PENDING") {
          throw new ConflictException("Reset token has already been used or expired.");
        }

        if (record.expiresAt <= now) {
          await this.models.PasswordResetToken.updateOne(
            { _id: record._id, status: "PENDING" },
            { $set: { status: "EXPIRED" } },
            { session: databaseSession },
          );
          throw new ConflictException("Reset token has expired.");
        }

        const user = await this.models.User.findOne({
          _id: record.userId,
          accountStatus: "ACTIVE",
        }).session(databaseSession);

        if (!user) {
          throw new NotFoundException("User account not found.");
        }

        const updatedToken = await this.models.PasswordResetToken.findOneAndUpdate(
          { _id: record._id, status: "PENDING", expiresAt: { $gt: now } },
          { $set: { status: "CONSUMED", consumedAt: now } },
          { new: true, session: databaseSession },
        );

        if (!updatedToken) {
          throw new ConflictException("Reset token conflict or concurrent consumption.");
        }

        const passwordHash = await this.passwordHash.hash(newPassword);
        await this.models.User.updateOne(
          { _id: user._id, accountStatus: "ACTIVE" },
          { $set: { passwordHash: JSON.stringify(passwordHash) } },
          { session: databaseSession },
        );

        // Revoke all active sessions for the user
        await this.sessions.revokeAllForUser(user._id.toString(), now, databaseSession);

        this.logger.debug({ userId: user._id.toString() }, "password_reset_completed");

        return { reset: true };
      });
    } finally {
      await databaseSession.endSession();
    }
  }

  private async sendResetEmail(email: string, token: string, expiresAt: Date): Promise<void> {
    const payload: VerificationEmailPayload = { to: email, token, expiresAt };
    const result = await this.emailAdapter.sendVerificationEmail(payload);

    if (!result.accepted) {
      this.logger.error({ email, providerResponse: result.providerResponse }, "password_reset_email_delivery_failed");
    }
  }
}
