import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID, sign, verify } from "node:crypto";
import { JwtKeyRingService } from "./jwt-key-ring.service.js";
import type { AccessTokenClaims, AuthenticatedPrincipal } from "./auth.types.js";

const ACCESS_TOKEN_LIFETIME_SECONDS = 15 * 60;
const ALGORITHM = "RS256";

type JwtHeader = { alg: string; kid: string; typ: string };

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly keyRing: JwtKeyRingService,
    private readonly issuer: string,
    private readonly audience: string,
  ) {}

  sign(userId: string, sessionId: string, now = new Date()): string {
    const iat = Math.floor(now.getTime() / 1000);
    const payload: AccessTokenClaims = {
      sub: userId,
      sid: sessionId,
      iss: this.issuer,
      aud: this.audience,
      iat,
      exp: iat + ACCESS_TOKEN_LIFETIME_SECONDS,
      jti: randomUUID(),
    };
    const header: JwtHeader = { alg: ALGORITHM, kid: this.keyRing.activeKid, typ: "JWT" };
    const signingInput = `${encodeJson(header)}.${encodeJson(payload)}`;
    const signature = sign("RSA-SHA256", Buffer.from(signingInput), this.keyRing.privateKey).toString(
      "base64url",
    );
    return `${signingInput}.${signature}`;
  }

  verify(token: string, now = new Date()): AuthenticatedPrincipal {
    const [encodedHeader, encodedPayload, encodedSignature, ...remaining] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature || remaining.length > 0) throw unauthorized();
    const header = decodeJson<Partial<JwtHeader>>(encodedHeader);
    if (header?.alg !== ALGORITHM || header.typ !== "JWT" || typeof header.kid !== "string") {
      throw unauthorized();
    }
    const publicKey = this.keyRing.getPublicKey(header.kid);
    if (!publicKey) throw unauthorized();
    const validSignature = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url"),
    );
    if (!validSignature) throw unauthorized();
    const claims = decodeJson<Partial<AccessTokenClaims>>(encodedPayload);
    if (!validClaims(claims) || claims.iss !== this.issuer || claims.aud !== this.audience) {
      throw unauthorized();
    }
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (claims.exp <= nowSeconds || claims.iat > nowSeconds + 60) throw unauthorized();
    return {
      userId: claims.sub,
      sessionId: claims.sid,
      tokenId: claims.jti,
      issuedAt: new Date(claims.iat * 1000),
      expiresAt: new Date(claims.exp * 1000),
    };
  }
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return undefined;
  }
}

function validClaims(value: Partial<AccessTokenClaims> | undefined): value is AccessTokenClaims {
  return Boolean(
    value &&
      typeof value.sub === "string" &&
      value.sub.length > 0 &&
      typeof value.sid === "string" &&
      value.sid.length > 0 &&
      typeof value.iss === "string" &&
      typeof value.aud === "string" &&
      typeof value.iat === "number" &&
      Number.isSafeInteger(value.iat) &&
      typeof value.exp === "number" &&
      Number.isSafeInteger(value.exp) &&
      typeof value.jti === "string" &&
      value.jti.length > 0,
  );
}

function unauthorized(): UnauthorizedException {
  return new UnauthorizedException();
}
