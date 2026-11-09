import { Schema } from "mongoose";

export const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED", "CLOSED"] as const;
export const EMAIL_VERIFICATION_STATUSES = ["UNVERIFIED", "VERIFIED"] as const;
export const IDENTITY_PROVIDERS = ["GOOGLE"] as const;

export const UserSchema = new Schema(
  {
    emailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 320,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, select: false },
    emailVerificationStatus: {
      type: String,
      required: true,
      enum: EMAIL_VERIFICATION_STATUSES,
      default: "UNVERIFIED",
    },
    emailVerifiedAt: { type: Date, default: null },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    accountStatus: {
      type: String,
      required: true,
      enum: ACCOUNT_STATUSES,
      default: "ACTIVE",
    },
  },
  {
    collection: "users",
    timestamps: true,
    versionKey: "version",
    optimisticConcurrency: true,
    strict: "throw",
  },
);

UserSchema.index({ emailNormalized: 1 }, { unique: true, name: "uq_users_email_normalized" });

UserSchema.pre("validate", function () {
  const isVerified = this.emailVerificationStatus === "VERIFIED";
  if (isVerified !== this.emailVerifiedAt instanceof Date) {
    this.invalidate("emailVerifiedAt", "Email verification status and timestamp must agree.");
  }
});

export const ProviderIdentitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    provider: { type: String, required: true, enum: IDENTITY_PROVIDERS, immutable: true },
    providerSubject: { type: String, required: true, trim: true, select: false, immutable: true },
    linkedAt: { type: Date, required: true, default: Date.now, immutable: true },
  },
  {
    collection: "providerIdentities",
    timestamps: true,
    versionKey: "version",
    strict: "throw",
  },
);

ProviderIdentitySchema.index(
  { provider: 1, providerSubject: 1 },
  { unique: true, name: "uq_provider_identities_provider_subject" },
);
ProviderIdentitySchema.index({ userId: 1, provider: 1 }, { name: "ix_provider_identities_user" });
