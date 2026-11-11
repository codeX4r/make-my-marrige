import mongoose from "mongoose";
import { afterAll, describe, expect, it } from "vitest";
import {
  CO_OWNER_INVITATION_TTL_MS,
  CoOwnerInvitationSchema,
} from "./co-owner-invitation.schema.js";
import {
  CO_OWNER_INVITATION_TOKEN_BYTES,
  generateCoOwnerInvitationToken,
  hashCoOwnerInvitationToken,
} from "./co-owner-invitation-token.js";
import { MembershipPeriodEventSchema, MembershipSchema } from "./membership.schema.js";
import { registerIdentityModels } from "./index.js";
import { ProviderIdentitySchema, UserSchema } from "./user.schema.js";

const connection = mongoose.createConnection();
const models = registerIdentityModels(connection);

afterAll(async () => {
  await connection.close();
});

describe("identity and workspace persistence schemas", () => {
  it("normalizes user email and requires verification status to agree with its timestamp", async () => {
    const user = new models.User({
      emailNormalized: "  Couple@Example.test ",
      displayName: "Couple",
    });
    expect(user.emailNormalized).toBe("couple@example.test");
    await expect(user.validate()).resolves.toBeUndefined();

    user.emailVerificationStatus = "VERIFIED";
    await expect(user.validate()).rejects.toThrow(
      "Email verification status and timestamp must agree",
    );

    user.emailVerifiedAt = new Date();
    await expect(user.validate()).resolves.toBeUndefined();
  });

  it("defines unique global email and provider-subject constraints", () => {
    expect(UserSchema.indexes()).toContainEqual([
      { emailNormalized: 1 },
      expect.objectContaining({ unique: true, name: "uq_users_email_normalized" }),
    ]);
    expect(ProviderIdentitySchema.indexes()).toContainEqual([
      { provider: 1, providerSubject: 1 },
      expect.objectContaining({ unique: true, name: "uq_provider_identities_provider_subject" }),
    ]);
    expect(ProviderIdentitySchema.path("providerSubject").options.select).toBe(false);
  });

  it("validates workspace date/timezone and retains documented lifecycle literals", async () => {
    const wedding = new models.Wedding({
      name: "Wedding",
      weddingDate: "2027-02-29",
      createdByUserId: new mongoose.Types.ObjectId(),
    });
    await expect(wedding.validate()).rejects.toThrow("valid YYYY-MM-DD date");

    wedding.weddingDate = "2028-02-29";
    wedding.lifecycleStatus = "TWO_CO_OWNERS_ACTIVE";
    await expect(wedding.validate()).resolves.toBeUndefined();
  });

  it("defines membership slot, relationship, treasurer and append-only history indexes", () => {
    const indexes = MembershipSchema.indexes();
    expect(indexes).toContainEqual([
      { userId: 1, weddingId: 1 },
      expect.objectContaining({ unique: true, name: "uq_memberships_user_wedding" }),
    ]);
    expect(indexes).toContainEqual([
      { userId: 1 },
      expect.objectContaining({
        unique: true,
        partialFilterExpression: { status: { $in: ["ACTIVE", "SUSPENDED"] } },
      }),
    ]);
    expect(indexes).toContainEqual([
      { weddingId: 1 },
      expect.objectContaining({
        unique: true,
        partialFilterExpression: { memberType: "TREASURER", status: "ACTIVE" },
      }),
    ]);
    expect(MembershipPeriodEventSchema.path("eventType")).toBeDefined();
  });

  it("stores fixed-role invitation metadata without a raw token and uses the approved expiry", async () => {
    const rawToken = generateCoOwnerInvitationToken();
    const invitation = new models.CoOwnerInvitation({
      weddingId: new mongoose.Types.ObjectId(),
      invitedEmailNormalized: " Owner@Example.test ",
      tokenHash: hashCoOwnerInvitationToken(rawToken),
      createdByMembershipId: new mongoose.Types.ObjectId(),
    });

    expect(invitation.invitedEmailNormalized).toBe("owner@example.test");
    expect(invitation.role).toBe("CO_OWNER");
    expect(invitation.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      CO_OWNER_INVITATION_TTL_MS - 1000,
    );
    expect(CoOwnerInvitationSchema.path("token")).toBeUndefined();
    expect(rawToken).toHaveLength(Math.ceil((CO_OWNER_INVITATION_TOKEN_BYTES * 8) / 6));
    expect(invitation.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    await expect(invitation.validate()).resolves.toBeUndefined();

    invitation.role = "ORGANISER" as "CO_OWNER";
    await expect(invitation.validate()).rejects.toThrow();

    invitation.role = "CO_OWNER";
    invitation.status = "ACCEPTED";
    await expect(invitation.validate()).rejects.toThrow(
      "Accepted invitations require acceptance metadata",
    );

    invitation.acceptedByUserId = new mongoose.Types.ObjectId();
    invitation.acceptedAt = new Date();
    await expect(invitation.validate()).resolves.toBeUndefined();
  });
});
