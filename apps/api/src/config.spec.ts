import { describe, expect, it } from "vitest";
import { validateApiEnvironment } from "./config.js";

describe("API environment validation", () => {
  it("requires a MongoDB connection string", () => {
    expect(() => validateApiEnvironment({})).toThrow();
  });

  it("accepts a valid local environment with all required auth configuration", () => {
    const env = {
      MONGODB_URI: "mongodb://localhost:27017/app",
      PORT: "4000",
      LOG_LEVEL: "info",
      AUTH_JWT_ISSUER: "https://auth.example.com",
      AUTH_JWT_AUDIENCE: "makemymarrige-api",
      AUTH_JWT_ACTIVE_KID: "dev-key-1",
      AUTH_JWT_PRIVATE_KEY_PEM: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD...\n-----END PRIVATE KEY-----",
      AUTH_JWT_PUBLIC_KEYS_JSON: '{"dev-key-1":"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"}',
      AUTH_ALLOWED_ORIGINS: "http://localhost:3000",
    };
    expect(validateApiEnvironment(env).PORT).toBe(4000);
  });
});
