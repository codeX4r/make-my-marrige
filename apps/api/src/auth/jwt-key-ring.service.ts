import { Injectable } from "@nestjs/common";
import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";
import type { ApiEnvironment } from "../config.js";

type PublicKeyConfiguration = Record<string, string>;

@Injectable()
export class JwtKeyRingService {
  readonly activeKid: string;
  readonly privateKey: KeyObject;
  private readonly publicKeys: ReadonlyMap<string, KeyObject>;

  constructor(environment: Pick<ApiEnvironment, "AUTH_JWT_ACTIVE_KID" | "AUTH_JWT_PRIVATE_KEY_PEM" | "AUTH_JWT_PUBLIC_KEYS_JSON">) {
    this.activeKid = environment.AUTH_JWT_ACTIVE_KID;
    try {
      const configuredKeys = JSON.parse(environment.AUTH_JWT_PUBLIC_KEYS_JSON) as unknown;
      if (!isPublicKeyConfiguration(configuredKeys)) throw new Error("invalid public-key map");
      this.privateKey = createPrivateKey(environment.AUTH_JWT_PRIVATE_KEY_PEM);
      this.publicKeys = new Map(
        Object.entries(configuredKeys).map(([kid, publicKey]) => [kid, createPublicKey(publicKey)]),
      );
    } catch {
      throw new Error("Invalid RS256 signing-key configuration.");
    }
    if (!this.publicKeys.has(this.activeKid)) {
      throw new Error("The active JWT signing key must have a configured public verification key.");
    }
  }

  getPublicKey(kid: string): KeyObject | undefined {
    return this.publicKeys.get(kid);
  }
}

function isPublicKeyConfiguration(value: unknown): value is PublicKeyConfiguration {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(([kid, pem]) => kid.length > 0 && typeof pem === "string" && pem.length > 0)
  );
}
