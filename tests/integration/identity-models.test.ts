import { randomUUID } from "node:crypto";
import mongoose, { type Connection } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerIdentityModels } from "../../apps/api/src/identity/persistence/index.js";
import {
  generateCoOwnerInvitationToken,
  hashCoOwnerInvitationToken,
} from "../../apps/api/src/identity/persistence/co-owner-invitation-token.js";

function isolatedDatabaseUri(baseUri: string): string {
  const parsed = new URL(baseUri);
  const originalDatabase =
    decodeURIComponent(parsed.pathname.replace(/^\/+/, "")) || "makemymarrige";
  parsed.pathname = `/${originalDatabase}_m21_${randomUUID().replaceAll("-", "")}`;
  return parsed.toString();
}

const baseMongoUri =
  process.env.MONGODB_URI ??
  "mongodb://127.0.0.1:27018/makemymarrige?replicaSet=rs0&directConnection=true";
const connection: Connection = mongoose.createConnection(isolatedDatabaseUri(baseMongoUri), {
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 5_000,
});
const models = registerIdentityModels(connection);

function uniqueEmail(): string {
  return `identity-${randomUUID()}@example.test`;
}

async function createUser(email = uniqueEmail()) {
  return models.User.create({ emailNormalized: email, displayName: "Test Member" });
}

async function createWedding(createdByUserId: mongoose.Types.ObjectId, name = randomUUID()) {
  return models.Wedding.create({
    name,
    weddingDate: "2027-02-14",
    createdByUserId,
  });
}

async function createMembership(
  userId: mongoose.Types.ObjectId,
  weddingId: mongoose.Types.ObjectId,
  status: "ACTIVE" | "SUSPENDED" | "ENDED" = "ACTIVE",
) {
  return models.Membership.create({ userId, weddingId, memberType: "CO_OWNER", status });
}

beforeAll(async () => {
  await connection.asPromise();
  await Promise.all([
    models.User.createIndexes(),
    models.ProviderIdentity.createIndexes(),
    models.Wedding.createIndexes(),
    models.Membership.createIndexes(),
    models.MembershipPeriodEvent.createIndexes(),
    models.CoOwnerInvitation.createIndexes(),
  ]);
});

afterAll(async () => {
  if (connection.readyState === 1) {
    await connection.dropDatabase();
  }
  await connection.close();
});

describe("identity and workspace MongoDB models", () => {
  it("creates a user and enforces unique normalized email", async () => {
    const email = uniqueEmail();
    const user = await createUser(email.toUpperCase());
    expect(user.emailNormalized).toBe(email);

    await expect(createUser(email)).rejects.toMatchObject({ code: 11000 });
  });

  it("enforces provider-subject uniqueness across user accounts", async () => {
    const first = await createUser();
    const second = await createUser();
    const providerSubject = `google-sub-${randomUUID()}`;
    await models.ProviderIdentity.create({
      userId: first._id,
      provider: "GOOGLE",
      providerSubject,
    });

    await expect(
      models.ProviderIdentity.create({ userId: second._id, provider: "GOOGLE", providerSubject }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("creates a wedding and its initial membership in one transaction", async () => {
    const user = await createUser();
    const session = await connection.startSession();
    let weddingId: mongoose.Types.ObjectId | undefined;

    try {
      await session.withTransaction(async () => {
        const wedding = new models.Wedding({
          name: "Transactional Wedding",
          weddingDate: "2027-04-03",
          createdByUserId: user._id,
        });
        await wedding.save({ session });
        weddingId = wedding._id;

        const membership = new models.Membership({
          userId: user._id,
          weddingId: wedding._id,
          memberType: "CO_OWNER",
          status: "ACTIVE",
        });
        await membership.save({ session });
        await models.MembershipPeriodEvent.create(
          [
            {
              weddingId: wedding._id,
              membershipId: membership._id,
              eventType: "JOINED",
              actorUserId: user._id,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    if (!weddingId) throw new Error("The workspace transaction did not assign its wedding ID.");
    expect(await models.Wedding.countDocuments({ _id: weddingId })).toBe(1);
    expect(await models.Membership.countDocuments({ userId: user._id, weddingId })).toBe(1);
    expect(await models.MembershipPeriodEvent.countDocuments({ weddingId })).toBe(1);
  });

  it("prevents duplicate durable membership records for a user and wedding", async () => {
    const user = await createUser();
    const wedding = await createWedding(user._id);
    await createMembership(user._id, wedding._id, "ENDED");

    await expect(createMembership(user._id, wedding._id)).rejects.toMatchObject({ code: 11000 });
  });

  it("enforces the single-membership slot for ACTIVE and SUSPENDED memberships", async () => {
    for (const status of ["ACTIVE", "SUSPENDED"] as const) {
      const user = await createUser();
      const firstWedding = await createWedding(user._id);
      const secondWedding = await createWedding(user._id);
      await createMembership(user._id, firstWedding._id, status);

      await expect(createMembership(user._id, secondWedding._id, "ACTIVE")).rejects.toMatchObject({
        code: 11000,
      });
    }
  });

  it("allows another wedding membership after the previous one has ENDED", async () => {
    const user = await createUser();
    const firstWedding = await createWedding(user._id);
    const secondWedding = await createWedding(user._id);
    await createMembership(user._id, firstWedding._id, "ENDED");

    const newMembership = await createMembership(user._id, secondWedding._id);
    expect(newMembership.status).toBe("ACTIVE");
  });

  it("reuses the same wedding membership and appends a new period on rejoin", async () => {
    const user = await createUser();
    const wedding = await createWedding(user._id);
    const membership = await createMembership(user._id, wedding._id, "ENDED");
    await models.MembershipPeriodEvent.create([
      {
        weddingId: wedding._id,
        membershipId: membership._id,
        eventType: "JOINED",
        actorUserId: user._id,
      },
      {
        weddingId: wedding._id,
        membershipId: membership._id,
        eventType: "ENDED",
        actorUserId: user._id,
      },
    ]);

    const rejoined = await models.Membership.findOneAndUpdate(
      { _id: membership._id, status: "ENDED" },
      { $set: { status: "ACTIVE", joinedAt: new Date(), endedAt: null }, $inc: { version: 1 } },
      { new: true, runValidators: true },
    );
    expect(rejoined?._id.toString()).toBe(membership._id.toString());
    await models.MembershipPeriodEvent.create({
      weddingId: wedding._id,
      membershipId: membership._id,
      eventType: "JOINED",
      actorUserId: user._id,
    });

    expect(
      await models.Membership.countDocuments({ userId: user._id, weddingId: wedding._id }),
    ).toBe(1);
    expect(
      await models.MembershipPeriodEvent.countDocuments({ membershipId: membership._id }),
    ).toBe(3);
  });

  it("enforces unique invitation token hashes", async () => {
    const user = await createUser();
    const wedding = await createWedding(user._id);
    const membership = await createMembership(user._id, wedding._id);
    const tokenHash = hashCoOwnerInvitationToken(generateCoOwnerInvitationToken());
    const invitation = {
      weddingId: wedding._id,
      invitedEmailNormalized: uniqueEmail(),
      tokenHash,
      createdByMembershipId: membership._id,
    };
    await models.CoOwnerInvitation.create(invitation);

    await expect(
      models.CoOwnerInvitation.create({ ...invitation, invitedEmailNormalized: uniqueEmail() }),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it("rejects expired invitations and atomically allows only one acceptance", async () => {
    const user = await createUser();
    const wedding = await createWedding(user._id);
    const membership = await createMembership(user._id, wedding._id);
    const expired = await models.CoOwnerInvitation.create({
      weddingId: wedding._id,
      invitedEmailNormalized: uniqueEmail(),
      tokenHash: hashCoOwnerInvitationToken(generateCoOwnerInvitationToken()),
      createdByMembershipId: membership._id,
      expiresAt: new Date(Date.now() - 1000),
    });
    const expiredClaim = await models.CoOwnerInvitation.findOneAndUpdate(
      { _id: expired._id, status: "PENDING", expiresAt: { $gt: new Date() } },
      { $set: { status: "ACCEPTED", acceptedAt: new Date(), acceptedByUserId: user._id } },
      { new: true },
    );
    expect(expiredClaim).toBeNull();

    const valid = await models.CoOwnerInvitation.create({
      weddingId: wedding._id,
      invitedEmailNormalized: uniqueEmail(),
      tokenHash: hashCoOwnerInvitationToken(generateCoOwnerInvitationToken()),
      createdByMembershipId: membership._id,
    });
    const accept = () =>
      models.CoOwnerInvitation.findOneAndUpdate(
        { _id: valid._id, status: "PENDING", expiresAt: { $gt: new Date() } },
        { $set: { status: "ACCEPTED", acceptedAt: new Date(), acceptedByUserId: user._id } },
        { new: true },
      );
    const results = await Promise.all([accept(), accept()]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(
      await models.CoOwnerInvitation.countDocuments({ _id: valid._id, status: "ACCEPTED" }),
    ).toBe(1);
  });

  it("rolls back all workspace writes when a transaction fails partway through", async () => {
    const user = await createUser();
    const name = `rollback-${randomUUID()}`;
    const session = await connection.startSession();

    try {
      await expect(
        session.withTransaction(async () => {
          const wedding = new models.Wedding({
            name,
            weddingDate: "2027-07-11",
            createdByUserId: user._id,
          });
          await wedding.save({ session });
          const membership = new models.Membership({
            userId: user._id,
            weddingId: wedding._id,
            memberType: "CO_OWNER",
          });
          await membership.save({ session });
          throw new Error("simulated partial-workspace failure");
        }),
      ).rejects.toThrow("simulated partial-workspace failure");
    } finally {
      await session.endSession();
    }

    expect(await models.Wedding.countDocuments({ name })).toBe(0);
    expect(await models.Membership.countDocuments({ userId: user._id })).toBe(0);
  });

  it("allows only one of two concurrent cross-wedding membership transactions", async () => {
    const user = await createUser();
    const attempt = (name: string) => {
      const session = connection.startSession();
      return session.then(async (transactionSession) => {
        try {
          await transactionSession.withTransaction(async () => {
            const wedding = new models.Wedding({
              name,
              weddingDate: "2027-08-21",
              createdByUserId: user._id,
            });
            await wedding.save({ session: transactionSession });
            const membership = new models.Membership({
              userId: user._id,
              weddingId: wedding._id,
              memberType: "CO_OWNER",
              status: "ACTIVE",
            });
            await membership.save({ session: transactionSession });
          });
        } finally {
          await transactionSession.endSession();
        }
      });
    };

    const results = await Promise.allSettled([
      attempt(`concurrent-a-${randomUUID()}`),
      attempt(`concurrent-b-${randomUUID()}`),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await models.Membership.countDocuments({ userId: user._id, status: "ACTIVE" })).toBe(1);
    expect(await models.Wedding.countDocuments({ createdByUserId: user._id })).toBe(1);
  });
});
