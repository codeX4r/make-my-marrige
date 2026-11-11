import { Schema } from "mongoose";

export const WORKSPACE_LIFECYCLE_STATUSES = [
  "SETUP_IN_PROGRESS",
  "TWO_CO_OWNERS_ACTIVE",
  "ACTIVE",
  "POST_WEDDING",
  "CANCELLED",
] as const;

const CoupleNamesSchema = new Schema(
  {
    first: { type: String, trim: true, maxlength: 100 },
    second: { type: String, trim: true, maxlength: 100 },
  },
  { _id: false, strict: "throw" },
);

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export const WeddingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    coupleNames: { type: CoupleNamesSchema, default: undefined },
    primaryCity: { type: String, trim: true, maxlength: 120, default: "Kanpur" },
    description: { type: String, trim: true, maxlength: 1000 },
    weddingDate: {
      type: String,
      required: true,
      validate: {
        validator: isCalendarDate,
        message: "weddingDate must be a valid YYYY-MM-DD date.",
      },
    },
    timezone: { type: String, required: true, enum: ["Asia/Kolkata"], default: "Asia/Kolkata" },
    lifecycleStatus: {
      type: String,
      required: true,
      enum: WORKSPACE_LIFECYCLE_STATUSES,
      default: "SETUP_IN_PROGRESS",
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    deletionDueAt: { type: Date, default: null },
  },
  {
    collection: "weddings",
    timestamps: true,
    versionKey: "version",
    optimisticConcurrency: true,
    strict: "throw",
  },
);

WeddingSchema.index({ createdByUserId: 1, createdAt: -1 }, { name: "ix_weddings_creator_created" });
