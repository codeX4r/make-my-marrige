import { createHash, randomBytes } from "node:crypto";

export const CO_OWNER_INVITATION_TOKEN_BYTES = 32;

/**
 * Generates a 256-bit opaque token for delivery by a future invitation workflow.
 * Callers must transmit it once and persist only `hashCoOwnerInvitationToken(token)`.
 */
export function generateCoOwnerInvitationToken(): string {
  return randomBytes(CO_OWNER_INVITATION_TOKEN_BYTES).toString("base64url");
}

export function hashCoOwnerInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
