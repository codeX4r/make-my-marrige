import { Schema } from "mongoose";

export const EMAIL_VERIFICATION_TOKEN_STATUSES = ["PENDING", "CONSUMED", "EXPIRED"] as const;

const commonOptions = {
  timestamps: true,
  versionKey: "version",
  optimisticConcurrency: true,
  strict: "throw" as const,
};

export const EmailVerificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    tokenHash: { type: String, required: true, immutable: true, select: false },
    status: {
      type: String,
      required: true,
      enum: EMAIL_VERIFICATION_TOKEN_STATUSES,
      default: "PENDING",
    },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    resendCount: { type: Number, required: true, default: 0, min: 0 },
    lastResentAt: { type: Date, default: null },
  },
  { collection: "emailVerificationTokens", ...commonOptions },
);

EmailVerificationTokenSchema.index(
  { userId: 1, status: 1, expiresAt: 1 },
  { name: "ix_email_verification_tokens_user_status_expiry" },
);
EmailVerificationTokenSchema.index(
  { tokenHash: 1 },
  { unique: true, name: "uq_email_verification_tokens_hash" },
);
