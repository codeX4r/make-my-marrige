import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

// scrypt with default scrypt params: N=16384, r=8, p=1
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export type PasswordHash = {
  salt: string;
  hash: string;
};

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  // scrypt options need to be passed via callback-based API due to TypeScript signature limitations
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      },
    );
  });
}

function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

@Injectable()
export class PasswordHashService {
  readonly minLength = PASSWORD_MIN_LENGTH;
  readonly maxLength = PASSWORD_MAX_LENGTH;

  isValidPassword(password: string): boolean {
    return (
      typeof password === "string" &&
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH
    );
  }

  async hash(password: string): Promise<PasswordHash> {
    if (typeof password !== "string") throw new Error("Password must be a string.");
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      throw new Error(
        `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
      );
    }
    const salt = randomBytes(SALT_BYTES);
    const derivedKey = await deriveKey(password, salt);
    return {
      salt: salt.toString("base64url"),
      hash: derivedKey.toString("base64url"),
    };
  }

  async verify(password: string, stored: PasswordHash): Promise<boolean> {
    if (typeof password !== "string" || typeof stored?.hash !== "string") return false;
    const salt = Buffer.from(stored.salt, "base64url");
    const expected = Buffer.from(stored.hash, "base64url");
    const actual = await deriveKey(password, salt);
    return constantTimeEqual(actual, expected);
  }
}
