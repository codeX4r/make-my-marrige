import { Schema } from "mongoose";

export const MEMBER_SESSION_FAMILY_STATUSES = ["ACTIVE", "REVOKED"] as const;
export const MEMBER_REFRESH_SESSION_STATUSES = ["ACTIVE", "ROTATED", "REVOKED", "EXPIRED"] as const;

const commonOptions = {
  timestamps: true,
  versionKey: "version",
  optimisticConcurrency: true,
  strict: "throw" as const,
};

export const MemberSessionFamilySchema = new Schema(
  {
    familyId: { type: String, required: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    status: {
      type: String,
      required: true,
      enum: MEMBER_SESSION_FAMILY_STATUSES,
      default: "ACTIVE",
    },
    lastUsedAt: { type: Date, required: true, default: Date.now },
    revokedAt: { type: Date, default: null },
    revocationReason: { type: String, default: null, maxlength: 80 },
    reuseDetectedAt: { type: Date, default: null },
  },
  { collection: "memberSessionFamilies", ...commonOptions },
);

MemberSessionFamilySchema.index(
  { familyId: 1 },
  { unique: true, name: "uq_member_session_families_id" },
);
MemberSessionFamilySchema.index(
  { userId: 1, status: 1 },
  { name: "ix_member_session_families_user_status" },
);

export const MemberRefreshSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, immutable: true },
    familyId: { type: String, required: true, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    refreshTokenHash: { type: String, required: true, immutable: true, select: false },
    csrfTokenHash: { type: String, required: true, select: false },
    status: {
      type: String,
      required: true,
      enum: MEMBER_REFRESH_SESSION_STATUSES,
      default: "ACTIVE",
    },
    issuedAt: { type: Date, required: true, default: Date.now, immutable: true },
    lastUsedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    rotatedAt: { type: Date, default: null },
    replacedBySessionId: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    revocationReason: { type: String, default: null, maxlength: 80 },
  },
  { collection: "memberRefreshSessions", ...commonOptions },
);

MemberRefreshSessionSchema.index(
  { sessionId: 1 },
  { unique: true, name: "uq_member_refresh_sessions_id" },
);
MemberRefreshSessionSchema.index(
  { refreshTokenHash: 1 },
  { unique: true, name: "uq_member_refresh_sessions_token_hash" },
);
MemberRefreshSessionSchema.index(
  { userId: 1, status: 1, expiresAt: 1 },
  { name: "ix_member_refresh_sessions_user_status_expiry" },
);
MemberRefreshSessionSchema.index(
  { familyId: 1, status: 1, expiresAt: 1 },
  { name: "ix_member_refresh_sessions_family_status_expiry" },
);

export const AuthSessionAuditEventSchema = new Schema(
  {
    eventId: { type: String, required: true, immutable: true },
    eventType: { type: String, required: true, immutable: true, maxlength: 80 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    familyId: { type: String, required: true, immutable: true },
    sessionId: { type: String, default: null, immutable: true },
    occurredAt: { type: Date, required: true, immutable: true },
  },
  { collection: "authSessionAuditEvents", ...commonOptions },
);

AuthSessionAuditEventSchema.index(
  { eventId: 1 },
  { unique: true, name: "uq_auth_session_audit_events_id" },
);
AuthSessionAuditEventSchema.index(
  { userId: 1, occurredAt: -1 },
  { name: "ix_auth_session_audit_events_user_time" },
);
