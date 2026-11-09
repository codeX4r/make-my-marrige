import { Schema } from "mongoose";

export const CO_OWNER_INVITATION_STATUSES = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export const CO_OWNER_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const CoOwnerInvitationSchema = new Schema(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      immutable: true,
    },
    invitedEmailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 320,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      immutable: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["CO_OWNER"],
      default: "CO_OWNER",
      immutable: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
      match: /^[a-f0-9]{64}$/,
      immutable: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + CO_OWNER_INVITATION_TTL_MS),
      immutable: true,
    },
    status: {
      type: String,
      required: true,
      enum: CO_OWNER_INVITATION_STATUSES,
      default: "PENDING",
    },
    createdByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
      immutable: true,
    },
    acceptedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    acceptedAt: { type: Date, default: null },
    revokedByMembershipId: { type: Schema.Types.ObjectId, ref: "Membership", default: null },
    revokedAt: { type: Date, default: null },
  },
  {
    collection: "invitations",
    timestamps: true,
    versionKey: "version",
    optimisticConcurrency: true,
    strict: "throw",
  },
);

CoOwnerInvitationSchema.index(
  { tokenHash: 1 },
  { unique: true, name: "uq_invitations_token_hash" },
);
CoOwnerInvitationSchema.index(
  { weddingId: 1, invitedEmailNormalized: 1, status: 1 },
  { name: "ix_invitations_wedding_email_status" },
);
CoOwnerInvitationSchema.index(
  { weddingId: 1, status: 1, expiresAt: 1 },
  { name: "ix_invitations_wedding_status_expiry" },
);

CoOwnerInvitationSchema.pre("validate", function () {
  const wasAccepted = this.status === "ACCEPTED";
  const hasAcceptanceMetadata = this.acceptedByUserId != null && this.acceptedAt instanceof Date;

  if (wasAccepted !== hasAcceptanceMetadata) {
    this.invalidate(
      "acceptedAt",
      "Accepted invitations require acceptance metadata; other states cannot retain it.",
    );
  }
});
