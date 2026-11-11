import { Schema } from "mongoose";

export const MEMBERSHIP_ROLES = ["CO_OWNER", "ORGANISER", "TREASURER"] as const;
export const MEMBERSHIP_STATUSES = ["ACTIVE", "SUSPENDED", "ENDED"] as const;
export const MEMBERSHIP_PERIOD_EVENT_TYPES = [
  "JOINED",
  "SUSPENDED",
  "REACTIVATED",
  "ENDED",
] as const;

export const MembershipSchema = new Schema(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
      immutable: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    memberType: { type: String, required: true, enum: MEMBERSHIP_ROLES },
    status: { type: String, required: true, enum: MEMBERSHIP_STATUSES, default: "ACTIVE" },
    joinedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  {
    collection: "weddingMemberships",
    timestamps: true,
    versionKey: "version",
    optimisticConcurrency: true,
    strict: "throw",
  },
);

// One durable membership record per user/wedding pair allows rejoining the same wedding.
MembershipSchema.index(
  { userId: 1, weddingId: 1 },
  { unique: true, name: "uq_memberships_user_wedding" },
);

// ACTIVE and SUSPENDED both occupy the user's single wedding-membership slot.
MembershipSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["ACTIVE", "SUSPENDED"] } },
    name: "uq_memberships_one_active_or_suspended_per_user",
  },
);

MembershipSchema.index(
  { weddingId: 1 },
  {
    unique: true,
    partialFilterExpression: { memberType: "TREASURER", status: "ACTIVE" },
    name: "uq_memberships_one_active_treasurer_per_wedding",
  },
);
MembershipSchema.index(
  { weddingId: 1, status: 1, memberType: 1 },
  { name: "ix_memberships_wedding_status_role" },
);

export const MembershipPeriodEventSchema = new Schema(
  {
    weddingId: { type: Schema.Types.ObjectId, ref: "Wedding", required: true, immutable: true },
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
      immutable: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: MEMBERSHIP_PERIOD_EVENT_TYPES,
      immutable: true,
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
    reason: { type: String, trim: true, maxlength: 500, immutable: true },
    occurredAt: { type: Date, required: true, default: Date.now, immutable: true },
  },
  {
    collection: "membershipPeriodEvents",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    strict: "throw",
  },
);

MembershipPeriodEventSchema.index(
  { weddingId: 1, membershipId: 1, occurredAt: 1, _id: 1 },
  { name: "ix_membership_period_events_history" },
);
