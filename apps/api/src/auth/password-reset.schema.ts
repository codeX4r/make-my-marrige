import { Schema } from "mongoose";

export const PASSWORD_RESET_TOKEN_STATUSES = ["PENDING", "CONSUMED", "EXPIRED"] as const;

const commonOptions = {
  timestamps: true,
  versionKey: "version",
  optimisticConcurrency: true,
  strict: "throw" as const,
};

export const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    tokenHash: { type: String, required: true, immutable: true, select: false },
    status: {
      type: String,
      required: true,
      enum: PASSWORD_RESET_TOKEN_STATUSES,
      default: "PENDING",
    },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    requestCount: { type: Number, required: true, default: 0, min: 0 },
    lastRequestedAt: { type: Date, default: null },
  },
  { collection: "passwordResetTokens", ...commonOptions },
);

PasswordResetTokenSchema.index(
  { userId: 1, status: 1, expiresAt: 1 },
  { name: "ix_password_reset_tokens_user_status_expiry" },
);
PasswordResetTokenSchema.index(
  { tokenHash: 1 },
  { unique: true, name: "uq_password_reset_tokens_hash" },
);

export const PASSWORD_RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;
export const MAX_PASSWORD_RESET_REQUESTS_PER_HOUR = 3;
