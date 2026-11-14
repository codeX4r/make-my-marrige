import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { ClientSession, Connection, Types } from "mongoose";
import { MONGO_CONNECTION } from "../database/database.module.js";
import { registerIdentityModels } from "../identity/persistence/index.js";
import { AccessTokenService } from "./access-token.service.js";
import type { SessionTokens } from "./auth.types.js";
import { generateOpaqueToken, hashToken, hashesMatch } from "./token-secrets.js";

export const REFRESH_TOKEN_INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class MemberSessionService {
  private readonly models;

  constructor(
    @Inject(MONGO_CONNECTION) private readonly connection: Connection,
    private readonly accessTokens: AccessTokenService,
  ) {
    this.models = registerIdentityModels(connection);
  }

  async create(userId: Types.ObjectId | string, now = new Date()): Promise<SessionTokens> {
    const user = await this.models.User.findOne({ _id: userId, accountStatus: "ACTIVE" }).lean();
    if (!user) throw unauthorized();

    const material = newSessionMaterial(user._id.toString(), now);
    const databaseSession = await this.connection.startSession();
    try {
      await databaseSession.withTransaction(async () => {
        await this.models.MemberSessionFamily.create(
          [
            {
              familyId: material.familyId,
              userId: user._id,
              status: "ACTIVE",
              lastUsedAt: now,
            },
          ],
          { session: databaseSession },
        );
        await this.models.MemberRefreshSession.create(
          [
            {
              sessionId: material.sessionId,
              familyId: material.familyId,
              userId: user._id,
              refreshTokenHash: hashToken(material.refreshToken),
              csrfTokenHash: hashToken(material.csrfToken),
              status: "ACTIVE",
              issuedAt: now,
              lastUsedAt: now,
              expiresAt: material.refreshExpiresAt,
            },
          ],
          { session: databaseSession },
        );
        await this.recordEvent(
          "SESSION_CREATED",
          user._id,
          material.familyId,
          material.sessionId,
          now,
          databaseSession,
        );
      });
    } finally {
      await databaseSession.endSession();
    }
    return this.toTokens(material, user._id.toString());
  }

  async refresh(refreshToken: string, now = new Date()): Promise<SessionTokens> {
    const refreshTokenHash = hashToken(refreshToken);
    const databaseSession = await this.connection.startSession();
    try {
      return await databaseSession.withTransaction(async () => {
        const existing = await this.models.MemberRefreshSession.findOne({ refreshTokenHash })
          .select("+refreshTokenHash")
          .session(databaseSession);
        if (!existing) throw unauthorized();

        if (existing.status !== "ACTIVE") {
          if (existing.status === "ROTATED" || existing.status === "REVOKED") {
            await this.revokeFamily(
              existing.familyId,
              existing.userId,
              "REFRESH_TOKEN_REUSE",
              now,
              databaseSession,
              existing.sessionId,
            );
          }
          throw unauthorized();
        }
        if (existing.expiresAt <= now) {
          await this.models.MemberRefreshSession.updateOne(
            { _id: existing._id, status: "ACTIVE", expiresAt: { $lte: now } },
            { $set: { status: "EXPIRED", revokedAt: now, revocationReason: "EXPIRED" } },
            { session: databaseSession },
          );
          throw unauthorized();
        }
        const family = await this.models.MemberSessionFamily.findOne({
          familyId: existing.familyId,
          userId: existing.userId,
          status: "ACTIVE",
        }).session(databaseSession);
        const user = await this.models.User.findOne({
          _id: existing.userId,
          accountStatus: "ACTIVE",
        }).session(databaseSession);
        if (!family || !user) throw unauthorized();

        const replacement = newSessionMaterial(existing.userId.toString(), now, existing.familyId);
        const transitioned = await this.models.MemberRefreshSession.findOneAndUpdate(
          { _id: existing._id, status: "ACTIVE", expiresAt: { $gt: now } },
          {
            $set: {
              status: "ROTATED",
              rotatedAt: now,
              lastUsedAt: now,
              replacedBySessionId: replacement.sessionId,
            },
          },
          { new: true, session: databaseSession },
        );
        if (!transitioned) {
          // A transaction retry will observe the committed ROTATED state and revoke the family.
          throw unauthorized();
        }
        await this.models.MemberRefreshSession.create(
          [
            {
              sessionId: replacement.sessionId,
              familyId: existing.familyId,
              userId: existing.userId,
              refreshTokenHash: hashToken(replacement.refreshToken),
              csrfTokenHash: hashToken(replacement.csrfToken),
              status: "ACTIVE",
              issuedAt: now,
              lastUsedAt: now,
              expiresAt: replacement.refreshExpiresAt,
            },
          ],
          { session: databaseSession },
        );
        await this.models.MemberSessionFamily.updateOne(
          { _id: family._id, status: "ACTIVE" },
          { $set: { lastUsedAt: now } },
          { session: databaseSession },
        );
        await this.recordEvent(
          "SESSION_REFRESHED",
          existing.userId,
          existing.familyId,
          replacement.sessionId,
          now,
          databaseSession,
        );
        return this.toTokens(replacement, existing.userId.toString());
      });
    } finally {
      await databaseSession.endSession();
    }
  }

  async revokeCurrentFamily(userId: string, sessionId: string, now = new Date()): Promise<void> {
    const databaseSession = await this.connection.startSession();
    try {
      await databaseSession.withTransaction(async () => {
        const current = await this.models.MemberRefreshSession.findOne({
          sessionId,
          userId,
        }).session(databaseSession);
        if (!current) throw unauthorized();
        await this.revokeFamily(
          current.familyId,
          current.userId,
          "CURRENT_SESSION_LOGOUT",
          now,
          databaseSession,
          sessionId,
        );
      });
    } finally {
      await databaseSession.endSession();
    }
  }

  async revokeAllForUser(
    userId: string,
    now = new Date(),
    databaseSession?: import("mongoose").ClientSession,
  ): Promise<void> {
    const session = databaseSession ?? (await this.connection.startSession());
    const ownsSession = !databaseSession;
    try {
      if (ownsSession) {
        await session.withTransaction(async () => {
          await this.revokeAllForUserInternal(userId, now, session);
        });
      } else {
        await this.revokeAllForUserInternal(userId, now, session);
      }
    } finally {
      if (ownsSession) {
        await session.endSession();
      }
    }
  }

  private async revokeAllForUserInternal(
    userId: string,
    now: Date,
    databaseSession: import("mongoose").ClientSession,
  ): Promise<void> {
    const families = await this.models.MemberSessionFamily.find({
      userId,
      status: "ACTIVE",
    }).session(databaseSession);
    for (const family of families) {
      await this.revokeFamily(
        family.familyId,
        family.userId,
        "SIGN_OUT_ALL",
        now,
        databaseSession,
        null,
      );
    }
  }

  async validateCsrf(sessionId: string, csrfToken: string, now = new Date()): Promise<boolean> {
    const session = await this.models.MemberRefreshSession.findOne({
      sessionId,
      status: "ACTIVE",
      expiresAt: { $gt: now },
    })
      .select("+csrfTokenHash")
      .lean();
    return Boolean(session && hashesMatch(session.csrfTokenHash, csrfToken));
  }

  async getUserById(userId: string): Promise<{
    userId: string;
    emailNormalized: string;
    displayName: string;
    emailVerificationStatus: string;
  }> {
    const user = await this.models.User.findOne({ _id: userId }).lean();
    if (!user) throw unauthorized();
    return {
      userId: user._id.toString(),
      emailNormalized: user.emailNormalized,
      displayName: user.displayName,
      emailVerificationStatus: user.emailVerificationStatus,
    };
  }

  async listUserSessions(
    userId: string,
  ): Promise<Array<{ sessionId: string; issuedAt: Date; lastUsedAt: Date; expiresAt: Date }>> {
    const sessions = await this.models.MemberRefreshSession.find({
      userId,
      status: "ACTIVE",
    }).lean();
    return sessions.map((s) => ({
      sessionId: s.sessionId,
      issuedAt: s.issuedAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string, now = new Date()): Promise<void> {
    const databaseSession = await this.connection.startSession();
    try {
      await databaseSession.withTransaction(async () => {
        const session = await this.models.MemberRefreshSession.findOne({
          sessionId,
          userId,
        }).session(databaseSession);
        if (!session) throw unauthorized();
        const family = await this.models.MemberSessionFamily.findOne({
          familyId: session.familyId,
          userId,
          status: "ACTIVE",
        }).session(databaseSession);
        if (family) {
          await this.revokeFamily(
            family.familyId,
            family.userId,
            "SINGLE_SESSION_REVOKE",
            now,
            databaseSession,
            sessionId,
          );
        }
      });
    } finally {
      await databaseSession.endSession();
    }
  }

  async findActiveSessionIdForRefresh(refreshToken: string, now = new Date()): Promise<string> {
    const session = await this.models.MemberRefreshSession.findOne({
      refreshTokenHash: hashToken(refreshToken),
      status: "ACTIVE",
      expiresAt: { $gt: now },
    })
      .select("sessionId")
      .lean();
    if (!session) throw unauthorized();
    return session.sessionId;
  }

  private async revokeFamily(
    familyId: string,
    userId: Types.ObjectId,
    reason: string,
    now: Date,
    databaseSession: ClientSession,
    sessionId: string | null,
  ): Promise<void> {
    await this.models.MemberSessionFamily.updateOne(
      { familyId, userId, status: "ACTIVE" },
      {
        $set: {
          status: "REVOKED",
          revokedAt: now,
          revocationReason: reason,
          ...(reason === "REFRESH_TOKEN_REUSE" ? { reuseDetectedAt: now } : {}),
        },
      },
      { session: databaseSession },
    );
    await this.models.MemberRefreshSession.updateMany(
      { familyId, userId, status: "ACTIVE" },
      { $set: { status: "REVOKED", revokedAt: now, revocationReason: reason } },
      { session: databaseSession },
    );
    await this.recordEvent(
      reason === "REFRESH_TOKEN_REUSE" ? "REFRESH_TOKEN_REUSE" : "SESSION_FAMILY_REVOKED",
      userId,
      familyId,
      sessionId,
      now,
      databaseSession,
    );
  }

  private async recordEvent(
    eventType: string,
    userId: Types.ObjectId,
    familyId: string,
    sessionId: string | null,
    occurredAt: Date,
    databaseSession: ClientSession,
  ): Promise<void> {
    await this.models.AuthSessionAuditEvent.create(
      [{ eventId: randomUUID(), eventType, userId, familyId, sessionId, occurredAt }],
      { session: databaseSession },
    );
  }

  private toTokens(material: SessionMaterial, userId: string): SessionTokens {
    return {
      accessToken: this.accessTokens.sign(userId, material.sessionId),
      refreshToken: material.refreshToken,
      csrfToken: material.csrfToken,
      sessionId: material.sessionId,
      familyId: material.familyId,
      refreshExpiresAt: material.refreshExpiresAt,
    };
  }
}

type SessionMaterial = {
  familyId: string;
  sessionId: string;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
};

function newSessionMaterial(userId: string, now: Date, familyId?: string): SessionMaterial {
  void userId;
  const generatedFamilyId = familyId ?? randomUUID();
  const generatedSessionId = randomUUID();
  return {
    familyId: generatedFamilyId,
    sessionId: generatedSessionId,
    refreshToken: generateOpaqueToken(),
    csrfToken: generateOpaqueToken(),
    refreshExpiresAt: new Date(now.getTime() + REFRESH_TOKEN_INACTIVITY_MS),
  };
}

function unauthorized(): UnauthorizedException {
  return new UnauthorizedException();
}
