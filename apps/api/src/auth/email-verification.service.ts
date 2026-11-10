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

export const EMAIL_VERIFICATION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
export const MAX_RESENDS_PER_TOKEN = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000;

type EmailVerificationTokenMaterial = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

function newEmailVerificationToken(now: Date): EmailVerificationTokenMaterial {
  const token = `mmm_verify_${generateOpaqueToken()}`;
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_LIFETIME_MS),
  };
}

interface TransactionResult {
  shouldSend: boolean;
  email?: string;
  token?: string;
  expiresAt?: Date;
}

@Injectable()
export class EmailVerificationService {
  private readonly models;
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @Inject(MONGO_CONNECTION) private readonly connection: Connection,
    private readonly emailAdapter: BrevoEmailAdapter,
  ) {
    this.models = registerIdentityModels(connection);
  }

  async verify(token: string, now = new Date()): Promise<{ verified: true }> {
    if (!token || typeof token !== "string") {
      throw new BadRequestException("Verification token is required.");
    }

    const tokenHash = hashToken(token);
    const databaseSession = await this.connection.startSession();

    try {
      return await databaseSession.withTransaction(async () => {
        const record = await this.models.EmailVerificationToken.findOne({ tokenHash })
          .select("+tokenHash")
          .session(databaseSession);

        if (!record) {
          throw new NotFoundException("Verification token not found.");
        }

        if (record.status !== "PENDING") {
          throw new ConflictException("Verification token has already been used or expired.");
        }

        if (record.expiresAt <= now) {
          await this.models.EmailVerificationToken.updateOne(
            { _id: record._id, status: "PENDING" },
            { $set: { status: "EXPIRED" } },
            { session: databaseSession },
          );
          throw new ConflictException("Verification token has expired.");
        }

        const user = await this.models.User.findOne({
          _id: record.userId,
          emailVerificationStatus: "UNVERIFIED",
        }).session(databaseSession);

        if (!user) {
          throw new NotFoundException("User account not found or already verified.");
        }

        const updatedToken = await this.models.EmailVerificationToken.findOneAndUpdate(
          { _id: record._id, status: "PENDING", expiresAt: { $gt: now } },
          { $set: { status: "CONSUMED", consumedAt: now } },
          { new: true, session: databaseSession },
        );

        if (!updatedToken) {
          throw new ConflictException("Verification token conflict or concurrent consumption.");
        }

        await this.models.User.updateOne(
          { _id: user._id, emailVerificationStatus: "UNVERIFIED" },
          { $set: { emailVerificationStatus: "VERIFIED", emailVerifiedAt: now } },
          { session: databaseSession },
        );

        this.logger.debug({ userId: user._id.toString() }, "email_verified");

        return { verified: true };
      });
    } finally {
      await databaseSession.endSession();
    }
  }

  async resend(email: string, now = new Date()): Promise<{ resent: true }> {
    const emailNormalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
      throw new BadRequestException("Invalid email address.");
    }

    const databaseSession = await this.connection.startSession();

    try {
      const result: TransactionResult = await databaseSession.withTransaction(async () => {
        const user = await this.models.User.findOne({ emailNormalized, emailVerificationStatus: "UNVERIFIED" })
          .select("_id emailNormalized")
          .session(databaseSession);

        if (!user) {
          return { shouldSend: false };
        }

        const existingToken = await this.models.EmailVerificationToken.findOne({
          userId: user._id,
          status: "PENDING",
        }).session(databaseSession);

        if (existingToken) {
          if (existingToken.resendCount >= MAX_RESENDS_PER_TOKEN) {
            throw new HttpException("Maximum resend limit reached. Please wait for the token to expire or request a new registration.", HttpStatus.TOO_MANY_REQUESTS);
          }

          if (existingToken.lastResentAt && (now.getTime() - existingToken.lastResentAt.getTime()) < RESEND_COOLDOWN_MS) {
            throw new HttpException("Please wait before requesting another verification email.", HttpStatus.TOO_MANY_REQUESTS);
          }

          const newTokenMaterial = newEmailVerificationToken(now);
          await this.models.EmailVerificationToken.updateOne(
            { _id: existingToken._id, status: "PENDING" },
            {
              $set: {
                tokenHash: newTokenMaterial.tokenHash,
                expiresAt: newTokenMaterial.expiresAt,
                lastResentAt: now,
              },
              $inc: { resendCount: 1 },
            },
            { session: databaseSession },
          );

          this.logger.debug({ userId: user._id.toString(), resendCount: existingToken.resendCount + 1 }, "verification_email_resent");
          return {
            shouldSend: true,
            email: user.emailNormalized,
            token: newTokenMaterial.token,
            expiresAt: newTokenMaterial.expiresAt,
          };
        }

        const tokenMaterial = newEmailVerificationToken(now);
        await this.models.EmailVerificationToken.create(
          [
            {
              userId: user._id,
              tokenHash: tokenMaterial.tokenHash,
              status: "PENDING",
              expiresAt: tokenMaterial.expiresAt,
              resendCount: 0,
              lastResentAt: now,
            },
          ],
          { session: databaseSession },
        );

        this.logger.debug({ userId: user._id.toString() }, "verification_email_sent");
        return {
          shouldSend: true,
          email: user.emailNormalized,
          token: tokenMaterial.token,
          expiresAt: tokenMaterial.expiresAt,
        };
      });

      // Send verification email outside the transaction
      if (result.shouldSend && result.email && result.token && result.expiresAt) {
        await this.sendVerificationEmail(result.email, result.token, result.expiresAt);
      }

      return { resent: true };
    } finally {
      await databaseSession.endSession();
    }
  }

  private async sendVerificationEmail(email: string, token: string, expiresAt: Date): Promise<void> {
    const payload: VerificationEmailPayload = { to: email, token, expiresAt };
    const result = await this.emailAdapter.sendVerificationEmail(payload);

    if (!result.accepted) {
      this.logger.error({ email, providerResponse: result.providerResponse }, "verification_email_delivery_failed");
    }
  }
}