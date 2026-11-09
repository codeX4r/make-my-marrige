import type { Connection, InferSchemaType, Model, Schema } from "mongoose";
import { CoOwnerInvitationSchema } from "./co-owner-invitation.schema.js";
import {
  AuthSessionAuditEventSchema,
  MemberRefreshSessionSchema,
  MemberSessionFamilySchema,
} from "./member-session.schema.js";
import { MembershipPeriodEventSchema, MembershipSchema } from "./membership.schema.js";
import { ProviderIdentitySchema, UserSchema } from "./user.schema.js";
import { WeddingSchema } from "./wedding.schema.js";

function getModel<T>(
  connection: Connection,
  name: string,
  schema: Schema<T>,
  collection: string,
): Model<T> {
  const existing = connection.models[name];
  return existing ? (existing as Model<T>) : connection.model<T>(name, schema, collection);
}

export function registerIdentityModels(connection: Connection) {
  return {
    User: getModel<InferSchemaType<typeof UserSchema>>(connection, "User", UserSchema, "users"),
    ProviderIdentity: getModel<InferSchemaType<typeof ProviderIdentitySchema>>(
      connection,
      "ProviderIdentity",
      ProviderIdentitySchema,
      "providerIdentities",
    ),
    Wedding: getModel<InferSchemaType<typeof WeddingSchema>>(
      connection,
      "Wedding",
      WeddingSchema,
      "weddings",
    ),
    Membership: getModel<InferSchemaType<typeof MembershipSchema>>(
      connection,
      "Membership",
      MembershipSchema,
      "weddingMemberships",
    ),
    MembershipPeriodEvent: getModel<InferSchemaType<typeof MembershipPeriodEventSchema>>(
      connection,
      "MembershipPeriodEvent",
      MembershipPeriodEventSchema,
      "membershipPeriodEvents",
    ),
    CoOwnerInvitation: getModel<InferSchemaType<typeof CoOwnerInvitationSchema>>(
      connection,
      "CoOwnerInvitation",
      CoOwnerInvitationSchema,
      "invitations",
    ),
    MemberSessionFamily: getModel<InferSchemaType<typeof MemberSessionFamilySchema>>(
      connection,
      "MemberSessionFamily",
      MemberSessionFamilySchema,
      "memberSessionFamilies",
    ),
    MemberRefreshSession: getModel<InferSchemaType<typeof MemberRefreshSessionSchema>>(
      connection,
      "MemberRefreshSession",
      MemberRefreshSessionSchema,
      "memberRefreshSessions",
    ),
    AuthSessionAuditEvent: getModel<InferSchemaType<typeof AuthSessionAuditEventSchema>>(
      connection,
      "AuthSessionAuditEvent",
      AuthSessionAuditEventSchema,
      "authSessionAuditEvents",
    ),
  };
}

export { CoOwnerInvitationSchema } from "./co-owner-invitation.schema.js";
export {
  CO_OWNER_INVITATION_TOKEN_BYTES,
  generateCoOwnerInvitationToken,
  hashCoOwnerInvitationToken,
} from "./co-owner-invitation-token.js";
export { MembershipPeriodEventSchema, MembershipSchema } from "./membership.schema.js";
export {
  AuthSessionAuditEventSchema,
  MemberRefreshSessionSchema,
  MemberSessionFamilySchema,
} from "./member-session.schema.js";
export { ProviderIdentitySchema, UserSchema } from "./user.schema.js";
export { WeddingSchema } from "./wedding.schema.js";
