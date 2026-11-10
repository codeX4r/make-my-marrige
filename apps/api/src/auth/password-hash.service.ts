import { Injectable } from "@nestjs/common";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const DERIVED_KEY_ITERATIONS = 100_000;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export type PasswordHash = {
  salt: string;
  hash: string;
};

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH, { N: 16384, r: 8, p: 1 });
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

  hash(password: string): PasswordHash {
    if (typeof password !== "string") throw new Error("Password must be a string.");
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      throw new Error(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`);
    }
    const salt = randomBytes(SALT_BYTES);
    const derivedKey = deriveKey(password, salt);
    return {
      salt: salt.toString("base64url"),
      hash: derivedKey.toString("base64url"),
    };
  }

  verify(password: string, stored: PasswordHash): boolean {
    if (typeof password !== "string" || typeof stored?.hash !== "string") return false;
    const salt = Buffer.from(stored.salt, "base64url");
    const expected = Buffer.from(stored.hash, "base64url");
    const actual = deriveKey(password, salt);
    return constantTimeEqual(actual, expected);
  }
}